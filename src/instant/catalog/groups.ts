import type { CategoryId } from "../types";

/** Second-level filters inside each category, so a shelf of 30 items stays easy to scan. */
export const GROUPS: Record<CategoryId, { id: string; name: string; ids: string[] }[]> = {
  celebrations: [
    { id: "love", name: "Love", ids: ["anniversary", "valentine", "proposal"] },
    { id: "birthday", name: "Birthday", ids: ["birthday-surprise"] },
    { id: "family", name: "Family", ids: ["mothers-day", "fathers-day", "baby-announcement"] },
    { id: "milestones", name: "Friends & milestones", ids: ["friendship", "thank-you", "congratulations", "farewell", "retirement", "graduation", "teachers-day"] },
    { id: "care", name: "Care & comfort", ids: ["get-well-soon", "sorry", "tribute"] },
  ],
  festivals: [
    { id: "hindu", name: "Hindu festivals", ids: ["diwali", "holi", "raksha-bandhan", "ganesh-chaturthi", "navratri", "makar-sankranti", "pongal-onam"] },
    { id: "jain", name: "Jain", ids: ["mahavir-jayanti", "kshamavani"] },
    { id: "faiths", name: "Christmas, Eid & Gurpurab", ids: ["christmas", "eid", "gurpurab"] },
    { id: "national", name: "National & special days", ids: ["independence-day", "republic-day", "womens-day", "new-year"] },
  ],
  events: [
    { id: "wedding", name: "Wedding", ids: ["wedding", "engagement", "save-the-date"] },
    { id: "family", name: "Family functions", ids: ["birthday-party", "baby-shower", "naming-ceremony", "housewarming", "puja-invite"] },
    { id: "work", name: "Business & community", ids: ["corporate-event", "workshop", "meetup", "college-fest", "store-opening", "product-launch", "conference"] },
  ],
  business: [
    { id: "stores", name: "Shops & stores", ids: ["kirana", "pharmacy", "mobile-shop", "hardware-store", "general-store", "stationery-shop", "optical-shop", "pet-shop", "agri-store", "wholesaler"] },
    { id: "schools", name: "Schools", ids: ["school", "preschool"] },
    { id: "stays", name: "Hotels & stays", ids: ["hotel", "hostel-pg", "resort"] },
    { id: "fitness", name: "Fitness & wellness", ids: ["gym-website", "personal-trainer", "yoga-studio", "spa"] },
    { id: "beauty", name: "Beauty", ids: ["salon", "makeup-artist", "mehendi-artist"] },
    { id: "education", name: "Classes & tuition", ids: ["tutor", "coaching-center", "music-teacher", "dance-teacher"] },
    { id: "shops", name: "Shops & makers", ids: ["home-baker", "florist", "tailor", "boutique", "jeweller"] },
    { id: "events", name: "Events & photos", ids: ["photographer", "event-planner", "decorator"] },
    { id: "home", name: "Home & vehicle services", ids: ["electrician", "plumber", "ac-repair", "car-detailing", "bike-repair", "interior-designer"] },
    { id: "pro", name: "Professionals", ids: ["consultant", "real-estate", "travel-agent", "chartered-accountant", "lawyer", "architect", "clinic", "freelancer-services"] },
  ],
  menus: [
    { id: "food", name: "Food menus", ids: ["restaurant-menu", "cafe-menu", "bakery-menu", "cloud-kitchen", "tiffin-service", "street-food", "sweet-shop"] },
    { id: "catalogues", name: "Catalogues", ids: ["product-catalogue", "boutique-catalogue", "jewellery-catalogue", "gift-catalogue"] },
    { id: "rates", name: "Rate cards", ids: ["salon-rate-card", "service-rate-card"] },
  ],
  profiles: [
    { id: "cards", name: "Cards & CVs", ids: ["digital-visiting-card", "resume", "student-profile"] },
    { id: "portfolios", name: "Portfolios", ids: ["portfolio", "photographer-portfolio", "designer-portfolio"] },
    { id: "pros", name: "Creators & pros", ids: ["creator-bio-link", "freelancer-profile", "consultant-profile", "speaker-profile"] },
  ],
};

const BY_PRODUCT = new Map<string, string>();
Object.values(GROUPS).forEach((gs) => gs.forEach((g) => g.ids.forEach((id) => BY_PRODUCT.set(id, g.id))));
export const groupOf = (productId: string) => BY_PRODUCT.get(productId) ?? "other";
