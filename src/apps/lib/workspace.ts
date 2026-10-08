import { useAppStore } from "./store";
import type { ProfileKey } from "../types";

/*
 * The shared workspace profile: filled once, it prefills every app (business name, city,
 * GSTIN, audience, tone…), so tools work as one connected workspace instead of 165
 * separate forms.
 */

export type WorkspaceProfile = Partial<Record<ProfileKey, string>>;

export const PROFILE_FIELDS: { key: ProfileKey; label: string; placeholder: string; half?: boolean }[] = [
  { key: "businessName", label: "Business name", placeholder: "Sharma Sweets", half: true },
  { key: "ownerName", label: "Your name", placeholder: "Priya Sharma", half: true },
  { key: "industry", label: "What you do", placeholder: "Sweet shop & catering / GST accountant / boutique", half: true },
  { key: "city", label: "City", placeholder: "Indore", half: true },
  { key: "state", label: "State", placeholder: "Madhya Pradesh", half: true },
  { key: "gstin", label: "GSTIN (optional)", placeholder: "23ABCDE1234F1Z5", half: true },
  { key: "phone", label: "Phone / WhatsApp", placeholder: "+91 98xxxxxx10", half: true },
  { key: "email", label: "Email", placeholder: "hello@yourbusiness.in", half: true },
  { key: "address", label: "Address", placeholder: "Shop 4, MG Road, Indore 452001" },
  { key: "website", label: "Website / Instagram", placeholder: "instagram.com/sharmasweets", half: true },
  { key: "language", label: "Preferred language", placeholder: "English / Hindi / Hinglish", half: true },
  { key: "products", label: "Main products or services", placeholder: "Kaju katli, namkeen, wedding catering" },
  { key: "audience", label: "Your customers", placeholder: "Families and offices in Indore; wedding planners" },
  { key: "tone", label: "Brand tone", placeholder: "Warm, trustworthy, festive", half: true },
];

export function useWorkspace() {
  const { data, update, syncState, signedIn } = useAppStore<{ profile: WorkspaceProfile; savedAt?: number }>("_workspace", {
    profile: {},
  });
  const profile = data.profile ?? {};
  const filled = PROFILE_FIELDS.filter((f) => (profile[f.key] ?? "").trim()).length;
  return {
    profile,
    filled,
    total: PROFILE_FIELDS.length,
    setProfile: (p: WorkspaceProfile) => update({ profile: { ...profile, ...p } }),
    syncState,
    signedIn,
  };
}
