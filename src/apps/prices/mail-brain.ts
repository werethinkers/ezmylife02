// Display price only (the cheapest fetch). Mail Brain is charged per fetch at 0.08 credits a mail, rounded up,
// through the tool_pricing rows mail-desk-12 and mail-desk-25 that the mail-desk function creates; see docs/mail-desk.md.
export const mailBrainPrices: Record<string, number> = {
  "mail-brain": 1,
};
