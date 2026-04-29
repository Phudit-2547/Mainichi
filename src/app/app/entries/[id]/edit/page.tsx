import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { updateEntryAction } from "@/lib/entries/actions";
import { getEntry } from "@/lib/entries/dal";
import { EntryForm } from "../../_components/entry-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditEntryPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const entry = await getEntry(user.id, id);
  if (!entry) notFound();

  const action = updateEntryAction.bind(null, entry.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Edit entry
      </h1>
      <EntryForm
        action={action}
        submitLabel="Save changes"
        initial={{ title: entry.title, body: entry.body }}
        cancelHref={`/app/entries/${entry.id}`}
      />
    </div>
  );
}
