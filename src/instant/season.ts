// Which months each festival card is in season, so "Other designs" shows what people are sending now.
const MONTHS: Record<string, number[]> = {
  diwali: [10, 11], dhanteras: [10, 11], govardhan: [10, 11], "bhai-dooj": [10, 11], "veer-nirvan": [10, 11], holi: [3], "raksha-bandhan": [8], christmas: [12], "new-year": [12, 1], eid: [3, 4, 6, 7],
  "independence-day": [8], "republic-day": [1], "womens-day": [3], "ganesh-chaturthi": [8, 9], navratri: [9, 10],
  "makar-sankranti": [1], "pongal-onam": [1, 8, 9], "mahavir-jayanti": [3, 4], kshamavani: [8, 9], gurpurab: [11],
};

/** How many months away this card's season is (0 = in season now). Cards with no season sort as in season. */
export function seasonGap(id: string, now = new Date()): number {
  const m = MONTHS[id];
  if (!m) return 0;
  const cur = now.getMonth() + 1;
  return Math.min(...m.map((x) => { const d = Math.abs(x - cur); return Math.min(d, 12 - d); }));
}
