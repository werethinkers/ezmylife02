import type { SuggestionSet } from "../types";

// Ready-made words for the celebration cards. Each line is a starting point: people edit it, so it
// stays warm and plain. Lines are gender-neutral where the sender or receiver could be either.

export const EN = "English", HINGLISH = "Hinglish", HI = "हिन्दी";

/** Birthday lines by recipient and language. */
export const BIRTHDAY_SETS: SuggestionSet[] = [
  { who: "Friend", lang: EN, items: [
    "Happy birthday! Thank you for being the person I can call at 2 a.m. about absolutely nothing. Here's to your best year yet.",
    "Another year of you being wonderful. I hope this one is loud, happy and full of everything you keep saying you'll do someday.",
    "Happy birthday to my favourite human. Cake first, then everything else.",
  ] },
  { who: "Friend", lang: HINGLISH, items: [
    "Happy birthday yaar! Tu hai toh life mein masti hai. Aaj ka din sirf tera hai, jam ke party karna!",
    "Janamdin mubarak mere dost! Teri wajah se har plan mazedaar ho jaata hai. Cake pehle, baaki sab baad mein.",
  ] },
  { who: "Friend", lang: HI, items: [
    "जन्मदिन की ढेरों शुभकामनाएँ दोस्त! तुम्हारे बिना ज़िंदगी में इतनी रौनक न होती। आज का दिन ख़ूब मज़े से मनाना!",
    "जन्मदिन मुबारक हो! तुम्हारा यह साल हँसी, सेहत और ढेर सारी खुशियों से भरा रहे।",
  ] },

  { who: "Partner", lang: EN, items: [
    "Happy birthday, my love. Every day with you feels like a celebration, but today I get to say it out loud. I love you more than this page can hold.",
    "You make ordinary days feel special. Today is all yours. Happy birthday, my heart.",
  ] },
  { who: "Partner", lang: HINGLISH, items: [
    "Happy birthday meri jaan! Tumhare saath har din special hai, aur aaj toh poora din tumhara hai. I love you, hamesha.",
    "Tum meri life ki sabse pyaari baat ho. Janamdin mubarak, mere dil.",
  ] },
  { who: "Partner", lang: HI, items: [
    "जन्मदिन मुबारक हो मेरी जान! तुम्हारे साथ हर दिन ख़ास है, और आज का दिन तो पूरा तुम्हारा है। मेरा प्यार हमेशा तुम्हारे साथ है।",
    "तुम मेरी ज़िंदगी की सबसे प्यारी बात हो। जन्मदिन मुबारक, मेरे दिल।",
  ] },

  { who: "Mom or Dad", lang: EN, items: [
    "Happy birthday! Everything good in me started with you. Thank you for every sacrifice you never mentioned. I hope today is full of your favourite things.",
    "To the first person who believed in me: happy birthday. I'm so proud to be yours.",
  ] },
  { who: "Mom or Dad", lang: HINGLISH, items: [
    "Happy birthday! Aapki wajah se hi main aaj yahan hoon. Aap hamesha khush aur healthy rahein, yahi meri dua hai.",
    "Aapne mere liye jo kuch kiya, uska shukriya shabdon mein nahi ho sakta. Janamdin mubarak!",
  ] },
  { who: "Mom or Dad", lang: HI, items: [
    "जन्मदिन की हार्दिक शुभकामनाएँ! आपने मेरे लिए जो कुछ किया, उसके लिए दिल से धन्यवाद। आप सदा स्वस्थ और खुश रहें, यही मेरी प्रार्थना है।",
    "आपके आशीर्वाद से ही मैं आज यहाँ हूँ। जन्मदिन मुबारक हो!",
  ] },

  { who: "Sibling", lang: EN, items: [
    "Happy birthday! We've fought over everything, but you're still my first call when it matters. Love you, always.",
    "Happy birthday to my partner in crime. The treat is on you, but the love is free.",
  ] },
  { who: "Sibling", lang: HINGLISH, items: [
    "Happy birthday! Humne bahut ladaai ki hai, par tu mera sabse pehla dost hai. Treat meri taraf se!",
    "Janamdin mubarak! Tere bina ghar mein itni raunak nahi hoti. Love you, hamesha.",
  ] },
  { who: "Sibling", lang: HI, items: [
    "जन्मदिन मुबारक हो! हम चाहे कितना भी लड़ लें, तुम मेरे सबसे अपने हो। आज की पार्टी मेरी तरफ़ से!",
    "तुम्हारे बिना घर में रौनक नहीं होती। जन्मदिन की ढेरों शुभकामनाएँ!",
  ] },

  { who: "Bhabhi or in-laws", lang: EN, items: [
    "Happy birthday! You've made our family so much warmer. We're lucky to have you. Wishing you health, joy and a year as lovely as you are.",
    "Thank you for the love, the laughter and the food that disappears in minutes. Happy birthday!",
  ] },
  { who: "Bhabhi or in-laws", lang: HINGLISH, items: [
    "Happy birthday! Aapke aane se hamare ghar mein aur khushi aur apnapan aa gaya. Aap hamesha swasth aur muskurate rahein.",
    "Aapke haath ke khane aur pyaar ke liye shukriya. Janamdin mubarak ho!",
  ] },
  { who: "Bhabhi or in-laws", lang: HI, items: [
    "जन्मदिन की हार्दिक शुभकामनाएँ! आपके आने से हमारा परिवार और भी खुशहाल हो गया है। आप सदा स्वस्थ और मुस्कुराते रहें।",
    "आपके प्यार और अपनेपन के लिए धन्यवाद। जन्मदिन मुबारक हो!",
  ] },

  { who: "Colleague", lang: EN, items: [
    "Happy birthday! Thank you for making work a better place to be. Wishing you a wonderful day and a year full of good news.",
    "Happy birthday! Hope today comes with cake, calm and zero meetings.",
  ] },
  { who: "Colleague", lang: HINGLISH, items: [
    "Happy birthday! Aapke saath kaam karna hamesha achha lagta hai. Aapka saal khushiyon aur success se bhara ho.",
    "Janamdin mubarak! Aaj ke din sirf cake aur muskurahat. Kaam kal dekhenge!",
  ] },
  { who: "Colleague", lang: HI, items: [
    "जन्मदिन की हार्दिक शुभकामनाएँ! आपके साथ काम करना हमेशा अच्छा लगता है। आपका नया साल सफलता और खुशियों से भरा हो।",
    "जन्मदिन मुबारक! आज सिर्फ़ केक और मुस्कान, काम कल देखेंगे!",
  ] },
];

