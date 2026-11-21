
WITH active_entries AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "owner_id", "kind" ORDER BY "updated_at" DESC, "id") AS "position"
  FROM "library_entries"
  WHERE "archived_at" IS NULL AND "kind" IN ('personal', 'summary', 'links')
)
UPDATE "library_entries" AS entry
SET "archived_at" = CURRENT_TIMESTAMP
FROM active_entries
WHERE entry."id" = active_entries."id" AND active_entries."position" > 1;

CREATE UNIQUE INDEX "library_entries_one_active_master_section"
ON "library_entries" ("owner_id", "kind")
WHERE "archived_at" IS NULL AND "kind" IN ('personal', 'summary', 'links');
