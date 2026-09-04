"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useCrypto } from "@/lib/crypto/context";
import {
  createJournalEntryAction,
  listJournalEntriesAction,
  loadJournalEntryAction,
  saveJournalEntryAction,
} from "@/lib/journal/actions";
import {
  journalExportPath,
  shiftJournalDate,
  toLocalJournalDate,
} from "@/lib/journal/date";
import { createJournalTemplate } from "@/lib/journal/template";
import type { JournalEntryWire } from "@/lib/journal/types";
import { createStoredZip } from "@/lib/journal/zip";

const AUTOSAVE_DELAY_MS = 800;
const BODY_MAX = 100_000;

type SaveStatus =
  | "loading"
  | "saved"
  | "dirty"
  | "saving"
  | "offline"
  | "conflict"
  | "error";

type Conflict = {
  entry: JournalEntryWire;
  body: string;
};

function formatJournalDate(journalDate: string): string {
  const [year, month, day] = journalDate.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function statusLabel(status: SaveStatus, savedAt: Date | null): string {
  switch (status) {
    case "loading":
      return "Loading…";
    case "saving":
      return "Saving…";
    case "dirty":
      return "Unsaved";
    case "offline":
      return "Offline — unsaved in this tab";
    case "conflict":
      return "Conflict detected";
    case "error":
      return "Save failed";
    case "saved":
      return savedAt
        ? `Saved ${savedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Saved";
  }
}

export function DailyJournalEditor({
  journalDate,
}: {
  journalDate: string;
}) {
  return (
    <DailyJournalEditorSession
      key={journalDate}
      journalDate={journalDate}
    />
  );
}

function DailyJournalEditorSession({
  journalDate,
}: {
  journalDate: string;
}) {
  const router = useRouter();
  const { encryptText, decryptText } = useCrypto();
  const [entry, setEntry] = useState<JournalEntryWire | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const mountedRef = useRef(true);
  const generationRef = useRef(0);
  const entryIdRef = useRef<string | null>(null);
  const revisionRef = useRef(1);
  const bodyRef = useRef("");
  const savedBodyRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const conflictRef = useRef(false);
  const saveRunnerRef = useRef<() => Promise<void>>(async () => undefined);

  const clearSaveTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleSave = useCallback(
    (delay = AUTOSAVE_DELAY_MS) => {
      clearSaveTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void saveRunnerRef.current();
      }, delay);
    },
    [clearSaveTimer],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSaveTimer();
    };
  }, [clearSaveTimer]);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    clearSaveTimer();
    savingRef.current = false;
    queuedRef.current = false;
    conflictRef.current = false;
    entryIdRef.current = null;
    revisionRef.current = 1;
    bodyRef.current = "";
    savedBodyRef.current = "";

    async function initialize(): Promise<void> {
      try {
        let remote = await loadJournalEntryAction(journalDate);
        if (!remote) {
          const template = createJournalTemplate({ journalDate });
          const [title, encryptedBody] = await Promise.all([
            encryptText(journalDate),
            encryptText(template),
          ]);
          remote = await createJournalEntryAction({
            journalDate,
            title,
            body: encryptedBody,
          });
        }

        const plaintextBody = await decryptText(remote.body);
        if (!mountedRef.current || generationRef.current !== generation) return;

        entryIdRef.current = remote.id;
        revisionRef.current = remote.revision;
        bodyRef.current = plaintextBody;
        savedBodyRef.current = plaintextBody;
        setEntry(remote);
        setBody(plaintextBody);
        setLastSavedAt(new Date(remote.updatedAt));
        setHasUnsavedChanges(false);
        setStatus("saved");
      } catch {
        if (!mountedRef.current || generationRef.current !== generation) return;
        setMessage(
          navigator.onLine
            ? "The journal could not be opened. Retry without leaving this page."
            : "You are offline. Connect to the internet to open this entry.",
        );
        setStatus(navigator.onLine ? "error" : "offline");
      }
    }

    void initialize();
  }, [journalDate, loadAttempt, encryptText, decryptText, clearSaveTimer]);

  const performSave = useCallback(async (): Promise<void> => {
    const entryId = entryIdRef.current;
    if (!entryId || conflictRef.current) return;

    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    const draft = bodyRef.current;
    if (draft === savedBodyRef.current) {
      if (mountedRef.current) {
        setHasUnsavedChanges(false);
        setStatus("saved");
      }
      return;
    }

    if (!navigator.onLine) {
      if (mountedRef.current) setStatus("offline");
      return;
    }

    const generation = generationRef.current;
    const expectedRevision = revisionRef.current;
    savingRef.current = true;
    queuedRef.current = false;
    if (mountedRef.current) {
      setMessage(null);
      setStatus("saving");
    }

    try {
      const encryptedBody = await encryptText(draft);
      if (generationRef.current !== generation) return;

      const result = await saveJournalEntryAction({
        entryId,
        expectedRevision,
        body: encryptedBody,
      });
      if (!mountedRef.current || generationRef.current !== generation) return;

      if (result.status === "updated") {
        revisionRef.current = result.entry.revision;
        savedBodyRef.current = draft;
        setEntry(result.entry);
        setLastSavedAt(new Date(result.entry.updatedAt));

        if (bodyRef.current === draft) {
          setHasUnsavedChanges(false);
          setStatus("saved");
        } else {
          queuedRef.current = true;
          setHasUnsavedChanges(true);
          setStatus("dirty");
        }
        return;
      }

      if (result.status === "conflict") {
        const serverBody = await decryptText(result.entry.body);
        if (!mountedRef.current || generationRef.current !== generation) return;
        conflictRef.current = true;
        queuedRef.current = false;
        setConflict({ entry: result.entry, body: serverBody });
        setHasUnsavedChanges(bodyRef.current !== serverBody);
        setStatus("conflict");
        return;
      }

      setMessage("This entry no longer exists. Reload to create it again.");
      setStatus("error");
    } catch {
      if (!mountedRef.current || generationRef.current !== generation) return;
      setMessage(
        navigator.onLine
          ? "Autosave failed. Your draft remains in this tab; use Save now to retry."
          : "You are offline. Your draft remains in this tab until it is saved.",
      );
      setStatus(navigator.onLine ? "error" : "offline");
    } finally {
      if (generationRef.current === generation) {
        savingRef.current = false;
        if (
          queuedRef.current &&
          !conflictRef.current &&
          bodyRef.current !== savedBodyRef.current
        ) {
          queuedRef.current = false;
          queueMicrotask(() => void saveRunnerRef.current());
        }
      }
    }
  }, [encryptText, decryptText]);

  useEffect(() => {
    saveRunnerRef.current = performSave;
  }, [performSave]);

  const navigateSafely = useCallback(
    async (href: string) => {
      clearSaveTimer();
      if (!conflictRef.current && bodyRef.current !== savedBodyRef.current) {
        await saveRunnerRef.current();
      }

      if (
        conflictRef.current ||
        savingRef.current ||
        bodyRef.current !== savedBodyRef.current
      ) {
        const leave = window.confirm(
          "This journal draft is not safely saved. Leave this page anyway?",
        );
        if (!leave) return;
      }
      router.push(href);
    },
    [router, clearSaveTimer],
  );

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.target === "_blank" ||
        anchor.origin !== window.location.origin
      ) {
        return;
      }
      if (
        !conflictRef.current &&
        !savingRef.current &&
        bodyRef.current === savedBodyRef.current
      ) {
        return;
      }

      event.preventDefault();
      void navigateSafely(
        `${anchor.pathname}${anchor.search}${anchor.hash}`,
      );
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [navigateSafely]);

  useEffect(() => {
    const handleOnline = () => {
      if (
        entryIdRef.current &&
        !conflictRef.current &&
        bodyRef.current !== savedBodyRef.current
      ) {
        setStatus("dirty");
        scheduleSave(0);
      }
    };
    const handleOffline = () => {
      if (bodyRef.current !== savedBodyRef.current) setStatus("offline");
    };
    const handleVisibility = () => {
      if (
        document.visibilityState === "hidden" &&
        bodyRef.current !== savedBodyRef.current &&
        !conflictRef.current
      ) {
        clearSaveTimer();
        void saveRunnerRef.current();
      }
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        savingRef.current ||
        conflictRef.current ||
        bodyRef.current !== savedBodyRef.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [scheduleSave, clearSaveTimer]);

  const handleBodyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    bodyRef.current = next;
    setBody(next);
    setHasUnsavedChanges(next !== savedBodyRef.current);
    setMessage(null);

    if (conflictRef.current) return;
    setStatus(navigator.onLine ? "dirty" : "offline");
    scheduleSave();
  };

  const handleSaveNow = async () => {
    clearSaveTimer();
    await saveRunnerRef.current();
  };

  const handleReloadServerVersion = () => {
    if (!conflict) return;
    entryIdRef.current = conflict.entry.id;
    revisionRef.current = conflict.entry.revision;
    bodyRef.current = conflict.body;
    savedBodyRef.current = conflict.body;
    conflictRef.current = false;
    queuedRef.current = false;
    setEntry(conflict.entry);
    setBody(conflict.body);
    setLastSavedAt(new Date(conflict.entry.updatedAt));
    setHasUnsavedChanges(false);
    setConflict(null);
    setMessage(null);
    setStatus("saved");
  };

  const handleOverwriteWithDraft = () => {
    if (!conflict) return;
    revisionRef.current = conflict.entry.revision;
    savedBodyRef.current = conflict.body;
    conflictRef.current = false;
    queuedRef.current = false;
    setEntry(conflict.entry);
    setHasUnsavedChanges(bodyRef.current !== conflict.body);
    setConflict(null);
    setMessage(null);
    setStatus("dirty");
    scheduleSave(0);
  };

  const handleRetry = () => {
    clearSaveTimer();
    setEntry(null);
    setBody("");
    setConflict(null);
    setMessage(null);
    setStatus("loading");
    setLastSavedAt(null);
    setExporting(false);
    setExportError(null);
    setHasUnsavedChanges(false);
    setLoadAttempt((attempt) => attempt + 1);
  };

  const handleExportCurrent = () => {
    downloadBlob(
      new Blob([ensureTrailingNewline(bodyRef.current)], {
        type: "text/markdown;charset=utf-8",
      }),
      `${journalDate}.md`,
    );
  };

  const handleExportAll = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const remoteEntries = await listJournalEntriesAction();
      const files = await Promise.all(
        remoteEntries.map(async (remote) => ({
          path: journalExportPath(remote.journalDate),
          content: ensureTrailingNewline(
            remote.id === entryIdRef.current
              ? bodyRef.current
              : await decryptText(remote.body),
          ),
          modifiedAt: new Date(remote.updatedAt),
        })),
      );
      const archive = createStoredZip(files);
      downloadBlob(
        new Blob([archive.buffer as ArrayBuffer], {
          type: "application/zip",
        }),
        `mainichi-journal-${toLocalJournalDate()}.zip`,
      );
    } catch {
      setExportError("The Markdown archive could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const previousDate = shiftJournalDate(journalDate, -1);
  const nextDate = shiftJournalDate(journalDate, 1);
  const today = toLocalJournalDate();

  if (status === "loading") {
    return (
      <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Opening {journalDate}…
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="space-y-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h1 className="text-lg font-semibold text-red-900 dark:text-red-100">
          Could not open {journalDate}
        </h1>
        <p className="text-sm text-red-800 dark:text-red-200">
          {message ?? "The entry is unavailable."}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex min-h-11 items-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <article className="space-y-5">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Daily journal
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
              {formatJournalDate(journalDate)}
            </h1>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="min-h-6 text-sm text-zinc-500 dark:text-zinc-400"
          >
            {statusLabel(status, lastSavedAt)}
          </p>
        </div>

        <nav
          aria-label="Journal dates"
          className="flex flex-wrap items-center gap-2"
        >
          <Link
            href={`/app/journal/${previousDate}`}
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Previous
          </Link>
          {journalDate !== today && (
            <Link
              href="/app/today"
              className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Today
            </Link>
          )}
          <Link
            href={`/app/journal/${nextDate}`}
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Next
          </Link>
        </nav>
      </header>

      {conflict && (
        <section
          role="alert"
          className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          <div className="space-y-1">
            <h2 className="font-semibold">Another device saved this entry.</h2>
            <p className="text-sm">
              Nothing was overwritten. Load the newer server version, or
              explicitly replace it with the draft currently shown below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReloadServerVersion}
              className="inline-flex min-h-11 items-center rounded-md bg-amber-950 px-4 text-sm font-medium text-amber-50 hover:bg-amber-900 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-amber-200"
            >
              Load newer version
            </button>
            <button
              type="button"
              onClick={handleOverwriteWithDraft}
              className="inline-flex min-h-11 items-center rounded-md border border-amber-500 px-4 text-sm font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
            >
              Replace with my draft
            </button>
          </div>
        </section>
      )}

      {message && entry && status !== "conflict" && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {message}
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="journal-body"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Entry <span className="font-normal text-zinc-500">Markdown</span>
        </label>
        <textarea
          id="journal-body"
          value={body}
          onChange={handleBodyChange}
          maxLength={BODY_MAX}
          spellCheck
          className="block min-h-[65vh] w-full rounded-md border border-zinc-300 bg-white px-3 py-3 font-mono text-base leading-relaxed text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        <div className="flex justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{hasUnsavedChanges ? "Draft differs from server" : "Up to date"}</span>
          <span>
            {body.length.toLocaleString()} / {BODY_MAX.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSaveNow}
          disabled={
            status === "saving" ||
            status === "conflict" ||
            !hasUnsavedChanges
          }
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Save now
        </button>
        <button
          type="button"
          onClick={handleExportCurrent}
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Export this .md
        </button>
        <button
          type="button"
          onClick={handleExportAll}
          disabled={exporting}
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {exporting ? "Creating archive…" : "Export all .zip"}
        </button>
      </div>

      {exportError && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {exportError}
        </p>
      )}
    </article>
  );
}
