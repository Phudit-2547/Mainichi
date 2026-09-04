"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toLocalJournalDate } from "@/lib/journal/date";

export default function TodayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/app/journal/${toLocalJournalDate()}`);
  }, [router]);

  return (
    <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
      Opening today’s journal…
    </div>
  );
}
