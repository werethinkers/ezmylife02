import type { GstMode, ModuleId, Product, Settings } from "./types";

/* The business types My Business knows, sorted by sector and size.
   Each type switches modules on, names things in its own words and starts with a few example
   products or services, which the owner edits. 99 types now; the plan is 1,000 (see docs/my-business.md). */

export type SectorId =
  | "retail" | "home" | "grocery" | "foodsvc" | "making" | "health" | "edu" | "pro"
  | "fashion" | "beauty" | "farm" | "transport" | "events" | "tech" | "online";
export type SizeId = "street" | "shop" | "expert" | "growing" | "startup";

export const SECTORS: { id: SectorId; name: string; colour: string; planned: number }[] = [
  { id: "retail", name: "Retail shops", colour: "bg-sun", planned: 110 },
  { id: "home", name: "Home and repair services", colour: "bg-coral", planned: 90 },
  { id: "grocery", name: "Food and grocery", colour: "bg-lime", planned: 80 },
  { id: "foodsvc", name: "Food service", colour: "bg-pink", planned: 80 },
  { id: "making", name: "Workshops and making", colour: "bg-sand", planned: 80 },
  { id: "health", name: "Health and care", colour: "bg-teal", planned: 70 },
  { id: "edu", name: "Education and coaching", colour: "bg-sky", planned: 70 },
  { id: "pro", name: "Professional services", colour: "bg-sky", planned: 70 },
  { id: "fashion", name: "Fashion and textiles", colour: "bg-pink", planned: 60 },
  { id: "beauty", name: "Beauty and wellness", colour: "bg-pink", planned: 50 },
  { id: "farm", name: "Farming and dairy", colour: "bg-lime", planned: 50 },
  { id: "transport", name: "Transport and travel", colour: "bg-sun", planned: 50 },
  { id: "events", name: "Events and stays", colour: "bg-coral", planned: 50 },
  { id: "tech", name: "Tech and startups", colour: "bg-teal", planned: 50 },
  { id: "online", name: "Online sellers and creators", colour: "bg-sky", planned: 40 },
];

export const SIZES: { id: SizeId; name: string }[] = [
  { id: "street", name: "Street and home" },
  { id: "shop", name: "Shop" },
  { id: "expert", name: "Expert" },
  { id: "growing", name: "Growing business" },
  { id: "startup", name: "Startup" },
];

export interface BizType { id: string; name: string; local: string; sector: SectorId; size: SizeId; jobs: [string, string]; words: string }

