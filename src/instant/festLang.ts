// Languages a festival card can be read in, and the personal-link helpers the bulk sender uses.
// Only the fixed wording is translated; the sender's own message stays as they wrote it,
// unless it is one of the ready-made lines (then it follows the language too).

export type LangId = "en" | "hi" | "gu" | "mr" | "ta";
export interface Lang { id: LangId; label: string; head: string; dear: string; msg: string; from: string; tap: string; done: string; back: string; btn: string; share: string }

export const DIWALI_LANGS: Lang[] = [
  { id: "en", label: "English", head: "Happy Diwali", dear: "Dear {n},", msg: "May the light of the diyas fill your home with joy, health and prosperity. Happy Diwali!", from: "With love,", tap: "Tap the diyas to light them", done: "Shubh Deepavali! May your home glow all year.", back: "Happy Diwali to you and your family too, {sender}! 🙏", btn: "Wish them back on WhatsApp", share: "Happy Diwali" },
  { id: "hi", label: "हिन्दी", head: "शुभ दीपावली", dear: "प्रिय {n},", msg: "दीपों का यह पावन त्योहार आपके और आपके परिवार के जीवन में सुख, समृद्धि और खुशियाँ लाए। शुभ दीपावली!", from: "प्रेम सहित,", tap: "दीयों को जलाने के लिए छुएँ", done: "शुभ दीपावली! आपका घर पूरे साल जगमगाता रहे।", back: "{sender}, आपको और आपके परिवार को भी शुभ दीपावली! 🙏", btn: "व्हाट्सऐप पर शुभकामना भेजें", share: "शुभ दीपावली" },
  { id: "gu", label: "ગુજરાતી", head: "શુભ દિવાળી", dear: "પ્રિય {n},", msg: "દીવાઓનો આ પવિત્ર તહેવાર તમારા અને તમારા પરિવારના જીવનમાં સુખ, સમૃદ્ધિ અને આનંદ લાવે. શુભ દિવાળી!", from: "પ્રેમ સહિત,", tap: "દીવા પ્રગટાવવા અડકો", done: "શુભ દિવાળી! તમારું ઘર આખું વર્ષ ઝગમગતું રહે.", back: "{sender}, તમને અને તમારા પરિવારને પણ શુભ દિવાળી! 🙏", btn: "વોટ્સએપ પર શુભેચ્છા મોકલો", share: "શુભ દિવાળી" },
  { id: "mr", label: "मराठी", head: "शुभ दिवाळी", dear: "प्रिय {n},", msg: "दिव्यांचा हा पवित्र सण तुमच्या आणि तुमच्या कुटुंबाच्या जीवनात सुख, समृद्धी आणि आनंद घेऊन येवो. शुभ दिवाळी!", from: "प्रेमपूर्वक,", tap: "दिवे लावण्यासाठी स्पर्श करा", done: "शुभ दिवाळी! तुमचे घर वर्षभर उजळत राहो.", back: "{sender}, तुम्हालाही आणि तुमच्या कुटुंबालाही शुभ दिवाळी! 🙏", btn: "व्हॉट्सॲपवर शुभेच्छा पाठवा", share: "शुभ दिवाळी" },
  { id: "ta", label: "தமிழ்", head: "இனிய தீபாவளி", dear: "அன்புள்ள {n},", msg: "தீபங்களின் இந்தத் திருநாள் உங்கள் வாழ்விலும் உங்கள் குடும்பத்திலும் மகிழ்ச்சியையும் செழிப்பையும் கொண்டு வரட்டும். இனிய தீபாவளி!", from: "அன்புடன்,", tap: "தீபங்களை ஏற்றத் தொடுங்கள்", done: "இனிய தீபாவளி! உங்கள் இல்லம் ஆண்டு முழுவதும் ஒளிரட்டும்.", back: "{sender}, உங்களுக்கும் உங்கள் குடும்பத்திற்கும் இனிய தீபாவளி! 🙏", btn: "வாட்ஸ்அப்பில் வாழ்த்து அனுப்பவும்", share: "இனிய தீபாவளி" },
];

export const langById = (id: string | null | undefined) => DIWALI_LANGS.find((l) => l.id === id) ?? DIWALI_LANGS[0];

/** A name travels in the link as ?to=Rahul-Sharma. Reads it back as plain, safe text (React escapes it on display). */
export function nameFromParam(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw;
  try { s = decodeURIComponent(raw); } catch { /* keep as typed */ }
  return s.replace(/[-_+]+/g, " ").replace(/[<>{}\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
}

export function paramFromName(name: string): string {
  return encodeURIComponent(name.trim().replace(/\s+/g, "-").slice(0, 30));
}

export interface Person { name: string; phone: string }

/** "Rahul Sharma, 98xxxxxx12" per line (the number is optional). Up to 200 people. */
export function parsePeople(text: string): Person[] {
  return text.split(/\r?\n/).map((line) => {
    const m = line.match(/^(.*?)[,\t;|]\s*([+\d][\d\s-]{8,})\s*$/);
    const name = (m ? m[1] : line).trim();
    return name ? { name: name.slice(0, 30), phone: m ? m[2].replace(/\D/g, "") : "" } : null;
  }).filter((p): p is Person => !!p).slice(0, 200);
}

/** The page link for one person, with their name (and a language, if not English). */
export function personalLink(base: string, name: string, lang: LangId = "en"): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}to=${paramFromName(name)}${lang !== "en" ? `&lang=${lang}` : ""}`;
}
