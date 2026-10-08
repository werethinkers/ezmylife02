import type { Product, Theme } from "../types";
import { festivalSteps } from "../fields";
import { pick } from "../themes";

type Art = "diya" | "colours" | "rakhi" | "tree" | "fireworks" | "moon" | "flag" | "flower" | "modak" | "dandiya" | "kite" | "kalash" | "lotus" | "sun";

interface Def {
  id: string; name: string; glyph: string; price?: number; seasonal: string; themes: Theme[]; art: Art;
  greeting: string; sub: string; suggestions: string[]; popular?: boolean; tap: string; tapDone: string;
}

const make = (d: Def): Product => ({
  id: d.id, family: "festival", category: "festivals", name: d.name, glyph: d.glyph, price: d.price ?? 11, seasonal: d.seasonal, popular: d.popular,
  tagline: d.sub, description: `${d.name} greetings with animated ${d.art === "diya" ? "diyas" : "festive art"}, your message and family photo. Share it with everyone at once.`,
  themes: d.themes, steps: festivalSteps({ suggestions: d.suggestions }),
  sample: { sender: "The Sharma Family", recipient: "", message: d.suggestions[0], music: true },
  titleField: "sender",
  whatsapp: { reply: `${d.greeting} to you too, {sender}! 🙏` },
  share: `${d.glyph} ${d.greeting}!\nA little greeting from {sender}:\n{link}`,
  opts: { art: d.art, greeting: d.greeting, tap: d.tap, tapDone: d.tapDone }, indexable: false,
});