// name | local name | sector | size | team job 1 | team job 2 | extra search words
const RAW = `Sabzi thela|सब्ज़ी ठेला|grocery|street|Udhaar reminder every Monday|Daily cash count at closing|sabji thele vegetable cart
Fruit cart|फल का ठेला|grocery|street|Festival offer to regulars|Daily cash count|phal thele
Dairy booth|दूध डेयरी|grocery|shop|Monthly milk bill to each home|Missed payment reminder|doodh milk
Egg and bread stall|अंडा ब्रेड|grocery|street|Morning order list on WhatsApp|Udhaar reminder|anda
Dry fruits shop|ड्राई फ्रूट्स|grocery|shop|Diwali gift box offer|Stock low alert|
Organic vegetable delivery|ऑर्गेनिक सब्ज़ी|grocery|startup|Weekly subscription renewals|New lead follow-up|sabzi sabji
Atta chakki|आटा चक्की|grocery|shop|Order ready message|Monthly khata statement|flour mill
Kirana store|किराना दुकान|retail|shop|Dues reminder with UPI link|Supplier order on WhatsApp|general store grocery dukan
Medical store|मेडिकल स्टोर|retail|shop|Refill reminder for regular medicines|Expiry watch|chemist pharmacy dawai
Stationery shop|स्टेशनरी|retail|shop|School season offer|Bulk order quote|
Mobile shop|मोबाइल शॉप|retail|shop|EMI due reminder|Accessory offer after purchase|phone
Hardware store|हार्डवेयर|retail|shop|Contractor dues reminder|Quote in 2 minutes|
Sweet shop|मिठाई की दुकान|retail|shop|Festival pre-order list|Bulk order follow-up|mithai halwai
Paan shop|पान की दुकान|retail|street|Daily cash count|Stock list for tomorrow|gumti
Furniture showroom|फर्नीचर शोरूम|retail|growing|Delivery date updates|Quote follow-up on day 3|
Electrician|इलेक्ट्रीशियन|home|street|Job booking reminder|Bill with UPI link after the job|bijli
Plumber|प्लंबर|home|street|Next visit reminder|Bill after the job|
AC repair service|एसी रिपेयर|home|shop|Service due before summer|Annual contract renewal|
Pest control|पेस्ट कंट्रोल|home|growing|Next treatment reminder|Quote follow-up|
Carpenter|बढ़ई|home|street|Quote with advance link|Work update photos to client|
House painter|पेंटर|home|street|Quote in 2 minutes|Balance payment reminder|
Packers and movers|पैकर्स मूवर्स|home|growing|Moving day checklist to customer|Review request after move|
Tiffin service|टिफ़िन सर्विस|foodsvc|street|Monthly bill to each customer|Tomorrow's menu on WhatsApp|dabba khana
Chaat stall|चाट ठेला|foodsvc|street|Weekend offer to regulars|Daily cash count|thela pani puri
Cafe|कैफ़े|foodsvc|shop|Google review request|Slow day offer|
Dhaba|ढाबा|foodsvc|shop|Supplier order|Daily sales summary|restaurant
Cloud kitchen|क्लाउड किचन|foodsvc|growing|Repeat order offer|Staff shift reminder|
Caterer|केटरर|foodsvc|growing|Event quote follow-up|Advance and balance reminders|
Bakery|बेकरी|foodsvc|shop|Cake order ready message|Birthday offer to regulars|cake
Furniture maker|फर्नीचर कारीगर|making|shop|Order progress update|Advance payment link|
Printing press|प्रिंटिंग प्रेस|making|shop|Proof approval reminder|Quote follow-up|
Garment unit|गारमेंट यूनिट|making|growing|Buyer order follow-up|Worker attendance sheet|factory
Welding workshop|वेल्डिंग|making|street|Quote with advance link|Balance reminder|
Potter|कुम्हार|making|street|Diwali diya pre-orders|Bulk buyer follow-up|
Namkeen maker|नमकीन निर्माता|making|growing|Distributor dues|FSSAI renewal reminder|
Candle maker|मोमबत्ती|making|street|Festival bulk order offer|Weekly Instagram post|
Clinic|क्लिनिक|health|expert|Appointment reminder|Follow-up visit reminder|doctor
Dentist|डेंटिस्ट|health|expert|Six-month check-up reminder|Treatment balance reminder|
Physiotherapist|फिज़ियोथेरेपिस्ट|health|expert|Session reminder|Exercise sheet after visit|
Pathology lab|पैथोलॉजी लैब|health|growing|Report ready message|Home sample booking|
Yoga teacher|योग टीचर|health|expert|Monthly fee reminder|Class timing update|
Elder care service|बुज़ुर्ग देखभाल|health|growing|Caregiver shift roster|Weekly update to family|
Home tutor|होम ट्यूटर|edu|expert|Monthly fee reminder|Test marks to parents|tuition
Coaching centre|कोचिंग सेंटर|edu|growing|Admission enquiry follow-up|Fee instalment reminders|
Dance class|डांस क्लास|edu|expert|Batch timing update|Fee reminder|
Driving school|ड्राइविंग स्कूल|edu|shop|Lesson slot reminder|Licence test date alert|
Preschool|प्ले स्कूल|edu|growing|Admission follow-up|Notice to all parents|
Music teacher|संगीत शिक्षक|edu|expert|Class reminder|Fee reminder|
Computer institute|कंप्यूटर संस्थान|edu|growing|Course enquiry follow-up|Certificate ready message|
CA practice|सीए ऑफ़िस|pro|expert|GST filing date reminders to clients|Fee invoice and follow-up|chartered accountant
Lawyer|वकील|pro|expert|Hearing date reminder|Fee reminder|advocate
Architect|आर्किटेक्ट|pro|expert|Stage payment reminder|Drawing approval follow-up|
Insurance agent|बीमा एजेंट|pro|expert|Policy renewal reminder|Birthday greeting to clients|LIC
Property dealer|प्रॉपर्टी डीलर|pro|expert|Site visit follow-up|New listing to buyers list|real estate
Tax consultant|टैक्स सलाहकार|pro|expert|ITR deadline reminder|Document checklist to clients|
Recruitment agency|प्लेसमेंट एजेंसी|pro|growing|Candidate follow-up|Client invoice|
Boutique|बुटीक|fashion|shop|Fitting date reminder|New collection to regulars|
Tailor|दर्ज़ी|fashion|street|Order ready message|Balance reminder|darzi
Saree shop|साड़ी की दुकान|fashion|shop|Wedding season offer|Dues reminder|
Shoe shop|जूते की दुकान|fashion|shop|Festival sale offer|Stock low alert|
Rental wear|किराये के कपड़े|fashion|shop|Return date reminder|Deposit refund message|
Embroidery work|कढ़ाई|fashion|street|Order progress update|Advance payment link|
Salon|सैलून|beauty|shop|Appointment reminder|Win-back after 30 days|
Beauty parlour|ब्यूटी पार्लर|beauty|shop|Bridal package follow-up|Festival offer|
Barber shop|नाई की दुकान|beauty|street|Regulars reminder every 3 weeks|Daily cash count|nai
Gym|जिम|beauty|growing|Membership renewal reminder|Missed workout nudge|fitness
Mehendi artist|मेहंदी आर्टिस्ट|beauty|expert|Booking advance link|Wedding season offer|
Spa|स्पा|beauty|growing|Package expiry reminder|Review request|
Dairy farmer|डेयरी किसान|farm|street|Monthly milk bill|Payment reminder|doodh
Plant nursery|नर्सरी|farm|shop|Monsoon planting offer|Delivery update|
Poultry farm|मुर्गी फ़ार्म|farm|shop|Buyer order list|Feed stock alert|
Organic farm|जैविक खेती|farm|startup|Weekly box subscription|New customer follow-up|
Seed and fertiliser shop|बीज खाद भंडार|farm|shop|Season reminder to farmers|Udhaar reminder after harvest|
Honey seller|शहद विक्रेता|farm|street|Repeat order reminder|Festival gift offer|
Auto rickshaw owner|ऑटो रिक्शा|transport|street|School route fee reminder|Daily earnings count|
Cab owner|टैक्सी मालिक|transport|street|Booking confirmation|Insurance and permit renewal|taxi
Tempo and loading|टेम्पो|transport|street|Trip bill with UPI link|Regular client reminder|
Travel agent|ट्रैवल एजेंट|transport|expert|Trip plan and payment link|Passport expiry reminder|
Courier franchise|कूरियर|transport|shop|Pickup reminders|Monthly client invoice|
Cab fleet|कैब फ़्लीट|transport|growing|Driver roster|Vehicle service due alert|
Wedding planner|वेडिंग प्लानर|events|growing|Vendor payment schedule|Client checklist updates|shaadi
Tent and decorator|टेंट डेकोरेटर|events|shop|Booking advance link|Balance reminder after the event|
Photographer|फ़ोटोग्राफ़र|events|expert|Album ready message|Quote follow-up|
Homestay|होमस्टे|events|shop|Check-in details message|Review request after stay|
Banquet hall|बैंक्वेट हॉल|events|growing|Date hold expiry reminder|Enquiry follow-up|
DJ and sound|डीजे साउंड|events|street|Booking confirmation|Balance reminder|
App startup|ऐप स्टार्टअप|tech|startup|Monthly investor update|Pitch follow-ups|
SaaS startup|सास स्टार्टअप|tech|startup|Trial user follow-up|Weekly numbers sheet|software
D2C brand|डी2सी ब्रांड|tech|startup|Unfinished order reminder|Back-in-stock alert to buyers|
IT services firm|आईटी सर्विस|tech|growing|Client invoice and dues|Hiring pipeline updates|
Digital agency|डिजिटल एजेंसी|tech|growing|Monthly report to clients|Proposal follow-up|marketing
Computer repair shop|कंप्यूटर रिपेयर|tech|shop|Repair ready message|AMC renewal reminder|
Mobile repair shop|मोबाइल रिपेयर|tech|shop|Repair ready message|Warranty end reminder|
Instagram seller|इंस्टाग्राम सेलर|online|street|Order confirmation with payment link|Back-in-stock message|
Meesho reseller|मीशो रीसेलर|online|street|New catalogue to buyers list|Payment follow-up|
YouTuber|यूट्यूबर|online|expert|Brand deal follow-up|Invoice to brand|creator
Course creator|कोर्स क्रिएटर|online|startup|Webinar reminder|Course renewal offer|
Home baker|होम बेकर|online|street|Order ready message|Weekend offer|cake
Handmade jewellery seller|हैंडमेड ज्वेलरी|online|street|Order dispatch update|Festival offer|`;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const BIZ_TYPES: BizType[] = RAW.split("\n").map((line) => {
  const [name, local, sector, size, j1, j2, words] = line.split("|");
  return { id: slug(name), name, local, sector: sector as SectorId, size: size as SizeId, jobs: [j1, j2], words: words || "" };
});

