import { z } from "zod";
import { isJournalDate } from "./date";

const CIPHERTEXT_MAX = 450_000;

export const JournalDateSchema = z
  .string()
  .refine(isJournalDate, "Journal date must be a real YYYY-MM-DD date");

const CiphertextSchema = z
  .string()
  .min(1, "Encrypted content is required")
  .max(CIPHERTEXT_MAX, "Encrypted content is too large");

export const CreateJournalEntrySchema = z.object({
  journalDate: JournalDateSchema,
  title: z.string().min(1).max(512),
  body: CiphertextSchema,
});

export const SaveJournalEntrySchema = z.object({
  entryId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
  body: CiphertextSchema,
});
