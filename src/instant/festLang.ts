// Languages a festival card can be read in, and the personal-link helpers the bulk sender uses.
// Only the fixed wording is translated; the sender's own message stays as they wrote it,
// unless it is one of the ready-made lines (then it follows the language too).

export type LangId = "en" | "ind" | "hi" | "gu" | "mr" | "ta";
/** cta: the button that invites the person reading the card to make their own. free: added after it only when the card costs nothing.
 *  count: the live "diyas lit" line, {n} is the real number. */
export interface Lang { id: LangId; label: string; head: string; dear: string; msg: string; from: string; tap: string; done: string; back: string; btn: string; share: string; tapRw: string; cta: string; free: string; count: string }

/** Ready-made lines in Indori Hinglish. A sender who picks one keeps it in every language. */
export const INDORI_LINES = [
  "Bhiya, Diwali ki ram-ram! Saal bhar poha-jalebi jaisa meetha rahe.",
  "Rajwada jaisi jagmagahat aur Sarafa jaisi raunak, aapke ghar mein saal bhar rahe. Happy Diwali!",
  "Apan ki taraf se aapko aur poore parivaar ko Diwali ki dher saari shubhkaamnaaein. Naya saal ekdum mast rahe!",
];

export const DIWALI_LANGS: Lang[] = [
  { id: "en", label: "English", head: "Happy Diwali", dear: "Dear {n},", msg: "May the light of the diyas fill your home with joy, health and prosperity. Happy Diwali!", from: "With love,", tap: "Tap the diyas to light them", done: "Shubh Deepavali! May your home glow all year.", back: "Happy Diwali to you and your family too, {sender}! 🙏", btn: "Wish them back on WhatsApp", share: "Happy Diwali", tapRw: "Tap to light up the Rajwada", cta: "Ab aap apne logon ke liye diye jalao", free: "free", count: "{n} diye jal chuke hain is Diwali" },
  { id: "ind", label: "Indori", head: "Happy Diwali, Bhiya!", dear: "Pyaare {n},", msg: INDORI_LINES[0], from: "Pyaar se,", tap: "Tap karke diye jalao", done: "Shubh Deepawali! Ghar saal bhar jagmagata rahe.", back: "{sender} bhiya, aapko bhi Happy Diwali! 🙏", btn: "WhatsApp pe wish karo", share: "Happy Diwali, Bhiya", tapRw: "Tap karke Rajwada jagmagao", cta: "Ab aap apne logon ke liye diye jalao", free: "free", count: "{n} diye jal chuke hain is Diwali" },
  { id: "hi", label: "हिन्दी", head: "शुभ दीपावली", dear: "प्रिय {n},", msg: "दीपों का यह पावन त्योहार आपके और आपके परिवार के जीवन में सुख, समृद्धि और खुशियाँ लाए। शुभ दीपावली!", from: "प्रेम सहित,", tap: "दीयों को जलाने के लिए छुएँ", done: "शुभ दीपावली! आपका घर पूरे साल जगमगाता रहे।", back: "{sender}, आपको और आपके परिवार को भी शुभ दीपावली! 🙏", btn: "व्हाट्सऐप पर शुभकामना भेजें", share: "शुभ दीपावली", tapRw: "राजवाड़ा जगमगाने के लिए छुएँ", cta: "अब आप अपने लोगों के लिए दीये जलाइए", free: "मुफ़्त", count: "इस दीवाली {n} दीये जल चुके हैं" },
  { id: "gu", label: "ગુજરાતી", head: "શુભ દિવાળી", dear: "પ્રિય {n},", msg: "દીવાઓનો આ પવિત્ર તહેવાર તમારા અને તમારા પરિવારના જીવનમાં સુખ, સમૃદ્ધિ અને આનંદ લાવે. શુભ દિવાળી!", from: "પ્રેમ સહિત,", tap: "દીવા પ્રગટાવવા અડકો", done: "શુભ દિવાળી! તમારું ઘર આખું વર્ષ ઝગમગતું રહે.", back: "{sender}, તમને અને તમારા પરિવારને પણ શુભ દિવાળી! 🙏", btn: "વોટ્સએપ પર શુભેચ્છા મોકલો", share: "શુભ દિવાળી", tapRw: "રાજવાડો ઝગમગાવવા અડકો", cta: "હવે તમે તમારા લોકો માટે દીવા પ્રગટાવો", free: "મફત", count: "આ દિવાળીએ {n} દીવા પ્રગટ્યા છે" },
  { id: "mr", label: "मराठी", head: "शुभ दिवाळी", dear: "प्रिय {n},", msg: "दिव्यांचा हा पवित्र सण तुमच्या आणि तुमच्या कुटुंबाच्या जीवनात सुख, समृद्धी आणि आनंद घेऊन येवो. शुभ दिवाळी!", from: "प्रेमपूर्वक,", tap: "दिवे लावण्यासाठी स्पर्श करा", done: "शुभ दिवाळी! तुमचे घर वर्षभर उजळत राहो.", back: "{sender}, तुम्हालाही आणि तुमच्या कुटुंबालाही शुभ दिवाळी! 🙏", btn: "व्हॉट्सॲपवर शुभेच्छा पाठवा", share: "शुभ दिवाळी", tapRw: "राजवाडा उजळवण्यासाठी स्पर्श करा", cta: "आता तुम्ही तुमच्या माणसांसाठी दिवे लावा", free: "मोफत", count: "या दिवाळीत {n} दिवे लागले आहेत" },
  { id: "ta", label: "தமிழ்", head: "இனிய தீபாவளி", dear: "அன்புள்ள {n},", msg: "தீபங்களின் இந்தத் திருநாள் உங்கள் வாழ்விலும் உங்கள் குடும்பத்திலும் மகிழ்ச்சியையும் செழிப்பையும் கொண்டு வரட்டும். இனிய தீபாவளி!", from: "அன்புடன்,", tap: "தீபங்களை ஏற்றத் தொடுங்கள்", done: "இனிய தீபாவளி! உங்கள் இல்லம் ஆண்டு முழுவதும் ஒளிரட்டும்.", back: "{sender}, உங்களுக்கும் உங்கள் குடும்பத்திற்கும் இனிய தீபாவளி! 🙏", btn: "வாட்ஸ்அப்பில் வாழ்த்து அனுப்பவும்", share: "இனிய தீபாவளி", tapRw: "ராஜ்வாடாவை ஒளிரச் செய்யத் தொடுங்கள்", cta: "இப்போது உங்கள் அன்பானவர்களுக்கு தீபம் ஏற்றுங்கள்", free: "இலவசம்", count: "இந்த தீபாவளியில் {n} தீபங்கள் ஏற்றப்பட்டுள்ளன" },
];

/** The value for an HTML lang attribute: Indori is Hindi written in Latin letters. */
export const htmlLang = (id: LangId) => (id === "ind" ? "hi-Latn" : id);

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

/** The page link with the sender's chosen language (English is the default, so it adds nothing). */
export function withLang(link: string, lang: LangId = "en"): string {
  return lang === "en" ? link : `${link}${link.includes("?") ? "&" : "?"}lang=${lang}`;
}

/** The page link for one person, with their name (and a language, if not English). */
export function personalLink(base: string, name: string, lang: LangId = "en"): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}to=${paramFromName(name)}${lang !== "en" ? `&lang=${lang}` : ""}`;
}