export const bizType = (id: string) => BIZ_TYPES.find((t) => t.id === id);
export const sectorOf = (id: SectorId) => SECTORS.find((s) => s.id === id)!;
export const sizeOf = (id: SizeId) => SIZES.find((s) => s.id === id)!;

/** Types that run on appointments (a time slot with a person) rather than orders. */
const BOOKED = new Set([
  "salon", "beauty-parlour", "barber-shop", "gym", "mehendi-artist", "spa", "clinic", "dentist", "physiotherapist", "yoga-teacher",
  "home-tutor", "dance-class", "driving-school", "music-teacher", "ca-practice", "lawyer", "architect", "tax-consultant",
  "photographer", "homestay", "pathology-lab", "elder-care-service",
]);
/** Types whose work is a job at the customer's place. */
const JOBS = new Set(["electrician", "plumber", "ac-repair-service", "pest-control", "carpenter", "house-painter", "packers-and-movers", "welding-workshop", "mobile-repair-shop", "computer-repair-shop"]);
/** Types that make what they sell from raw materials (recipes). */
const MAKERS = new Set(["bakery", "home-baker", "cafe", "dhaba", "cloud-kitchen", "caterer", "tiffin-service", "chaat-stall", "sweet-shop", "namkeen-maker", "candle-maker"]);