/** Greeting lines a birthday card can open with (the big headline). */
export const BIRTHDAY_HEADLINES = ["Happy Birthday", "Many Happy Returns", "Janmdin Mubarak", "जन्मदिन मुबारक", "Happy Birthday to You"];

/**
 * Extra one-tap lines for the other celebration cards, added after each card's own first line:
 * a Hinglish line and a Hindi line, so people can write in the language they would actually say it in.
 */
export const MORE_SUGGESTIONS: Record<string, string[]> = {
  anniversary: [
    "Happy anniversary! Thank you for every ordinary day you made feel like a celebration.",
    "Saalgirah mubarak, meri jaan! Tumhare saath har saal pichle se bhi khoobsurat hota hai.",
    "सालगिरह मुबारक हो! तुम्हारे साथ बिताया हर साल पहले से ज़्यादा ख़ूबसूरत है।",
  ],
  valentine: [
    "You're my favourite notification, my favourite hello and my favourite goodbye. Happy Valentine's Day.",
    "Happy Valentine's Day, jaan! Tum ho toh har din 14 February lagta hai.",
  ],
  proposal: [
    "I don't need a perfect life, just a lifetime with you. Will you marry me?",
    "I can't promise everything, but I promise chai, laughter and me, always on your side. Will you marry me?",
  ],
  friendship: [
    "Dosti ka matlab hai bina bole samajh jaana. Happy Friendship Day, yaar!",
    "फ्रेंडशिप डे मुबारक हो! तुम जैसे दोस्त किस्मत वालों को ही मिलते हैं।",
  ],
  "thank-you": [
    "Aapka bahut bahut shukriya! Aapki madad ke bina yeh mumkin nahi tha.",
    "आपका बहुत-बहुत धन्यवाद! आपकी मदद हमेशा याद रहेगी।",
  ],
  congratulations: [
    "Congratulations! Aapki mehnat rang laayi hai. Humein aap par bahut garv hai!",
    "बहुत-बहुत बधाई हो! आपकी मेहनत रंग लाई है।",
  ],
  farewell: [
    "Aapke bina office mein pehle jaisi baat nahi rahegi. Naye safar ke liye bahut shubhkamnayein!",
    "आपके नए सफ़र के लिए ढेरों शुभकामनाएँ। हमें आपकी बहुत याद आएगी।",
  ],
  retirement: [
    "Congratulations on your retirement! Ab apne shauk poore karne ka waqt hai. Enjoy karo, aapne kamaya hai!",
    "सेवानिवृत्ति की हार्दिक शुभकामनाएँ! आपका अनुभव और मार्गदर्शन हमेशा याद रहेगा।",
  ],
  graduation: [
    "Congratulations, graduate! Degree mil gayi, ab duniya jeetne ki baari hai.",
    "स्नातक होने पर बहुत-बहुत बधाई! आपकी मेहनत रंग लाई है।",
  ],
  "mothers-day": [
    "Happy Mother's Day, Maa! Aap meri sabse badi taakat ho. Love you!",
    "मदर्स डे की शुभकामनाएँ माँ! आपके बिना मैं कुछ भी नहीं।",
  ],
  "fathers-day": [
    "Happy Father's Day, Papa! Aap hi mere hero ho. Aapne jo sikhaya, wahi meri sabse badi poonji hai.",
    "फादर्स डे की शुभकामनाएँ पापा! आपके कंधों पर चढ़कर ही मैंने दुनिया देखी है।",
  ],
  "teachers-day": [
    "Teachers' Day ki hardik shubhkamnayein! Aapne sirf padhaya nahi, jeena bhi sikhaya.",
    "शिक्षक दिवस की हार्दिक शुभकामनाएँ! आपने हमें सिर्फ़ पढ़ाया नहीं, जीना भी सिखाया।",
  ],
  "baby-announcement": [
    "A little miracle has arrived! Humare ghar nanha mehmaan aaya hai. Aapki duaon ki zaroorat hai.",
    "हमारे घर नन्हा मेहमान आया है! आपके आशीर्वाद की ज़रूरत है।",
  ],
  "get-well-soon": [
    "Jaldi theek ho jao! Aapke bina sab kuch adhura lagta hai.",
    "आप जल्दी स्वस्थ हो जाएँ, यही हमारी दुआ है।",
  ],
  sorry: [
    "Mujhse galti ho gayi, aur mujhe sach mein afsos hai. Kya aap mujhe maaf karenge?",
    "मुझसे गलती हुई, और मुझे सच में अफ़सोस है। क्या आप मुझे माफ़ करेंगे?",
  ],
  tribute: [
    "Gone from our sight, never from our hearts.",
    "आप हमेशा हमारे दिलों में रहेंगे। आपकी यादें और सीख हमारे साथ हैं।",
  ],
};
