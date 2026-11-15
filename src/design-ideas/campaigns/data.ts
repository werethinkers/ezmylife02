/*
 * Campaign copy in a stand-up voice. Roast the habit, never the person; joke about ourselves first;
 * end on a real app and its real price (read from the live catalogue, never typed here).
 */
export type Roast = { line: string; fix: string; app: RegExp };
export const ROASTS: Record<string, Roast[]> = {
  Kirana: [
    { line: "Aapka hisaab ek diary mein hai, aur diary ka ek hi backup hai: aapki yaadasht.", fix: "Make a proper bill in a minute.", app: /invoice|bill/i },
    { line: "Udhaar ki list itni lambi hai ki ab wo family tree lagti hai.", fix: "Send the polite reminder so you do not have to.", app: /reminder|khata|ledger/i },
  ],
  Salon: [
    { line: "Appointment book mein teen naam ek hi time pe. Customer bhi confused, aap bhi.", fix: "Give every customer a card with a link.", app: /visiting card|digital card/i },
    { line: "Instagram pe sirf ek photo hai, 2019 ki.", fix: "Fix the 'we exist' problem with a website.", app: /website|portfolio/i },
  ],
  Coaching: [
    { line: "Fee reminder bhejte bhejte aap teacher se collector ban gaye.", fix: "Make receipts that go out by themselves.", app: /receipt|fee/i },
    { line: "Report card WhatsApp pe, handwriting mein, blurry.", fix: "Make a clean certificate or report PDF.", app: /certificate|report/i },
  ],
  Freelancer: [
    { line: "Invoice banane mein itna time lagta hai ki wahi kaam lagta hai.", fix: "Finish it before the chai cools.", app: /invoice/i },
    { line: "Client ne 'kal bhej dunga' bola. Kal 41 din pehle tha.", fix: "Send a quote that looks professional.", app: /quotation|estimate|proposal/i },
  ],
  Clinic: [
    { line: "Prescription ki handwriting sirf chemist samajhta hai. Wo bhi guess karta hai.", fix: "Print a neat slip.", app: /prescription|letterhead|invoice/i },
    { line: "Waiting room mein 14 log, 1 register, 0 system.", fix: "Put a visiting card with a booking link at the desk.", app: /visiting card|digital card/i },
  ],
  "Shop with no website": [
    { line: "Board bada hai, par Google pe aap exist hi nahi karte.", fix: "Get a page, with a card to match.", app: /website|portfolio/i },
    { line: "Logo ka matlab 'Word mein banaya' nahi hota.", fix: "Give the shop a clean first look.", app: /logo|visiting card/i },
  ],
};

export type Line = { title: string; text: string; where: string };
export const HERO_LINES: Line[] = [
  { title: "The honest line", text: "200+ apps, aur sab ek hi kaam karte hain: aapka time bachana.", where: "Home page, top" },
  { title: "The register line", text: "Aapka dukaan abhi bhi register mein chal raha hai?", where: "Home page, top" },
  { title: "The self-roast", text: "Hum software hain. Humse bhi boring cheez sirf aapka GST return hai.", where: "Home page, under the search box" },
];

export const LOADING_LINES = [
  "Hamara server chai pe gaya hai. 3 second mein aata hai.",
  "Kaam ho raha hai. Aap bas ek baar phone mat uthaiye.",
  "Calculator bhi itna sochta hai? Haan, hum bhi.",
  "Aapka bill ban raha hai. Udhaar wala nahi, sahi wala.",
  "Bas ho gaya. Jhooth nahi bol rahe, ab bol rahe hain.",
];

export const PRICE_JOKES: Record<number, string> = {
  1: "Ek chai se sasta.",
  2: "Ek samosa se sasta.",
  3: "Ek auto ki short ride se sasta.",
};
export const priceJoke = (n: number) => PRICE_JOKES[n] ?? "Dukaan ke ek din ke chai-pani se kam.";

export const PUSH_LINES = [
  { time: "9:00 am", title: "Ezyourlife", body: "Aaj ka udhaar wasool hua? Nahi? Chalo ek reminder bana dein." },
  { time: "6:30 pm", title: "Ezyourlife", body: "Din bhar bill hath se likha? Kal se sirf ek tap." },
  { time: "10:00 am", title: "Ezyourlife", body: "GST ki date aa rahi hai. Hum bhi dar rahe hain. Chaliye saath mein dekhte hain." },
];

export const POSTS = [
  {
    hook: "'Mere paas time nahi hai' bolne wale ne 3 ghante invoice banaya.",
    caption: "Tag karo us dost ko jo har mahine wahi invoice naye Word file mein banata hai. Ezyourlife pe ye ek minute ka kaam hai. Ek sahi bill, kam stress.",
    tags: "#EzyourlifeApps #SmallBusinessIndia #DukaanDiaries #InvoiceKaro #IndoreBusiness #MSMEIndia",
    sound: "A light dhol-beat instrumental, upbeat and short",
  },
  {
    hook: "Udhaar ki list itni lambi hai ki ab wo family tree lagti hai.",
    caption: "Roz ek reminder bhejna aapka kaam nahi hai. Hum bhej dete hain, tameez se. Save kar lo, mahine ke end mein kaam aayega.",
    tags: "#EzyourlifeApps #KiranaStore #UdhaarKhata #SmallBusinessIndia #MadhyaPradesh #DukaanTips",
    sound: "A relaxed tabla loop, no lyrics",
  },
];
