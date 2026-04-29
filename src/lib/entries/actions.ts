"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  createEntry,
  deleteEntry,
  getEntry,
  updateEntry,
} from "./dal";
import { EntryInputSchema, type EntryFormState } from "./schemas";

function parseForm(formData: FormData) {
  return EntryInputSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
  });
}

function toFieldErrors(parsed: ReturnType<typeof parseForm>): EntryFormState {
  if (parsed.success) return undefined;
  const flat = parsed.error.flatten().fieldErrors;
  return { errors: { title: flat.title, body: flat.body } };
}

export async function createEntryAction(
  _state: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await getCurrentUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ...toFieldErrors(parsed),
      values: {
        title: String(formData.get("title") ?? ""),
        body: String(formData.get("body") ?? ""),
      },
    };
  }

  const entry = await createEntry(user.id, parsed.data);
  revalidatePath("/app/entries");
  redirect(`/app/entries/${entry.id}`);
}

export async function updateEntryAction(
  entryId: string,
  _state: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await getCurrentUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ...toFieldErrors(parsed),
      values: {
        title: String(formData.get("title") ?? ""),
        body: String(formData.get("body") ?? ""),
      },
    };
  }

  const updated = await updateEntry(user.id, entryId, parsed.data);
  if (!updated) {
    return { errors: { form: ["Entry not found."] } };
  }
  revalidatePath("/app/entries");
  revalidatePath(`/app/entries/${entryId}`);
  redirect(`/app/entries/${entryId}`);
}

export async function deleteEntryAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) redirect("/app/entries");

  // Confirm ownership before delete (avoids a 404→redirect loop when the
  // entry is gone or never belonged to the caller).
  const existing = await getEntry(user.id, entryId);
  if (!existing) redirect("/app/entries");

  await deleteEntry(user.id, entryId);
  revalidatePath("/app/entries");
  redirect("/app/entries");
}
