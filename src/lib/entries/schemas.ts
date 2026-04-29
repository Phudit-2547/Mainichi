import { z } from "zod";

const TITLE_MAX = 200;
const BODY_MAX = 100_000;

export const EntryInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer`),
  body: z
    .string()
    .max(BODY_MAX, `Body must be ${BODY_MAX} characters or fewer`),
});

export type EntryInput = z.infer<typeof EntryInputSchema>;

export type EntryFormState =
  | {
      errors?: { title?: string[]; body?: string[]; form?: string[] };
      values?: { title?: string; body?: string };
    }
  | undefined;
