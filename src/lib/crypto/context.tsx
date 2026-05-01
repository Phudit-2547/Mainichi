"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearKeyFromSession,
  decryptText,
  deriveKey,
  encryptText,
  loadKeyFromSession,
  saveKeyToSession,
} from "./e2e";

// ── Context shape ─────────────────────────────────────────────────────────────

type CryptoCtx = {
  /** null = key not yet derived (locked) */
  key: CryptoKey | null;
  /** true while checking sessionStorage on mount */
  loading: boolean;
  /** Derive key from password + base64url kdfSalt and persist to sessionStorage */
  unlock: (password: string, kdfSaltB64: string) => Promise<void>;
  /** Wipe key from memory and sessionStorage */
  lock: () => void;
  encryptText: (plaintext: string) => Promise<string>;
  decryptText: (payload: string) => Promise<string>;
};

const CryptoContext = createContext<CryptoCtx | null>(null);

export function useCrypto(): CryptoCtx {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCrypto must be used inside CryptoProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore key from sessionStorage on mount
  useEffect(() => {
    loadKeyFromSession()
      .then((k) => setKey(k))
      .finally(() => setLoading(false));
  }, []);

  const unlock = useCallback(async (password: string, kdfSaltB64: string) => {
    const k = await deriveKey(password, kdfSaltB64);
    await saveKeyToSession(k);
    setKey(k);
  }, []);

  const lock = useCallback(() => {
    clearKeyFromSession();
    setKey(null);
  }, []);

  const encrypt = useCallback(
    async (plaintext: string) => {
      if (!key) throw new Error("Vault is locked");
      return encryptText(key, plaintext);
    },
    [key],
  );

  const decrypt = useCallback(
    async (payload: string) => {
      if (!key) throw new Error("Vault is locked");
      return decryptText(key, payload);
    },
    [key],
  );

  return (
    <CryptoContext.Provider
      value={{ key, loading, unlock, lock, encryptText: encrypt, decryptText: decrypt }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

// ── CryptoGuard ───────────────────────────────────────────────────────────────
// Renders children once the key is available; shows an unlock overlay if not.

type GuardProps = {
  children: ReactNode;
};

export function CryptoGuard({ children }: GuardProps) {
  const { key, loading, unlock } = useCrypto();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !key) {
      inputRef.current?.focus();
    }
  }, [loading, key]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</span>
      </div>
    );
  }

  if (!key) {
    const handleUnlock = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/user/kdf-salt");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/sign-in";
            return;
          }
          throw new Error("Failed to fetch key material");
        }
        const { kdfSalt } = (await res.json()) as { kdfSalt: string };
        await unlock(password, kdfSalt);
        setPassword("");
      } catch {
        setError("Incorrect password or session expired.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Unlock your journal
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your password to decrypt your entries.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
              >
                {error}
              </p>
            )}
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="block min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {busy ? "Unlocking…" : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
