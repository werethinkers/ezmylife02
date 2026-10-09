// Industry presets. These are what make the product work for a business
// that has no bill system or catalogue: pick an industry, and you get
// sensible product types, the things customers usually praise, Google
// Business Profile category ideas and keyword seeds.
//
// To add an industry: add one entry to INDUSTRIES. Nothing else changes.

export type Industry = {
  id: string;
  label: string;
  /** Singular noun for the place, used in keywords: "shoe store", "clinic" */
  place: string;
  /** Extra nouns people search for this kind of place */
  placeSynonyms: string[];
  /** Suggested product / service types the owner can pick from */
  types: string[];
  /** Things customers commonly praise — shown as tap-chips on the review page */
  praise: string[];
  /** Google Business Profile category ideas (owner should confirm in GBP) */
  gbpCategories: string[];
  /** Search intent modifiers that make sense for this industry */
  modifiers: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    id: "footwear",
    label: "Footwear store",
    place: "shoe store",
    placeSynonyms: ["shoe shop", "footwear shop"],
    types: ["Formal shoes", "Casual shoes", "Sports shoes", "Sandals", "Slippers", "School shoes", "Heels", "Kids shoes", "Accessories"],
    praise: ["Comfortable fit", "Good variety", "Helpful staff", "Fair prices", "Quick billing", "Good quality"],
    gbpCategories: ["Shoe store", "Footwear wholesaler", "Children's shoe store", "Sporting goods store"],
    modifiers: ["best", "near me", "latest", "comfortable", "affordable"],
  },
  {
    id: "apparel",
    label: "Clothing / fashion store",
    place: "clothing store",
    placeSynonyms: ["garment shop", "fashion store", "boutique"],
    types: ["Men's wear", "Women's wear", "Kids wear", "Ethnic wear", "Western wear", "Sarees", "Kurtis", "Wedding wear", "Accessories"],
    praise: ["Latest designs", "Good fabric", "Helpful staff", "Fair prices", "Perfect fitting", "Alteration service"],
    gbpCategories: ["Clothing store", "Boutique", "Women's clothing store", "Men's clothing store", "Children's clothing store"],
    modifiers: ["best", "near me", "latest", "designer", "affordable"],
  },
  {
    id: "restaurant",
    label: "Restaurant / café",
    place: "restaurant",
    placeSynonyms: ["cafe", "eatery", "family restaurant"],
    types: ["North Indian", "South Indian", "Chinese", "Fast food", "Thali", "Desserts", "Beverages", "Pure veg", "Party orders"],
    praise: ["Tasty food", "Quick service", "Clean place", "Friendly staff", "Value for money", "Good ambience"],
    gbpCategories: ["Restaurant", "Family restaurant", "Vegetarian restaurant", "Cafe", "Fast food restaurant"],
    modifiers: ["best", "near me", "pure veg", "family", "budget"],
  },
  {
    id: "salon",
    label: "Salon / spa",
    place: "salon",
    placeSynonyms: ["beauty parlour", "unisex salon", "spa"],
    types: ["Haircut", "Hair colour", "Facial", "Bridal makeup", "Manicure", "Pedicure", "Waxing", "Spa massage", "Keratin treatment"],
    praise: ["Skilled staff", "Hygienic", "On-time appointment", "Relaxing", "Fair prices", "Great results"],
    gbpCategories: ["Beauty salon", "Hair salon", "Unisex salon", "Day spa", "Bridal shop"],
    modifiers: ["best", "near me", "affordable", "unisex", "professional"],
  },
  {
    id: "clinic",
    label: "Clinic / doctor",
    place: "clinic",
    placeSynonyms: ["doctor", "medical clinic"],
    types: ["General consultation", "Dental care", "Skin treatment", "Physiotherapy", "Child care", "Diagnostics", "Health check-up", "Eye care"],
    praise: ["Caring doctor", "Clear explanation", "Short waiting time", "Clean clinic", "Helpful staff", "Reasonable fees"],
    gbpCategories: ["Medical clinic", "Dentist", "Dermatologist", "Physiotherapist", "Pediatrician"],
    modifiers: ["best", "near me", "experienced", "trusted", "affordable"],
  },
  {
    id: "electronics",
    label: "Electronics / mobile store",
    place: "electronics store",
    placeSynonyms: ["mobile shop", "electronics shop"],
    types: ["Mobile phones", "Laptops", "Televisions", "Home appliances", "Accessories", "Repairs", "Smart watches", "Air conditioners"],
    praise: ["Genuine products", "Good price", "Knowledgeable staff", "EMI options", "Quick delivery", "After-sales support"],
    gbpCategories: ["Electronics store", "Mobile phone store", "Appliance store", "Computer store", "Cell phone repair shop"],
    modifiers: ["best", "near me", "authorised", "cheapest", "latest"],
  },
  {
    id: "grocery",
    label: "Grocery / supermarket",
    place: "grocery store",
    placeSynonyms: ["supermarket", "kirana store", "general store"],
    types: ["Fruits & vegetables", "Dairy", "Staples", "Snacks", "Household items", "Personal care", "Organic products", "Home delivery"],
    praise: ["Fresh products", "Good variety", "Fair prices", "Quick billing", "Home delivery", "Friendly staff"],
    gbpCategories: ["Grocery store", "Supermarket", "Organic food store", "Convenience store"],
    modifiers: ["best", "near me", "fresh", "online", "24 hours"],
  },
  {
    id: "jewellery",
    label: "Jewellery store",
    place: "jewellery shop",
    placeSynonyms: ["jewellers", "gold shop"],
    types: ["Gold jewellery", "Diamond jewellery", "Silver jewellery", "Bridal sets", "Rings", "Earrings", "Coins", "Custom designs"],
    praise: ["Beautiful designs", "Trusted purity", "Transparent pricing", "Helpful staff", "Custom work", "Good exchange value"],
    gbpCategories: ["Jewelry store", "Gold dealer", "Diamond dealer", "Silversmith"],
    modifiers: ["best", "near me", "hallmark", "bridal", "trusted"],
  },
  {
    id: "gym",
    label: "Gym / fitness studio",
    place: "gym",
    placeSynonyms: ["fitness centre", "fitness studio"],
    types: ["Weight training", "Personal training", "Yoga", "Zumba", "CrossFit", "Diet guidance", "Women's batch", "Cardio"],
    praise: ["Good equipment", "Expert trainers", "Clean space", "Motivating", "Flexible timings", "Fair fees"],
    gbpCategories: ["Gym", "Fitness center", "Yoga studio", "Personal trainer"],
    modifiers: ["best", "near me", "affordable", "24 hours", "ladies"],
  },
  {
    id: "education",
    label: "Coaching / school / institute",
    place: "coaching institute",
    placeSynonyms: ["classes", "tuition centre", "academy"],
    types: ["School tuition", "Competitive exams", "Spoken English", "Computer courses", "Music classes", "Dance classes", "Online classes"],
    praise: ["Great teachers", "Clear concepts", "Good results", "Personal attention", "Study material", "Fair fees"],
    gbpCategories: ["Coaching center", "Tutoring service", "Educational institution", "Language school"],
    modifiers: ["best", "near me", "top", "online", "affordable"],
  },
  {
    id: "auto",
    label: "Car / bike service",
    place: "service centre",
    placeSynonyms: ["garage", "workshop"],
    types: ["Car service", "Bike service", "Denting & painting", "Car wash", "Tyres", "Battery", "AC repair", "Spare parts"],
    praise: ["Honest pricing", "Quick service", "Skilled mechanics", "On-time delivery", "Genuine parts", "Clear updates"],
    gbpCategories: ["Auto repair shop", "Car service station", "Motorcycle repair shop", "Car wash", "Tire shop"],
    modifiers: ["best", "near me", "trusted", "cheap", "doorstep"],
  },
  {
    id: "home-services",
    label: "Home services",
    place: "service provider",
    placeSynonyms: ["services"],
    types: ["Plumbing", "Electrician", "Carpentry", "Painting", "Pest control", "Deep cleaning", "AC service", "Interior work"],
    praise: ["On time", "Professional work", "Clean finish", "Fair pricing", "Polite team", "Quick response"],
    gbpCategories: ["Plumber", "Electrician", "Carpenter", "Painter", "Pest control service", "House cleaning service"],
    modifiers: ["best", "near me", "affordable", "same day", "trusted"],
  },
  {
    id: "hotel",
    label: "Hotel / homestay",
    place: "hotel",
    placeSynonyms: ["stay", "homestay", "guest house"],
    types: ["Deluxe rooms", "Family rooms", "Banquet hall", "Restaurant", "Airport pickup", "Long stay", "Corporate stay"],
    praise: ["Clean rooms", "Great location", "Helpful staff", "Good breakfast", "Value for money", "Smooth check-in"],
    gbpCategories: ["Hotel", "Guest house", "Banquet hall", "Resort hotel"],
    modifiers: ["best", "near me", "budget", "luxury", "family"],
  },
  {
    id: "other",
    label: "Other business",
    place: "business",
    placeSynonyms: ["shop", "store"],
    types: [],
    praise: ["Helpful staff", "Good quality", "Fair prices", "Quick service", "Professional", "Would recommend"],
    gbpCategories: [],
    modifiers: ["best", "near me", "trusted", "affordable"],
  },
];

export function getIndustry(id: string | undefined): Industry {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1];
}

/** Finds a preset whose label/place matches free text, e.g. "shoe shop" -> footwear. */
export function matchPreset(text: string): Industry | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  return INDUSTRIES.find(
    (i) => i.id !== "other" && (i.label.toLowerCase() === t || i.place === t || i.placeSynonyms.includes(t)),
  );
}

/**
 * The industry profile for a business. Works for ANY business: if the owner
 * typed their own type ("bakery", "CA firm", "pet grooming"), we build a
 * profile from that text and their own product types.
 */
export function resolveIndustry(b: { industry: string; customIndustry?: string; products?: { type: string }[] }): Industry {
  if (b.industry !== "custom") return getIndustry(b.industry);
  const label = (b.customIndustry ?? "").trim() || "Business";
  const other = getIndustry("other");
  const types = Array.from(new Set((b.products ?? []).map((p) => p.type).filter(Boolean)));
  return {
    ...other,
    id: "custom",
    label,
    place: label.toLowerCase(),
    placeSynonyms: [],
    types,
    gbpCategories: [label.charAt(0).toUpperCase() + label.slice(1)],
  };
}
