import type { Product, Theme } from "../types";
import { menuSteps } from "../fields";
import { pick } from "../themes";

interface Def {
  id: string; name: string; glyph: string; price: number; themes: Theme[]; tagline: string; popular?: boolean;
  noun: string; itemLabel: string; categories: string[]; diet: boolean; cart: boolean; orderLabel: string;
  namePlaceholder: string; nameLabel?: string;
  wa: { enquire: string; order: string; item: string };
  sample: { name: string; tagline: string; area: string; order_note: string; opens?: string; closes?: string; items: [string, string, string, string, string?][] };
}

const ALL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const make = (d: Def): Product => ({
  id: d.id, family: "menu", category: "menus", name: d.name, glyph: d.glyph, price: d.price, popular: d.popular, tagline: d.tagline,
  description: `A ${d.noun} customers browse on their phone. They pick ${d.itemLabel}s, and the order arrives on your WhatsApp already written out. Comes with a printable QR.`,
  themes: d.themes,
  steps: menuSteps({ nameLabel: d.nameLabel ?? "Business name", namePlaceholder: d.namePlaceholder, itemLabel: d.itemLabel, categories: d.categories, diet: d.diet, orderLabel: d.orderLabel }),
  titleField: "name",
  sample: {
    name: d.sample.name, tagline: d.sample.tagline, area: d.sample.area, whatsapp: "9000000000", phone: "9000000000",
    address: `${d.sample.area}, Indore`, open_days: ALL, opens: d.sample.opens ?? "11:00", closes: d.sample.closes ?? "23:00", order_note: d.sample.order_note,
    items: d.sample.items.map(([category, name, price, desc, diet]) => ({ category, name, price, desc, diet: diet ?? (d.diet ? "Veg" : "") })),
  },
  whatsapp: d.wa,
  share: `📋 {name}: see the ${d.noun} and order on WhatsApp.\n{link}`,
  opts: { noun: d.noun, itemLabel: d.itemLabel, diet: d.diet, cart: d.cart, categories: d.categories },
  indexable: true,
});

const FOOD_WA = {
  enquire: "Hi {name}, I'd like to place an order. Please let me know how I can proceed.",
  order: "Hi {name}, I'd like to order:\n{lines}\n\nTotal: {total}\nName: {lead_name}\nAddress / table: ",
  item: "Hi {name}, is {item} available today?",
};

