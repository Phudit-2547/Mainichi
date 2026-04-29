import { createEntryAction } from "@/lib/entries/actions";
import { EntryForm } from "../_components/entry-form";

export default function NewEntryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        New entry
      </h1>
      <EntryForm
        action={createEntryAction}
        submitLabel="Save entry"
        cancelHref="/app/entries"
      />
    </div>
  );
}
