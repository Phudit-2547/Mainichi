import { notFound } from "next/navigation";
import { isJournalDate } from "@/lib/journal/date";
import { DailyJournalEditor } from "../_components/daily-journal-editor";

export default async function JournalDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isJournalDate(date)) notFound();

  return <DailyJournalEditor journalDate={date} />;
}