export const usesAppointments = (t: BizType) => BOOKED.has(t.id);
export const usesRecipes = (t: BizType) => MAKERS.has(t.id);

const SECTOR_MODULES: Record<SectorId, ModuleId[]> = {
  retail: ["orders", "stock", "purchases", "website"],
  home: ["orders", "leads", "website"],
  grocery: ["orders", "stock", "purchases"],
  foodsvc: ["orders", "stock", "purchases", "website", "leads"],
  making: ["orders", "leads", "stock", "purchases"],
  health: ["appointments", "website", "leads"],
  edu: ["appointments", "leads", "website"],
  pro: ["appointments", "leads", "website"],
  fashion: ["orders", "stock", "website"],
  beauty: ["appointments", "stock", "website"],
  farm: ["orders", "stock", "purchases"],
  transport: ["orders", "leads"],
  events: ["orders", "leads", "purchases", "website"],
  tech: ["orders", "leads", "website"],
  online: ["orders", "stock", "website", "leads"],
};
const CORE: ModuleId[] = ["overview", "customers", "bills", "dues", "money", "taxes", "reminders", "marketing", "reports", "settings"];
const ORDER: ModuleId[] = ["overview", "orders", "appointments", "leads", "customers", "bills", "dues", "stock", "purchases", "money", "taxes", "staff", "reminders", "marketing", "website", "reports", "settings"];

