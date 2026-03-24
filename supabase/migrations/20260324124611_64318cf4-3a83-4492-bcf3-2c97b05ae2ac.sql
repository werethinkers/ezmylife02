ALTER TABLE meet_nudge_events ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE meet_nudge_contacts ADD COLUMN deleted_at timestamptz DEFAULT NULL;