

# Add Soft Delete + Undo for Meet Nudge Events

## Problem
Events and their contacts are permanently deleted immediately with no confirmation or recovery option. A user accidentally deleted an event and lost all contacts.

## Current Behavior
`deleteEvent` does a hard `DELETE` on both `meet_nudge_contacts` and `meet_nudge_events` rows -- data is gone forever.

## Solution: Soft Delete with Undo + Confirmation Dialog

### Step 1: Database Migration -- Add soft delete columns
Add `deleted_at` (nullable timestamp) to both `meet_nudge_events` and `meet_nudge_contacts` tables. Update RLS policies and queries to filter by `deleted_at IS NULL`.

```sql
ALTER TABLE meet_nudge_events ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE meet_nudge_contacts ADD COLUMN deleted_at timestamptz DEFAULT NULL;
```

### Step 2: Update EventsDashboard.tsx
- **Confirmation dialog**: Add an `AlertDialog` before delete (using existing `alert-dialog.tsx` component). "Are you sure? This will archive the event and its contacts."
- **Soft delete**: Instead of `DELETE`, set `deleted_at = now()` on the event and its contacts.
- **Undo toast**: After soft-deleting, show a toast with an "Undo" action button. Clicking it sets `deleted_at = null` on both event and contacts.
- **Auto-purge timeout**: After 30 seconds, if not undone, the undo option expires (data stays soft-deleted in DB but disappears from UI).
- **Filter queries**: Update `fetchData` to only fetch rows where `deleted_at IS NULL`.

### Step 3: Recovery of contacts
Since we're switching to soft delete, contacts are preserved. The undo restores both the event AND all its contacts. Even if the undo window passes, an admin could still recover data from the database since rows aren't hard-deleted.

### Technical Details

**Soft delete function:**
```typescript
const deleteEvent = async (id: string) => {
  const now = new Date().toISOString();
  await supabase.from("meet_nudge_contacts").update({ deleted_at: now }).eq("event_id", id);
  await supabase.from("meet_nudge_events").update({ deleted_at: now }).eq("id", id);
  // Show undo toast
};
```

**Undo function:**
```typescript
const undoDelete = async (eventId: string) => {
  await supabase.from("meet_nudge_events").update({ deleted_at: null }).eq("id", eventId);
  await supabase.from("meet_nudge_contacts").update({ deleted_at: null }).eq("event_id", eventId);
};
```

**Files to modify:**
- Database migration (add `deleted_at` columns)
- `src/components/meet-nudge/EventsDashboard.tsx` (soft delete, undo toast, confirmation dialog, filtered queries)