export function modulesFor(t: BizType): ModuleId[] {
  const on = new Set<ModuleId>([...CORE, ...SECTOR_MODULES[t.sector]]);
  if (usesAppointments(t)) { on.add("appointments"); on.delete("orders"); }
  if (t.size !== "street") on.add("staff");
  if (t.size === "expert" || t.size === "startup" || t.size === "growing") on.add("leads");
  if (t.size === "street" && ["grocery", "farm", "transport"].includes(t.sector)) on.delete("website");
  return ORDER.filter((m) => on.has(m));
}

export function labelsFor(t: BizType): Settings["labels"] {
  const people = t.sector === "health" ? ["Patient", "Patients"] : t.sector === "edu" ? ["Student", "Students"] : t.sector === "pro" || t.sector === "tech" ? ["Client", "Clients"] : ["Customer", "Customers"];
  const order = usesAppointments(t) ? ["Appointment", "Appointments"] : JOBS.has(t.id) ? ["Job", "Jobs"] : t.sector === "events" ? ["Booking", "Bookings"] : ["Order", "Orders"];
  const goods = usesAppointments(t) || JOBS.has(t.id) || t.sector === "pro" || t.sector === "tech" && t.size !== "startup" ? ["Service", "Services"] : ["Product", "Products"];
  return { customer: people[0], customers: people[1], order: order[0], orders: order[1], product: goods[0], products: goods[1] };
}

/** Composition rates (percent of turnover): 1% traders and makers, 5% restaurants, 6% services. */
export function compositionRateFor(t: BizType): number {
  if (t.sector === "foodsvc" && !["bakery", "sweet-shop", "namkeen-maker"].includes(t.id)) return 5;
  if (["retail", "grocery", "making", "fashion", "farm"].includes(t.sector) || ["bakery", "home-baker", "instagram-seller", "meesho-reseller", "handmade-jewellery-seller", "d2c-brand"].includes(t.id)) return 1;
  return 6;
}

export function defaultGstMode(t: BizType): GstMode {
  if (t.size === "street") return "none";
  if (t.size === "startup" || t.size === "growing") return "regular";
  return "composition";
}

type Starter = Omit<Product, "active" | "on_site" | "stock_mode" | "gst_rate" | "recipe"> & { stock?: number; low_at?: number; recipe?: { m: string; qty: number }[] };
export interface StarterMaterial { key: string; name: string; unit: string; cost: number; low_at: number; stock: number }

const svc = (name: string, price: number, duration_min = 30): Starter => ({ name, type: "service", unit: "visit", price, duration_min });
const item = (name: string, unit: string, price: number, stock = 20, low_at = 5): Starter => ({ name, type: "product", unit, price, stock, low_at });

