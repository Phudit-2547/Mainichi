import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getEntry } from "@/lib/entries/dal";
import { EntryDetail } from "../_components/entry-detail";

type Props = { params: Promise<{ id: string }> };

export default async function EntryDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const entry = await getEntry(user.id, id);
  if (!entry) notFound();
  if (entry.journalDate) redirect(`/app/journal/${entry.journalDate}`);

  return <EntryDetail entry={entry} />;
}
