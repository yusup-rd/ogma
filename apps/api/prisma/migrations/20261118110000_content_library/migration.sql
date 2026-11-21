
CREATE TABLE "library_entries" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "current_revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),
    CONSTRAINT "library_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "library_entry_revisions" (
    "entry_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "library_entry_revisions_pkey" PRIMARY KEY ("entry_id", "revision")
);

CREATE INDEX "library_entries_owner_id_archived_at_updated_at_idx" ON "library_entries"("owner_id", "archived_at", "updated_at");

ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "library_entry_revisions" ADD CONSTRAINT "library_entry_revisions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "library_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
