ALTER TABLE "entries" ADD COLUMN "journal_date" date;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "entries_user_journal_date_unique" ON "entries" USING btree ("user_id","journal_date");