

# Meet Nudge Flow Overhaul — Nudge ID, Auto-Accounts, Single-Page Form, Admin Networking View

## Overview

Transform the guest form from a multi-step wizard into a single-page form. When a guest submits via a host's QR/link, automatically create a background account, populate their profile, grant 1-month complimentary access, and give them their own Nudge ID + event — so they can immediately start networking themselves.

---

## Database Changes (Migration)

**1. Add `nudge_id` column to `meet_nudge_profiles`:**
```sql
ALTER TABLE public.meet_nudge_profiles ADD COLUMN nudge_id text UNIQUE;
```

**2. Add `connected_via_host_id` to `meet_nudge_contacts`** to track who-connected-with-whom:
```sql
ALTER TABLE public.meet_nudge_contacts ADD COLUMN connected_via_host_id uuid;
```

**3. RLS: Allow admin SELECT on `meet_nudge_profiles`:**
```sql
CREATE POLICY "Admins can view all profiles" ON public.meet_nudge_profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Moderators can view all profiles" ON public.meet_nudge_profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'));
```

---

## New Edge Function: `meet-nudge-signup`

Handles the background account creation securely server-side using the service role key:

1. Receives guest form data + host's event_id
2. Checks if email already exists → if so, just link the contact and return existing nudge_id
3. If new: creates user via `supabase.auth.admin.createUser()` with a random password and `email_confirm: true`
4. Creates `profiles` entry with form data (name, phone, company, occupation, location, etc.)
5. Creates `meet_nudge_profiles` entry with a generated Nudge ID
6. Generates Nudge ID: `[FIRST_NAME]-[WORD]-[2-digit]` from a predefined word list, retries on collision
7. Grants 1-month complimentary `premium_access` (access_type: 'complimentary')
8. Auto-creates a "My Network" event in `meet_nudge_events` for the new user
9. Inserts contact record linking guest → host's event
10. Also inserts a reciprocal contact record (host info → guest's event) for bidirectional networking
11. Returns: nudge_id, event slug, and host profile for the success screen

---

## Frontend Changes

### `src/pages/MeetNudgeGuestForm.tsx` — Complete Rewrite

**Single-page form** showing all fields at once in a clean card layout:
- Name (required), Phone (required), Email (required — needed for account), Occupation (required)
- Business Name, Location, Website, LinkedIn, Fun Fact (optional)
- Add a "Nudge ID" input at the top: "Already have a Nudge ID? Enter it to skip the form"
  - On entering a valid Nudge ID → fetch that user's profile → auto-fill form → show "Welcome back" state

**On submit:**
1. Insert contact into `meet_nudge_contacts` (existing behavior)
2. Call `meet-nudge-signup` edge function with all form data
3. Show success screen with:
   - Host's contact card (existing)
   - Guest's new **Nudge ID** prominently displayed
   - "Your Nudge ID: ABHI-ORBIT-23 — Share this at events!"
   - CTA: **"Create Account & Start Networking →"** which navigates to `/meet-nudge`
   - The account already exists, so this just triggers a magic link login or shows a "check your email" prompt

### `src/pages/MeetNudge.tsx` — Show Nudge ID

- Display the user's Nudge ID in the header next to their name
- Add a "Share Nudge ID" button that copies it
- Show Nudge ID in QR dialog alongside the QR code

### `src/components/meet-nudge/HostProfileSetup.tsx` — Single-page form

- Convert from multi-step wizard to single-page form showing all fields at once
- Keep the pre-fill from profile logic

### Admin Dashboard — New "Meet Nudge" tab

**Add to `src/pages/AdminDashboard.tsx`:**
- New tab: "Meet Nudge" with networking data
- Component: `src/components/admin/MeetNudgeAdmin.tsx`
- Shows:
  - All Meet Nudge users (profiles with nudge_ids)
  - All contacts with who-connected-with-whom mapping
  - Event-wise networking data (which events, how many contacts per event)
  - Search/filter by name, nudge ID, event

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/meet-nudge-signup/index.ts` | Create — background account creation |
| `src/pages/MeetNudgeGuestForm.tsx` | Rewrite — single-page form + Nudge ID lookup + CTA flow |
| `src/components/meet-nudge/HostProfileSetup.tsx` | Modify — single-page form |
| `src/pages/MeetNudge.tsx` | Modify — show Nudge ID, share button |
| `src/components/admin/MeetNudgeAdmin.tsx` | Create — admin networking view |
| `src/pages/AdminDashboard.tsx` | Modify — add Meet Nudge tab |
| Migration SQL | Add `nudge_id` column, `connected_via_host_id`, admin RLS policies |

---

## Nudge ID Format

Generated server-side in the edge function:
- Format: `[FIRST_NAME]-[WORD]-[NN]`
- Word list: ~50 simple words (ORBIT, WAVE, SPARK, BLAZE, PEAK, FLUX, PULSE, NEXUS, GLOW, DASH, etc.)
- First name extracted from full name, uppercased
- 2-digit random number (10-99)
- On collision: retry with different word/number combo (max 10 attempts)

---

## Flow Summary

```text
Guest scans Host X's QR → Single-page form opens
  ↓
Guest fills form (or enters existing Nudge ID to skip)
  ↓
Submit → Contact saved to Host X's event
       → Edge function creates guest account + profile + premium access
       → Guest gets Nudge ID + their own auto-event
  ↓
Success screen: Host's card + Guest's Nudge ID + "Start Networking" CTA
  ↓
CTA → Magic link sent → Guest lands in /meet-nudge with everything ready
```

---

## Limitations

- The "instant login" after form submission requires the user to click a magic link from their email — we cannot auto-login a user created server-side without them verifying
- The `premium_access` entry uses `access_type: 'complimentary'` which needs to be added to the check constraint

