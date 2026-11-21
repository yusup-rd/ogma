ALTER TABLE library_entries ADD COLUMN archive_token UUID;
UPDATE library_entries SET archive_token = gen_random_uuid() WHERE archived_at IS NOT NULL;