/** Example products and services per type; the owner edits prices in a minute. */
const STARTERS: Record<string, { products: Starter[]; materials?: StarterMaterial[] }> = {
  bakery: {
    materials: [
      { key: "flour", name: "Flour", unit: "kg", cost: 40, low_at: 10, stock: 25 },
      { key: "sugar", name: "Sugar", unit: "kg", cost: 45, low_at: 5, stock: 15 },
      { key: "butter", name: "Butter", unit: "kg", cost: 520, low_at: 3, stock: 6 },
      { key: "cocoa", name: "Cocoa", unit: "kg", cost: 600, low_at: 1, stock: 2 },
      { key: "eggs", name: "Eggs", unit: "pc", cost: 7, low_at: 60, stock: 150 },
    ],
    products: [
      { name: "Chocolate cake, 1 kg", type: "product", unit: "pc", price: 650, recipe: [{ m: "flour", qty: 0.3 }, { m: "cocoa", qty: 0.08 }, { m: "butter", qty: 0.2 }, { m: "sugar", qty: 0.25 }, { m: "eggs", qty: 4 }] },
      { name: "Pineapple cake, 1 kg", type: "product", unit: "pc", price: 550, recipe: [{ m: "flour", qty: 0.3 }, { m: "butter", qty: 0.2 }, { m: "sugar", qty: 0.25 }, { m: "eggs", qty: 4 }] },
      { name: "Cupcakes, box of 6", type: "product", unit: "box", price: 300, recipe: [{ m: "flour", qty: 0.2 }, { m: "cocoa", qty: 0.03 }, { m: "butter", qty: 0.1 }, { m: "sugar", qty: 0.12 }, { m: "eggs", qty: 2 }] },
      { name: "Butter cookies, 500 g", type: "product", unit: "box", price: 220, recipe: [{ m: "flour", qty: 0.25 }, { m: "butter", qty: 0.15 }, { m: "sugar", qty: 0.12 }] },
      { name: "Bread loaf", type: "product", unit: "pc", price: 45, recipe: [{ m: "flour", qty: 0.4 }] },
    ],
  },
  "kirana-store": { products: [item("Atta, 5 kg", "bag", 260, 20, 5), item("Rice, 1 kg", "kg", 70, 50, 10), item("Toor dal, 1 kg", "kg", 160, 30, 8), item("Sugar, 1 kg", "kg", 46, 40, 10), item("Mustard oil, 1 L", "bottle", 180, 24, 6), item("Tea, 250 g", "pack", 140, 20, 5)] },
  "sabzi-thela": { products: [item("Tomato", "kg", 30, 0, 0), item("Onion", "kg", 35, 0, 0), item("Potato", "kg", 25, 0, 0), item("Green chilli", "250 g", 15, 0, 0), item("Coriander", "bunch", 10, 0, 0)] },
  "tiffin-service": {
    materials: [{ key: "atta", name: "Atta", unit: "kg", cost: 38, low_at: 10, stock: 30 }, { key: "rice", name: "Rice", unit: "kg", cost: 60, low_at: 10, stock: 25 }, { key: "dal", name: "Dal", unit: "kg", cost: 140, low_at: 5, stock: 10 }],
    products: [{ name: "Veg tiffin (one meal)", type: "product", unit: "meal", price: 90, recipe: [{ m: "atta", qty: 0.1 }, { m: "rice", qty: 0.1 }, { m: "dal", qty: 0.05 }] }, { name: "Monthly tiffin, lunch", type: "product", unit: "month", price: 2400 }, { name: "Monthly tiffin, lunch and dinner", type: "product", unit: "month", price: 4200 }],
  },
  salon: { products: [svc("Haircut", 250, 30), svc("Hair colour", 1200, 90), svc("Facial", 900, 60), svc("Beard trim", 120, 15), item("Shampoo, 200 ml", "bottle", 350, 10, 3)] },
  clinic: { products: [svc("Consultation", 400, 15), svc("Follow-up visit", 200, 10), svc("Dressing", 150, 15)] },
  "home-tutor": { products: [svc("Monthly fee, class 6 to 8", 2500, 60), svc("Monthly fee, class 9 and 10", 3500, 60), svc("Test series", 800, 60)] },
  "ca-practice": { products: [svc("GST return filing (monthly)", 1500, 60), svc("Income tax return", 2500, 60), svc("Company audit", 25000, 600), svc("Accounting (monthly)", 4000, 240)] },
  "mobile-repair-shop": { products: [svc("Screen replacement", 1800, 60), svc("Battery replacement", 900, 30), svc("Software repair", 400, 30), item("Tempered glass", "pc", 150, 30, 10), item("Charger", "pc", 450, 15, 5)] },
  tailor: { products: [svc("Shirt stitching", 450), svc("Pant stitching", 500), svc("Blouse stitching", 600), svc("Alteration", 100)] },
  boutique: { products: [item("Kurti", "pc", 1200, 20, 5), item("Dupatta", "pc", 600, 15, 4), svc("Custom stitching", 900)] },
  cafe: {
    materials: [{ key: "milk", name: "Milk", unit: "L", cost: 60, low_at: 5, stock: 20 }, { key: "coffee", name: "Coffee beans", unit: "kg", cost: 900, low_at: 1, stock: 3 }, { key: "bread", name: "Bread", unit: "loaf", cost: 40, low_at: 4, stock: 10 }],
    products: [{ name: "Cappuccino", type: "product", unit: "cup", price: 160, recipe: [{ m: "milk", qty: 0.2 }, { m: "coffee", qty: 0.018 }] }, { name: "Cold coffee", type: "product", unit: "glass", price: 180, recipe: [{ m: "milk", qty: 0.25 }, { m: "coffee", qty: 0.02 }] }, { name: "Veg sandwich", type: "product", unit: "plate", price: 150, recipe: [{ m: "bread", qty: 0.25 }] }],
  },
  gym: { products: [svc("Monthly membership", 1500, 60), svc("Quarterly membership", 4000, 60), svc("Personal training, 12 sessions", 6000, 60)] },
  electrician: { products: [svc("Visit charge", 200, 30), svc("Fan installation", 350, 45), svc("Wiring per point", 250, 30)] },
  "app-startup": { products: [svc("Monthly subscription", 999, 0), svc("Annual subscription", 9999, 0), svc("Setup and training", 15000, 0)] },
};