export const MENUS: Product[] = [
  make({ id: "restaurant-menu", name: "Restaurant Menu", glyph: "🍛", price: 199, popular: true, themes: pick("bistro", "dhaba", "cafe", "luxury"), noun: "digital menu", itemLabel: "dish",
    tagline: "A QR menu with veg marks, prices and WhatsApp ordering.", namePlaceholder: "XYZ Restaurant", nameLabel: "Restaurant name",
    categories: ["Starters", "Main course", "Breads", "Rice & biryani", "Desserts", "Beverages"], diet: true, cart: true, orderLabel: "Delivery / ordering note", wa: FOOD_WA,
    sample: { name: "XYZ Restaurant", tagline: "North Indian & tandoor since 1998", area: "Sapna Sangeeta Road", order_note: "Free delivery above ₹500 within 4 km. Dine-in till 11 PM.", items: [
      ["Starters", "Paneer Tikka", "280", "Charred in the tandoor, mint chutney", "Veg"], ["Starters", "Chicken Malai Tikka", "340", "Cream, cheese, cardamom", "Non-veg"], ["Starters", "Hara Bhara Kebab", "220", "Spinach, peas, potato", "Veg"],
      ["Main course", "Dal Makhani", "260", "Slow-cooked overnight", "Veg"], ["Main course", "Paneer Butter Masala", "290", "Our bestseller", "Veg"], ["Main course", "Butter Chicken", "360", "Smoky tomato gravy", "Non-veg"],
      ["Breads", "Butter Naan", "60", "", "Veg"], ["Breads", "Tandoori Roti", "30", "", "Veg"], ["Rice & biryani", "Veg Dum Biryani", "260", "With raita", "Veg"], ["Rice & biryani", "Chicken Biryani", "320", "Hyderabadi style", "Non-veg"],
      ["Desserts", "Gulab Jamun (2)", "90", "Served warm", "Veg"], ["Beverages", "Masala Chaas", "70", "", "Veg"]] } }),
  make({ id: "cafe-menu", name: "Cafe Menu", glyph: "☕", price: 149, themes: pick("cafe", "bistro", "pastel"), noun: "cafe menu", itemLabel: "item",
    tagline: "Coffee, bakes and bites, ordered from the table.", namePlaceholder: "Brew Lane Cafe", nameLabel: "Cafe name",
    categories: ["Coffee", "Tea", "Shakes", "Bakes", "Sandwiches", "Pasta & pizza"], diet: true, cart: true, orderLabel: "Ordering note", wa: FOOD_WA,
    sample: { name: "Brew Lane Cafe", tagline: "Single-origin coffee and fresh bakes", area: "56 Dukan", order_note: "Scan, pick and send your order. We'll bring it to your table.", opens: "08:00", items: [
      ["Coffee", "Cappuccino", "180", "Double shot, Coorg beans"], ["Coffee", "Cold Brew", "220", "Steeped 18 hours"], ["Tea", "Masala Chai", "90", "With ginger and cardamom"],
      ["Shakes", "Nutella Shake", "240", ""], ["Bakes", "Almond Croissant", "160", "Baked this morning", "Egg"], ["Sandwiches", "Pesto Paneer Grill", "230", "Sourdough"], ["Pasta & pizza", "Margherita", "320", "Wood-fired"]] } }),
  make({ id: "bakery-menu", name: "Bakery Menu", glyph: "🥐", price: 149, themes: pick("pastel", "cafe", "fresh"), noun: "bakery menu", itemLabel: "item",
    tagline: "Cakes by the kg, pastries and cookies with WhatsApp orders.", namePlaceholder: "Golden Crust Bakery", nameLabel: "Bakery name",
    categories: ["Cakes", "Pastries", "Cookies", "Breads", "Savouries", "Hampers"], diet: true, cart: true, orderLabel: "Ordering note", wa: { ...FOOD_WA, item: "Hi {name}, can I order {item} for pick-up today?" },
    sample: { name: "Golden Crust Bakery", tagline: "Eggless cakes and fresh bread since 2004", area: "Rajwada", order_note: "Cake orders need 6 hours' notice.", opens: "08:00", items: [
      ["Cakes", "Black Forest (1 kg)", "750", "Eggless"], ["Cakes", "Red Velvet (1 kg)", "950", "Cream cheese frosting"], ["Pastries", "Pineapple Pastry", "70", ""], ["Cookies", "Jeera Biscuits (250 g)", "120", ""], ["Breads", "Multigrain Loaf", "80", ""], ["Savouries", "Veg Puff", "30", ""]] } }),
  make({ id: "cloud-kitchen", name: "Cloud Kitchen", glyph: "🥡", price: 199, themes: pick("street", "bistro", "dhaba"), noun: "delivery menu", itemLabel: "dish",
    tagline: "Order direct on WhatsApp. Skip the aggregator commission.", namePlaceholder: "Bowl Theory", nameLabel: "Kitchen name",
    categories: ["Bowls", "Combos", "Wraps", "Sides", "Desserts", "Drinks"], diet: true, cart: true, orderLabel: "Delivery note", wa: FOOD_WA,
    sample: { name: "Bowl Theory", tagline: "Healthy bowls, delivered hot", area: "Palasia", order_note: "Delivery in 35 minutes across central Indore. 10% off on direct orders.", items: [
      ["Bowls", "Rajma Chawal Bowl", "189", "With salad and pickle"], ["Bowls", "Butter Chicken Rice Bowl", "249", "", "Non-veg"], ["Combos", "Thali for One", "229", "2 sabzi, dal, rice, 3 roti"], ["Wraps", "Paneer Kathi Roll", "149", ""], ["Desserts", "Brownie", "99", "", "Egg"], ["Drinks", "Fresh Lime Soda", "69", ""]] } }),
  make({ id: "tiffin-service", name: "Tiffin Service", glyph: "🍱", price: 149, themes: pick("dhaba", "fresh", "cafe"), noun: "tiffin menu", itemLabel: "plan",
    tagline: "Daily and monthly tiffin plans with WhatsApp sign-ups.", namePlaceholder: "Maa Ki Rasoi", nameLabel: "Tiffin service name",
    categories: ["Daily tiffin", "Monthly plans", "Add-ons", "Weekend specials"], diet: true, cart: true, orderLabel: "Delivery note",
    wa: { enquire: "Hi {name}, I'd like to know about your tiffin plans.", order: "Hi {name}, I'd like to start:\n{lines}\n\nTotal: {total}\nName: {lead_name}\nAddress: ", item: "Hi {name}, please share details of {item}." },
    sample: { name: "Maa Ki Rasoi", tagline: "Ghar jaisa khana, delivered twice a day", area: "Bhanwarkuan", order_note: "Lunch by 1 PM, dinner by 8:30 PM. Sundays off.", opens: "09:00", closes: "21:00", items: [
      ["Daily tiffin", "Regular thali", "90", "2 sabzi, dal, rice, 4 roti"], ["Daily tiffin", "Jain thali", "100", "No onion, garlic or root vegetables", "Jain"], ["Monthly plans", "Lunch only (26 days)", "2200", ""], ["Monthly plans", "Lunch + dinner (26 days)", "4200", ""], ["Add-ons", "Extra roti (2)", "15", ""], ["Weekend specials", "Dal baati (Sat)", "140", ""]] } }),
  make({ id: "street-food", name: "Street Food Stall", glyph: "🌮", price: 99, themes: pick("street", "dhaba"), noun: "stall menu", itemLabel: "item",
    tagline: "A bold menu for your stall, with a QR on the cart.", namePlaceholder: "Joshi Dahi Bada", nameLabel: "Stall name",
    categories: ["Chaat", "Snacks", "Sweets", "Drinks"], diet: true, cart: true, orderLabel: "Note for customers", wa: FOOD_WA,
    sample: { name: "Joshi Dahi Bada", tagline: "Sarafa's favourite since 1975", area: "Sarafa Bazaar", order_note: "Open 8 PM to 2 AM. Parcel orders on WhatsApp.", opens: "20:00", closes: "02:00", items: [
      ["Chaat", "Dahi Bada", "60", "The famous one"], ["Chaat", "Bhutte ka Kees", "70", ""], ["Snacks", "Garadu", "80", "Seasonal"], ["Sweets", "Malpua", "50", ""], ["Drinks", "Shikanji", "40", ""]] } }),
  make({ id: "sweet-shop", name: "Sweet Shop", glyph: "🍬", price: 149, themes: pick("traditional", "dhaba", "pastel"), noun: "sweets menu", itemLabel: "sweet",
    tagline: "Mithai and namkeen by the kg, with festive orders.", namePlaceholder: "Agrawal Mishthan", nameLabel: "Shop name",
    categories: ["Mithai", "Namkeen", "Dry fruit sweets", "Gift boxes"], diet: true, cart: true, orderLabel: "Ordering note",
    wa: { ...FOOD_WA, item: "Hi {name}, is {item} available? I'd like to order for Diwali." },
    sample: { name: "Agrawal Mishthan", tagline: "Pure ghee sweets since 1962", area: "Malharganj", order_note: "Diwali gift box orders open. Bulk orders welcome.", opens: "08:00", closes: "22:00", items: [
      ["Mithai", "Kaju Katli (500 g)", "550", "Pure ghee"], ["Mithai", "Mawa Barfi (500 g)", "320", ""], ["Namkeen", "Ratlami Sev (500 g)", "160", ""], ["Dry fruit sweets", "Anjeer Roll (500 g)", "650", "Sugar-free"], ["Gift boxes", "Diwali box (1 kg)", "899", "4 assorted sweets"]] } }),
  make({ id: "product-catalogue", name: "Product Catalogue", glyph: "🛍️", price: 199, popular: true, themes: pick("clean", "boutique", "fresh"), noun: "product catalogue", itemLabel: "product",
    tagline: "Your products with prices. Customers pick and order on WhatsApp.", namePlaceholder: "Kraft Corner", nameLabel: "Shop name",
    categories: ["Bestsellers", "New arrivals", "Home", "Gifts", "Accessories", "Others"], diet: false, cart: true, orderLabel: "Shipping / delivery note",
    wa: { enquire: "Hi {name}, I saw your catalogue on EZYOURLIFE. I'd like to order.", order: "Hi {name}, I'd like to order:\n{lines}\n\nTotal: {total}\nName: {lead_name}\nDelivery address: ", item: "Hi {name}, is {item} in stock?" },
    sample: { name: "Kraft Corner", tagline: "Handmade home decor from Madhya Pradesh", area: "Online · ships pan-India", order_note: "Free shipping above ₹999. COD available.", opens: "10:00", closes: "20:00", items: [
      ["Bestsellers", "Gond art coasters (set of 4)", "599", "Hand-painted"], ["Bestsellers", "Bagh print cushion cover", "449", "16x16 in"], ["New arrivals", "Dhokra elephant", "1299", "Brass, 6 in"], ["Home", "Terracotta planter", "399", ""], ["Gifts", "Diwali hamper", "1499", "Diyas, candles, sweets"]] } }),
  make({ id: "boutique-catalogue", name: "Boutique Catalogue", glyph: "👗", price: 199, themes: pick("boutique", "luxury", "blush"), noun: "catalogue", itemLabel: "piece",
    tagline: "Sarees, suits and kurtis with sizes and WhatsApp orders.", namePlaceholder: "Rangrez Boutique", nameLabel: "Boutique name",
    categories: ["Sarees", "Suits", "Kurtis", "Lehengas", "Dupattas", "Kids"], diet: false, cart: true, orderLabel: "Shipping / sizing note",
    wa: { enquire: "Hi {name}, I'd like to see more from your catalogue.", order: "Hi {name}, I'd like to order:\n{lines}\n\nTotal: {total}\nName: {lead_name}\nSize / address: ", item: "Hi {name}, is {item} available? Please share more photos." },
    sample: { name: "Rangrez Boutique", tagline: "Handloom and festive wear", area: "Old Palasia", order_note: "Ships across India in 4 days. Easy exchange.", items: [
      ["Sarees", "Maheshwari silk-cotton saree", "3200", "With blouse piece"], ["Sarees", "Chanderi tissue saree", "5400", ""], ["Suits", "Block-print cotton suit", "1850", "Unstitched"], ["Kurtis", "Mul cotton kurti", "990", "S–XXL"], ["Lehengas", "Festive lehenga", "14500", "Made to measure"]] } }),
  make({ id: "jewellery-catalogue", name: "Jewellery Catalogue", glyph: "💍", price: 249, themes: pick("luxury", "boutique", "royal"), noun: "jewellery catalogue", itemLabel: "design",
    tagline: "Designs with weights and prices, enquiries on WhatsApp.", namePlaceholder: "Shree Jewellers", nameLabel: "Store name",
    categories: ["Gold", "Diamond", "Silver", "Bridal", "Men's", "Kids"], diet: false, cart: false, orderLabel: "Note (rates, hallmark, exchange)",
    wa: { enquire: "Hi {name}, I'd like to know today's rate and see designs.", order: "Hi {name}, I'm interested in:\n{lines}\n\nName: {lead_name}", item: "Hi {name}, I'm interested in {item}. Please share price and weight." },
    sample: { name: "Shree Jewellers", tagline: "Hallmarked gold and certified diamonds", area: "Sarafa", order_note: "Prices change with the daily gold rate. All gold is BIS hallmarked.", items: [
      ["Gold", "Temple jhumkas (8 g)", "On rate", "22K"], ["Gold", "Daily-wear chain (6 g)", "On rate", "22K"], ["Diamond", "Solitaire ring (0.3 ct)", "62000", "IGI certified"], ["Silver", "Payal pair", "2400", "92.5 silver"], ["Bridal", "Kundan set", "On request", ""]] } }),
  make({ id: "gift-catalogue", name: "Gift & Hamper Catalogue", glyph: "🎁", price: 199, themes: pick("pastel", "boutique", "fun"), noun: "gift catalogue", itemLabel: "gift",
    tagline: "Hampers and personalised gifts with WhatsApp orders.", namePlaceholder: "The Gift Studio", nameLabel: "Shop name",
    categories: ["Hampers", "Personalised", "Corporate", "Festive", "Birthday", "Wedding"], diet: false, cart: true, orderLabel: "Delivery note",
    wa: { enquire: "Hi {name}, I'd like to order a gift.", order: "Hi {name}, I'd like to order:\n{lines}\n\nTotal: {total}\nName: {lead_name}\nDeliver to: ", item: "Hi {name}, can {item} be personalised?" },
    sample: { name: "The Gift Studio", tagline: "Hampers that make people call you right away", area: "Vijay Nagar", order_note: "Same-day delivery in Indore for orders before 3 PM.", items: [
      ["Hampers", "Chocolate & coffee hamper", "1499", ""], ["Personalised", "Photo frame lamp", "899", "Your photo, engraved"], ["Corporate", "Desk kit (min 25)", "650", "Branded"], ["Festive", "Diwali dry-fruit box", "1199", ""], ["Birthday", "Midnight surprise box", "1799", "Cake, balloons, card"]] } }),
  make({ id: "salon-rate-card", name: "Salon Rate Card", glyph: "✂️", price: 99, themes: pick("blush", "luxury", "black"), noun: "rate card", itemLabel: "service",
    tagline: "A tidy price list customers scan at the counter.", namePlaceholder: "ABC Salon", nameLabel: "Salon name",
    categories: ["Hair", "Skin", "Nails", "Waxing", "Bridal", "Men"], diet: false, cart: true, orderLabel: "Booking note",
    wa: { enquire: "Hi {name}, I'd like to book an appointment.", order: "Hi {name}, I'd like to book:\n{lines}\n\nApprox. total: {total}\nName: {lead_name}\nPreferred time: ", item: "Hi {name}, I'd like to book {item}." },
    sample: { name: "ABC Salon", tagline: "Hair · Skin · Nails · Bridal", area: "Vijay Nagar", order_note: "Tap services to build your booking, then send it on WhatsApp.", opens: "10:00", closes: "21:00", items: [
      ["Hair", "Haircut (women)", "499", ""], ["Hair", "Global colour", "2499", "From"], ["Skin", "Clean-up", "699", ""], ["Skin", "Hydra facial", "2999", ""], ["Nails", "Gel polish", "899", ""], ["Waxing", "Full arms", "349", "Rica"], ["Men", "Haircut + beard", "399", ""]] } }),
  make({ id: "service-rate-card", name: "Service Rate Card", glyph: "🧰", price: 99, themes: pick("trade", "clean", "pro"), noun: "rate card", itemLabel: "service",
    tagline: "Transparent prices for any service business.", namePlaceholder: "QuickFix Services", nameLabel: "Business name",
    categories: ["Repairs", "Installation", "Maintenance", "Visit charges", "Packages"], diet: false, cart: true, orderLabel: "Note for customers",
    wa: { enquire: "Hi {name}, I'd like to book a service.", order: "Hi {name}, I need:\n{lines}\n\nApprox. total: {total}\nName: {lead_name}\nAddress: ", item: "Hi {name}, I need {item}. When can you come?" },
    sample: { name: "QuickFix Services", tagline: "Electrical, plumbing and carpentry", area: "Indore", order_note: "Visit charge adjusted in the final bill.", opens: "08:00", closes: "21:00", items: [
      ["Visit charges", "Inspection visit", "199", ""], ["Repairs", "Tap leakage", "249", ""], ["Installation", "Ceiling fan", "299", ""], ["Maintenance", "Water tank cleaning", "799", "Up to 1,000 L"], ["Packages", "Annual home check (4 visits)", "2499", ""]] } }),
];