export const FESTIVALS: Product[] = [
  make({ id: "diwali", name: "Diwali Greeting", glyph: "🪔", seasonal: "Oct–Nov", popular: true, themes: pick("diwali", "royal", "minimal"), art: "diya",
    greeting: "Happy Diwali", sub: "Light the diyas, send the sweetness.", tap: "Tap the diyas to light them", tapDone: "Shubh Deepavali! May your home glow all year.",
    suggestions: ["May the light of the diyas fill your home with joy, health and prosperity. Happy Diwali!", "Wishing you and your family a Diwali full of light, laughter and mithai. Shubh Deepavali!", "दीपों का यह पावन त्योहार आपके जीवन में सुख, समृद्धि और खुशियाँ लाए। शुभ दीपावली!"] }),
  make({ id: "holi", name: "Holi Greeting", glyph: "🎨", seasonal: "Mar", popular: true, themes: pick("holi", "fun", "sunny"), art: "colours",
    greeting: "Happy Holi", sub: "Throw some gulaal, digitally.", tap: "Tap anywhere to throw colours", tapDone: "Bura na mano, Holi hai!",
    suggestions: ["May your life be as colourful as the gulaal in the air today. Happy Holi!", "Rang, gujiya aur dher saari masti. Holi ki hardik shubhkamnayein!"] }),
  make({ id: "raksha-bandhan", name: "Raksha Bandhan", glyph: "🧶", seasonal: "Aug", popular: true, themes: pick("rakhi", "traditional", "fun"), art: "rakhi",
    greeting: "Happy Raksha Bandhan", sub: "A rakhi that reaches any city.", tap: "Tap to tie the rakhi", tapDone: "Tied with love. Happy Rakhi!",
    suggestions: ["To the best sibling in the world: thank you for always having my back. Happy Raksha Bandhan!", "Distance can't loosen this thread. Happy Rakhi, bhaiya!"] }),
  make({ id: "christmas", name: "Christmas Card", glyph: "🎄", seasonal: "Dec", themes: pick("christmas", "elegant", "minimal"), art: "tree",
    greeting: "Merry Christmas", sub: "Snowfall, a star and your wishes.", tap: "Tap the star to light the tree", tapDone: "Merry Christmas and a joyful new year!",
    suggestions: ["Wishing you a Christmas full of warmth, cake and the people you love.", "Merry Christmas! May your days be merry and bright."] }),
  make({ id: "new-year", name: "New Year Wishes", glyph: "🎆", seasonal: "31 Dec", popular: true, themes: pick("newyear", "fun", "minimal"), art: "fireworks",
    greeting: "Happy New Year", sub: "A countdown and fireworks for your people.", tap: "Tap to launch fireworks", tapDone: "Here's to a brilliant year ahead!",
    suggestions: ["New year, same us, better plans. Wishing you health, happiness and success this year!", "May the new year bring you peace, joy and everything you've been working towards."] }),
  make({ id: "eid", name: "Eid Mubarak", glyph: "🌙", seasonal: "Eid", themes: pick("eid", "elegant", "minimal"), art: "moon",
    greeting: "Eid Mubarak", sub: "The crescent, lanterns and your duas.", tap: "Tap the lanterns", tapDone: "Eid Mubarak! May Allah bless you and your family.",
    suggestions: ["May this Eid bring peace, happiness and prosperity to you and your loved ones. Eid Mubarak!", "Wishing you a blessed Eid filled with love, sheer khurma and family."] }),
  make({ id: "independence-day", name: "Independence Day", glyph: "🇮🇳", seasonal: "15 Aug", themes: pick("tiranga", "minimal"), art: "flag",
    greeting: "Happy Independence Day", sub: "Hoist the tiranga with pride.", tap: "Tap to hoist the flag", tapDone: "Jai Hind! 🇮🇳",
    suggestions: ["Freedom in our minds, faith in our words, pride in our souls. Happy Independence Day!", "स्वतंत्रता दिवस की हार्दिक शुभकामनाएँ। जय हिंद!"] }),
  make({ id: "republic-day", name: "Republic Day", glyph: "🎖️", seasonal: "26 Jan", themes: pick("tiranga", "minimal"), art: "flag",
    greeting: "Happy Republic Day", sub: "Celebrate the Constitution, the tricolour and us.", tap: "Tap to salute", tapDone: "Jai Hind! Happy Republic Day.",
    suggestions: ["Let's honour the Constitution and the people who gave it to us. Happy Republic Day!"] }),
  make({ id: "womens-day", name: "Women's Day", glyph: "🌷", seasonal: "8 Mar", themes: pick("womens", "lilac", "minimal"), art: "flower",
    greeting: "Happy Women's Day", sub: "For the women who make it all happen.", tap: "Tap to send flowers", tapDone: "Here's to strong women. May we know them, may we be them.",
    suggestions: ["To the women who inspire us every day: thank you. Happy Women's Day!"] }),
  make({ id: "ganesh-chaturthi", name: "Ganesh Chaturthi", glyph: "🐘", seasonal: "Aug–Sep", themes: pick("ganesh", "traditional"), art: "modak",
    greeting: "Ganpati Bappa Morya", sub: "Modaks, marigolds and blessings.", tap: "Tap to offer a modak", tapDone: "Ganpati Bappa Morya! Mangal Murti Morya!",
    suggestions: ["May Lord Ganesha remove every obstacle from your path. Happy Ganesh Chaturthi!", "गणपति बप्पा मोरया! गणेश चतुर्थी की हार्दिक शुभकामनाएँ।"] }),
  make({ id: "navratri", name: "Navratri & Dussehra", glyph: "🪘", seasonal: "Sep–Oct", themes: pick("navratri", "traditional"), art: "dandiya",
    greeting: "Happy Navratri", sub: "Nine nights of garba, one greeting.", tap: "Tap to play dandiya", tapDone: "Jai Mata Di! Happy Navratri.",
    suggestions: ["May Maa Durga bless you with strength, joy and success. Happy Navratri!", "Garba, dandiya and endless dancing. Happy Navratri to you and family!"] }),
  make({ id: "makar-sankranti", name: "Makar Sankranti", glyph: "🪁", seasonal: "14 Jan", themes: pick("kite", "harvest"), art: "kite",
    greeting: "Happy Makar Sankranti", sub: "Kites, til-gud and sunshine.", tap: "Tap to fly the kite", tapDone: "Til gud ghya, god god bola!",
    suggestions: ["May your kite fly high and your year be sweeter than til-gud. Happy Makar Sankranti!"] }),
  make({ id: "pongal-onam", name: "Pongal & Onam", glyph: "🌾", seasonal: "Jan / Aug", themes: pick("harvest", "traditional"), art: "kalash",
    greeting: "Happy Harvest", sub: "For the harvest festivals of the south.", tap: "Tap the pot to let it overflow", tapDone: "Pongalo Pongal! Happy Onam!",
    suggestions: ["Wishing you a bountiful harvest of happiness and prosperity. Happy Pongal!", "May this Onam fill your home with joy and a grand sadya. Happy Onam!"] }),
  make({ id: "mahavir-jayanti", name: "Mahavir Jayanti", glyph: "🪷", seasonal: "Mar–Apr", themes: pick("jain", "minimal"), art: "lotus",
    greeting: "Happy Mahavir Jayanti", sub: "Ahimsa, satya and a lotus in bloom.", tap: "Tap the lotus", tapDone: "Jai Jinendra! Happy Mahavir Jayanti.",
    suggestions: ["May the teachings of Bhagwan Mahavir guide us towards truth, non-violence and peace. Jai Jinendra!"] }),
  make({ id: "kshamavani", name: "Micchami Dukkadam", glyph: "🙏", seasonal: "Paryushan", themes: pick("jain", "solemn"), art: "lotus",
    greeting: "Micchami Dukkadam", sub: "Seek and offer forgiveness after Paryushan.", tap: "Tap to offer kshama", tapDone: "Uttam Kshama. Jai Jinendra.",
    suggestions: ["If I have hurt you knowingly or unknowingly, in thought, word or deed, I seek your forgiveness. Micchami Dukkadam.", "जाने-अनजाने में हुई किसी भी भूल के लिए क्षमा प्रार्थी हूँ। मिच्छामि दुक्कड़म्।"] }),
  make({ id: "gurpurab", name: "Gurpurab", glyph: "☬", seasonal: "Nov", themes: pick("harvest", "minimal"), art: "sun",
    greeting: "Happy Gurpurab", sub: "Prakash Purab wishes for your sangat.", tap: "Tap to light the lamp", tapDone: "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh!",
    suggestions: ["May Guru Nanak Dev Ji's light guide you always. Happy Gurpurab!"] }),
];