const SECTOR_STARTERS: Record<SectorId, Starter[]> = {
  retail: [item("Item A", "pc", 100), item("Item B", "pc", 250), item("Item C", "pc", 500)],
  home: [svc("Visit charge", 200, 30), svc("Standard job", 800, 90), svc("Annual contract", 3000, 60)],
  grocery: [item("Item A", "kg", 40, 0, 0), item("Item B", "kg", 60, 0, 0), item("Item C", "pc", 20, 0, 0)],
  foodsvc: [item("Thali", "plate", 150, 0, 0), item("Snack plate", "plate", 60, 0, 0), item("Cold drink", "bottle", 40, 48, 12)],
  making: [item("Standard piece", "pc", 1000, 10, 2), svc("Custom work", 2500, 240)],
  health: [svc("Consultation", 400, 15), svc("Follow-up visit", 200, 10)],
  edu: [svc("Monthly fee", 2000, 60), svc("Admission fee", 1000, 30)],
  pro: [svc("Consultation", 1000, 60), svc("Monthly retainer", 5000, 120)],
  fashion: [item("Item A", "pc", 800, 15, 4), item("Item B", "pc", 1500, 10, 3), svc("Alteration", 150)],
  beauty: [svc("Basic service", 300, 30), svc("Premium service", 1200, 90), svc("Package", 3000, 120)],
  farm: [item("Milk", "L", 60, 0, 0), item("Produce", "kg", 40, 0, 0)],
  transport: [svc("Local trip", 400, 60), svc("Outstation per km", 14, 0), svc("Monthly route fee", 1500, 0)],
  events: [svc("Booking advance", 5000, 0), svc("Full event package", 50000, 0), svc("Add-on", 2000, 0)],
  tech: [svc("Monthly plan", 999, 0), svc("Project", 25000, 0), svc("Support hours", 1500, 60)],
  online: [item("Product A", "pc", 499, 20, 5), item("Product B", "pc", 899, 15, 4), item("Combo", "pc", 1299, 10, 3)],
};

export function startersFor(t: BizType): { products: Starter[]; materials: StarterMaterial[] } {
  const own = STARTERS[t.id];
  return { products: own?.products ?? SECTOR_STARTERS[t.sector], materials: own?.materials ?? [] };
}

/** Find types for what a person typed, in English, Hindi or Hinglish. Best first. */
export function searchTypes(q: string, limit = 12): BizType[] {
  const words = q.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length >= 3);
  if (!words.length) return [];
  return BIZ_TYPES.map((t) => {
    const hay = `${t.name} ${t.local} ${sectorOf(t.sector).name} ${t.words}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (t.name.toLowerCase().startsWith(w)) score += 3;
      if (hay.includes(w)) score += 2;
      else if (w.length > 4 && hay.includes(w.slice(0, 4))) score += 1;
    }
    return { t, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.t);
}
