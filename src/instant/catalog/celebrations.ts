import type { Content, Product, Theme } from "../types";
import { celebrationSteps, F, type CelebrationLabels } from "../fields";
import { ten } from "../themes";
import { stockFor, stockPhoto } from "../stock";

interface Def {
  id: string; name: string; tagline: string; description: string; glyph: string; price: number; themes: Theme[];
  popular?: boolean; seasonal?: string;
  labels?: CelebrationLabels;
  opts: {
    opening: "gift" | "envelope" | "heart" | "candle" | "star";
    moment: "cake" | "together" | "question" | "wish" | "diploma" | "baby" | "candle" | "trophy" | "hug" | "bouquet";
    music: "birthday" | "gentle" | "none";
    greeting: string;        // headline, {recipient} allowed
    openLine: string;        // shown on the closed gift
    cta: string;
    momentTitle: string; momentHint: string; momentDone: string;
    letterTitle: string; memoriesTitle: string; endTitle: string;
    numbers?: "age" | "together" | null;
  };
  sample: Content;
  whatsapp: { reply: string };
  share: string;
}

const make = (d: Def): Product => ({
  id: d.id, family: "celebration", category: "celebrations", name: d.name, tagline: d.tagline, description: d.description,
  glyph: d.glyph, price: d.price, popular: d.popular, seasonal: d.seasonal, themes: d.themes,
  steps: celebrationSteps(d.labels ?? {}), sample: { music: d.opts.music !== "none", ...withStock(d.id, d.sample) }, titleField: "recipient",
  whatsapp: d.whatsapp, share: d.share, opts: d.opts, indexable: false,
});

/** Sample memories show real-looking stock photos; the drawn sample art stays as a fallback. */
function withStock(id: string, sample: Content): Content {
  const shots = stockFor(id);
  if (!shots.length) return sample;
  if (!Array.isArray(sample.memories) || !sample.memories.length) return { ...sample, memories: shots.slice(0, 3).map((x) => ({ caption: "", photo: stockPhoto(x, 900) })) };
  return { ...sample, memories: sample.memories.map((m: Content, i: number) => (shots[i] ? { ...m, photo: stockPhoto(shots[i], 900) } : m)) };
}

const mem = (...c: [string, string][]) => c.map(([caption, photo]) => ({ caption, photo: "sample:" + photo }));

export const CELEBRATIONS: Product[] = [
  make({
    id: "birthday-surprise", name: "Birthday Surprise", glyph: "🎂", price: 29, popular: true,
    tagline: "A gift they tap open: music, candles, your letter, your photos.",
    description: "A birthday page that unwraps like a present. They blow out the candles, read your note and swipe through your photos together.",
    themes: ten("cheer", "fun", "elegant", "romantic", "minimal"),
    labels: { date: "Their birthday", age: true, messageSuggestions: [
      "Happy birthday! Thank you for being the person everyone calls first. Here's to your best year yet.",
      "Another year of you being wonderful. I hope this one is loud, happy and full of everything you keep saying you'll do someday.",
      "Happy birthday to my favourite human. Cake first, then everything else.",
    ] },
    opts: { opening: "gift", moment: "cake", music: "birthday", greeting: "Happy Birthday", openLine: "{sender} sent you a birthday surprise.", cta: "Tap to open your surprise",
      momentTitle: "Make a wish.", momentHint: "Close your eyes, make a wish, then tap the cake to blow out the candles.", momentDone: "Wish made. Don't tell anyone. {sender} is sure it's coming true.",
      letterTitle: "Read this one slowly.", memoriesTitle: "A few of my favourite days.", endTitle: "Have the best year yet.", numbers: "age" },
    sample: { recipient: "Priya", sender: "Rahul", age: 25, message: "Another year of you being the person everyone calls first. Thank you for every late-night chai, every terrible movie you made me sit through, and for always showing up.\nI hope this year is loud, happy and full of the things you keep saying you'll do someday.\nHere's to 25.", memories: mem(["Goa, December 2023", "beach"], ["That Manali road trip", "hills"], ["Diwali on the terrace", "lights"], ["Rooftop chai, always", "city"]) },
    whatsapp: { reply: "{sender}!! I just opened my birthday surprise 🥹❤️ Thank you so much!" },
    share: "🎉 I made something special for you, {recipient}!\nOpen your surprise:\n{link} ❤️",
  }),
  make({
    id: "anniversary", name: "Anniversary Love Note", glyph: "💞", price: 29, popular: true,
    tagline: "Your story so far, counted in days, with your photos and a love letter.",
    description: "Counts every day you've been together, opens to a love letter and walks through your memories.",
    themes: ten("love", "romantic", "elegant", "minimal", "fun"),
    labels: { recipient: "Your partner's name", date: "The day it all started", messageSuggestions: [
      "Happy anniversary. Every year with you is my favourite year so far.",
      "Thank you for choosing me, every single day. Here's to many more years of us.",
    ] },
    opts: { opening: "heart", moment: "together", music: "gentle", greeting: "Happy Anniversary", openLine: "{sender} has something to tell you.", cta: "Open with love",
      momentTitle: "Together for", momentHint: "And counting, every single second.", momentDone: "",
      letterTitle: "From my heart.", memoriesTitle: "Us, so far.", endTitle: "Here's to forever.", numbers: "together" },
    sample: { recipient: "Ananya", sender: "Karan", date: "2019-02-14", message: "Seven years since that first awkward coffee, and you still laugh at my worst jokes.\nThank you for building this life with me. I'd choose you again, every time.", memories: mem(["Our first trip", "hills"], ["The wedding night", "lights"], ["Sunday mornings", "city"], ["Goa, again", "beach"]) },
    whatsapp: { reply: "{sender} ❤️ I just opened it. I love you!" },
    share: "💞 Happy anniversary, {recipient}. I made this for us:\n{link}",
  }),
  make({
    id: "valentine", name: "Valentine's Day", glyph: "🌹", price: 19, seasonal: "Feb", popular: true,
    tagline: "A rose that blooms into your love letter.",
    description: "A Valentine's page with a heart to open, a love letter and a question only they can answer.",
    themes: ten("love", "romantic", "fun", "elegant"),
    labels: { recipient: "Your Valentine's name", messageSuggestions: ["Happy Valentine's Day to the one who makes ordinary days feel like holidays.", "You, me, and every 14th of February from now on."] },
    opts: { opening: "heart", moment: "bouquet", music: "gentle", greeting: "Happy Valentine's Day", openLine: "{sender} sent you something sweet.", cta: "Tap the heart",
      momentTitle: "These are for you.", momentHint: "Tap the bouquet.", momentDone: "A dozen roses, delivered by {sender}.",
      letterTitle: "Be mine?", memoriesTitle: "My favourite moments with you.", endTitle: "Forever your Valentine.", numbers: null },
    sample: { recipient: "Meera", sender: "Aarav", message: "I don't need a special day to love you, but I'll take any excuse to tell you.\nHappy Valentine's Day, my favourite person.", memories: mem(["Our first date", "city"], ["That sunset", "beach"]) },
    whatsapp: { reply: "Aww {sender} 🥰 Happy Valentine's Day!" },
    share: "🌹 For you, {recipient}:\n{link}",
  }),
  make({
    id: "proposal", name: "Will You Marry Me?", glyph: "💍", price: 49,
    tagline: "The question, asked beautifully. The 'No' button runs away.",
    description: "A proposal page that builds up with your story and ends with the question. They can only say yes.",
    themes: ten("love", "romantic", "elegant", "minimal"),
    labels: { recipient: "Their name", messageSuggestions: ["From the first day I met you, I knew. I want every morning, every argument, every adventure to be with you."] },
    opts: { opening: "star", moment: "question", music: "gentle", greeting: "{recipient},", openLine: "{sender} has a question for you.", cta: "Open it",
      momentTitle: "Will you marry me?", momentHint: "", momentDone: "SHE SAID YES! 💍",
      letterTitle: "Before I ask...", memoriesTitle: "Every road led to you.", endTitle: "Yes. Forever.", numbers: null },
    sample: { recipient: "Tanvi", sender: "Arjun", message: "Five years, two cities, one very patient dog and a thousand cups of chai.\nYou're my favourite person and my best friend. I don't want to imagine a life where I don't get to annoy you every day.", memories: mem(["Where we met", "city"], ["Our first trip", "hills"], ["Every Diwali since", "lights"]) },
    whatsapp: { reply: "YES!!! 💍❤️ {sender}, a thousand times yes!" },
    share: "💍 {recipient}, I have a question for you:\n{link}",
  }),
  make({
    id: "friendship", name: "Friendship Day", glyph: "🤝", price: 19, seasonal: "Aug",
    tagline: "For the friend who's family. Inside jokes welcome.",
    description: "A page for your best friend: a letter, your photos and a band only the two of you get.",
    themes: ten("cheer", "fun", "sunny", "lilac"),
    labels: { recipient: "Your friend's name", messageSuggestions: ["Happy Friendship Day to the one person who knows all my secrets and still picks up my calls."] },
    opts: { opening: "gift", moment: "hug", music: "gentle", greeting: "Happy Friendship Day", openLine: "{sender} tied you a friendship band.", cta: "Open it",
      momentTitle: "Your friendship band.", momentHint: "Tap to tie it on.", momentDone: "Tied. No take-backs. Best friends, officially.",
      letterTitle: "To my person.", memoriesTitle: "Proof we're legends.", endTitle: "Friends forever, no refunds.", numbers: null },
    sample: { recipient: "Ishaan", sender: "Kabir", message: "Twelve years, three cities, one shared brain cell.\nThanks for being the friend I don't have to explain anything to.", memories: mem(["College canteen", "city"], ["The road trip", "hills"]) },
    whatsapp: { reply: "Bro 😭 {sender} this is too much. Love you yaar!" },
    share: "🤝 Happy Friendship Day, {recipient}!\n{link}",
  }),
  make({
    id: "thank-you", name: "Thank You Card", glyph: "🙏", price: 19,
    tagline: "A proper thank-you, better than a text.",
    description: "Say thank you to a teacher, a mentor, a doctor or a friend, with a note they'll keep.",
    themes: ten("gentle", "minimal", "sunny", "elegant"),
    labels: { recipient: "Who are you thanking?", messageSuggestions: ["Thank you for everything you did. It meant more than you know.", "I wouldn't be where I am without your help. Thank you, truly."] },
    opts: { opening: "envelope", moment: "bouquet", music: "gentle", greeting: "Thank you, {recipient}", openLine: "A thank-you note from {sender}.", cta: "Open the card",
      momentTitle: "Flowers, for you.", momentHint: "Tap to accept.", momentDone: "With gratitude, from {sender}.",
      letterTitle: "What I wanted to say.", memoriesTitle: "Moments I'm grateful for.", endTitle: "Thank you, again.", numbers: null },
    sample: { recipient: "Mrs. Kapoor", sender: "Riya", message: "You stayed back every Saturday to help me prepare. I got the seat, and half of it is yours.\nThank you for believing in me before I did.", memories: [] },
    whatsapp: { reply: "Thank you, {sender}. This made my day 😊" },
    share: "🙏 A small thank-you for {recipient}:\n{link}",
  }),
  make({
    id: "congratulations", name: "Congratulations", glyph: "🏆", price: 19,
    tagline: "For the promotion, the new job, the big win.",
    description: "Celebrate someone's achievement with confetti, a trophy and a note from you.",
    themes: ten("cheer", "sunny", "fun", "elegant"),
    labels: { recipient: "Who are you congratulating?", extra: [F.text("achievement", "What did they achieve?", { max: 50, placeholder: "e.g. The new job at Infosys" })], messageSuggestions: ["So proud of you! You worked so hard for this, and you deserve every bit of it."] },
    opts: { opening: "star", moment: "trophy", music: "gentle", greeting: "Congratulations, {recipient}!", openLine: "{sender} is cheering for you.", cta: "Open it",
      momentTitle: "{achievement}", momentHint: "Tap the trophy.", momentDone: "Champion. Officially.",
      letterTitle: "A note from {sender}.", memoriesTitle: "The journey.", endTitle: "On to the next one.", numbers: null },
    sample: { recipient: "Neha", sender: "The whole team", achievement: "Promoted to Design Lead", message: "Nobody deserves this more. Thank you for every late night, every rescue and every terrible pun in standup.\nWe're so proud of you.", memories: [] },
    whatsapp: { reply: "Thank you so much, {sender}! 🥳" },
    share: "🏆 Congratulations, {recipient}!\n{link}",
  }),
  make({
    id: "farewell", name: "Farewell Wishes", glyph: "👋", price: 29,
    tagline: "Goodbyes from the whole team, in one page.",
    description: "A farewell page for a colleague or friend who's moving on, with your note and the memories.",
    themes: ten("gentle", "minimal", "lilac", "elegant"),
    labels: { recipient: "Who's leaving?", sender: "From", messageSuggestions: ["The office won't be the same without you. Go show the world what we already know."] },
    opts: { opening: "envelope", moment: "wish", music: "gentle", greeting: "Farewell, {recipient}", openLine: "{sender} wanted to say goodbye properly.", cta: "Open the card",
      momentTitle: "Send them off.", momentHint: "Tap to launch the paper plane.", momentDone: "Off you go. Keep in touch!",
      letterTitle: "From all of us.", memoriesTitle: "The good old days.", endTitle: "Not goodbye, see you soon.", numbers: null },
    sample: { recipient: "Vikram", sender: "Team Product", message: "Six years, 40 releases, 1,000 chai breaks.\nThank you for teaching us how to ship. We'll miss you, and your playlists.", memories: mem(["Team offsite", "hills"], ["Diwali party", "lights"]) },
    whatsapp: { reply: "This means a lot. Thank you, {sender}! 🙏" },
    share: "👋 Farewell, {recipient}. Something from all of us:\n{link}",
  }),
  make({
    id: "retirement", name: "Happy Retirement", glyph: "🌅", price: 29,
    tagline: "Honour a lifetime of work, with the family's photos and wishes.",
    description: "A warm retirement page with years of service, your note and photos from the journey.",
    themes: ten("gentle", "elegant", "sunny", "minimal"),
    labels: { recipient: "Who's retiring?", sender: "From", extra: [F.num("years", "Years of service", { max: 2 })], messageSuggestions: ["Thirty-five years of hard work, and now it's time for long mornings, travel and grandchildren. You've earned every bit of it."] },
    opts: { opening: "envelope", moment: "trophy", music: "gentle", greeting: "Happy Retirement", openLine: "{sender} has a message for you.", cta: "Open the card",
      momentTitle: "{years} years of service.", momentHint: "Tap to raise a toast.", momentDone: "Cheers to the next chapter!",
      letterTitle: "With love and respect.", memoriesTitle: "Through the years.", endTitle: "Enjoy every sunrise.", numbers: null },
    sample: { recipient: "Papa", sender: "Riya, Aman & Maa", years: 35, message: "Thirty-five years of leaving at 8 and coming home with jalebis on Fridays.\nNow it's your time. Morning walks, long trips and all the cricket you want.", memories: mem(["First day at the bank, 1990", "city"], ["Kashmir trip", "hills"]) },
    whatsapp: { reply: "My dear {sender}, this made me cry. Thank you ❤️" },
    share: "🌅 Happy Retirement, {recipient}!\n{link}",
  }),
  make({
    id: "graduation", name: "Graduation Day", glyph: "🎓", price: 19, seasonal: "May–Jul",
    tagline: "Caps in the air for the new graduate.",
    description: "Celebrate a graduate with a cap toss, your note and the photos from the journey.",
    themes: ten("cheer", "sunny", "elegant", "fun"),
    labels: { recipient: "Graduate's name", extra: [F.text("achievement", "Degree / school", { max: 60, placeholder: "e.g. B.Tech, VIT Vellore" })], messageSuggestions: ["Four years of all-nighters and you made it. So proud of you, graduate!"] },
    opts: { opening: "star", moment: "diploma", music: "gentle", greeting: "Congratulations, Graduate!", openLine: "{sender} is so proud of you.", cta: "Open it",
      momentTitle: "{achievement}", momentHint: "Tap to toss your cap.", momentDone: "Class of {year}. Officially.",
      letterTitle: "Proud of you.", memoriesTitle: "The journey here.", endTitle: "The world is waiting.", numbers: null },
    sample: { recipient: "Aditya", sender: "Mom & Dad", achievement: "B.Tech, Computer Science", message: "From learning to tie your shoes to tossing that cap.\nWe are so proud of you, beta. Go build something wonderful.", memories: mem(["First day of college", "city"]) },
    whatsapp: { reply: "Thank you {sender} ❤️ Couldn't have done it without you." },
    share: "🎓 Congratulations, {recipient}!\n{link}",
  }),
  make({
    id: "mothers-day", name: "Mother's Day", glyph: "💐", price: 19, seasonal: "May",
    tagline: "For Maa. Flowers, a letter and the family photos.",
    description: "A Mother's Day page with a bouquet, a letter from you and the family's favourite photos.",
    themes: ten("love", "romantic", "sunny", "elegant"),
    labels: { recipient: "What do you call her?", messageSuggestions: ["Maa, thank you for every tiffin, every prayer and every time you waited up. I love you."] },
    opts: { opening: "envelope", moment: "bouquet", music: "gentle", greeting: "Happy Mother's Day, {recipient}", openLine: "{sender} has a letter for you.", cta: "Open the card",
      momentTitle: "These are for you.", momentHint: "Tap the bouquet.", momentDone: "For the best Maa in the world.",
      letterTitle: "Everything I never say enough.", memoriesTitle: "Our moments.", endTitle: "Love you, always.", numbers: null },
    sample: { recipient: "Maa", sender: "Ishita", message: "Thank you for every tiffin, every prayer, and every time you stayed up until I got home.\nI don't say it enough. I love you.", memories: mem(["Diwali at home", "lights"]) },
    whatsapp: { reply: "Mera bachcha ❤️ Thank you {sender}!" },
    share: "💐 Happy Mother's Day, {recipient}:\n{link}",
  }),
  make({
    id: "fathers-day", name: "Father's Day", glyph: "👔", price: 19, seasonal: "Jun",
    tagline: "For Papa, who never asks for anything.",
    description: "A Father's Day page with a letter from you, the family photos and a trophy he's earned.",
    themes: ten("gentle", "elegant", "minimal", "sunny"),
    labels: { recipient: "What do you call him?", messageSuggestions: ["Papa, thank you for every sacrifice you never talked about. You're my hero."] },
    opts: { opening: "envelope", moment: "trophy", music: "gentle", greeting: "Happy Father's Day, {recipient}", openLine: "{sender} has a letter for you.", cta: "Open the card",
      momentTitle: "World's best Papa.", momentHint: "Tap to award the trophy.", momentDone: "Awarded. Unanimously.",
      letterTitle: "What I want you to know.", memoriesTitle: "Growing up with you.", endTitle: "My first hero.", numbers: null },
    sample: { recipient: "Papa", sender: "Rohan", message: "You taught me to ride a cycle, to drive, and to never leave without saying bye.\nThank you for everything you never talked about.", memories: [] },
    whatsapp: { reply: "Proud of you beta. Thank you {sender} 🙏" },
    share: "👔 Happy Father's Day, {recipient}:\n{link}",
  }),
  make({
    id: "teachers-day", name: "Teacher's Day", glyph: "📚", price: 19, seasonal: "5 Sep",
    tagline: "Thank the teacher who changed things for you.",
    description: "A Teacher's Day card from one student or a whole class.",
    themes: ten("cheer", "sunny", "minimal", "lilac"),
    labels: { recipient: "Teacher's name", sender: "From (you or your class)", messageSuggestions: ["Thank you for your patience, your encouragement and for making us love learning. Happy Teacher's Day!"] },
    opts: { opening: "envelope", moment: "bouquet", music: "gentle", greeting: "Happy Teacher's Day", openLine: "{sender} made this for you.", cta: "Open the card",
      momentTitle: "An apple for the teacher.", momentHint: "Tap to accept.", momentDone: "With love from {sender}.",
      letterTitle: "Thank you for everything.", memoriesTitle: "Class memories.", endTitle: "You made the difference.", numbers: null },
    sample: { recipient: "Sharma Sir", sender: "Class 12-B", message: "Thank you for every extra class, every 'one more time' and every bad joke that made physics bearable.\nHappy Teacher's Day!", memories: [] },
    whatsapp: { reply: "Thank you dear {sender}. God bless you all 🙏" },
    share: "📚 Happy Teacher's Day, {recipient}!\n{link}",
  }),
  make({
    id: "baby-announcement", name: "Baby Announcement", glyph: "🍼", price: 29,
    tagline: "Introduce your little one to the family.",
    description: "Announce a new arrival with the baby's name, birth details and first photos.",
    themes: ten("cheer", "lilac", "sunny", "minimal"),
    labels: { recipient: "Baby's name", sender: "Proud parents", date: "Date of birth", extra: [F.text("weight", "Weight (optional)", { max: 12, placeholder: "3.2 kg" }), F.text("birth_time", "Time of birth (optional)", { max: 12 })], messageSuggestions: ["Our hearts are full. Please welcome our little one to the world!"] },
    opts: { opening: "star", moment: "baby", music: "gentle", greeting: "Hello, world! I'm {recipient}", openLine: "{sender} have some news.", cta: "Meet our baby",
      momentTitle: "Welcome, little one.", momentHint: "Tap to say hello.", momentDone: "Ten fingers, ten toes, all heart.",
      letterTitle: "A note from the parents.", memoriesTitle: "First photos.", endTitle: "Send your blessings.", numbers: null },
    sample: { recipient: "Aarya", sender: "Neha & Siddharth", date: "2026-09-30", weight: "3.1 kg", birth_time: "6:42 AM", message: "Our little Aarya arrived early on a Wednesday morning and hasn't stopped stealing hearts since.\nThank you for all your love and blessings.", memories: [] },
    whatsapp: { reply: "Congratulations {sender}! 🎉 Lots of love to baby!" },
    share: "🍼 Meet our little one!\n{link}",
  }),
  make({
    id: "get-well-soon", name: "Get Well Soon", glyph: "🌻", price: 19,
    tagline: "Something warm for someone who's unwell.",
    description: "A gentle get-well page with your wishes and a sunflower to brighten their day.",
    themes: ten("gentle", "sunny", "minimal", "lilac"),
    labels: { recipient: "Their name", messageSuggestions: ["Rest up and get well soon. We're all thinking of you and can't wait to see you back on your feet."] },
    opts: { opening: "envelope", moment: "bouquet", music: "gentle", greeting: "Get well soon, {recipient}", openLine: "{sender} is thinking of you.", cta: "Open the card",
      momentTitle: "Sunshine, delivered.", momentHint: "Tap the flowers.", momentDone: "Feel better soon. We miss you.",
      letterTitle: "Thinking of you.", memoriesTitle: "Waiting for more of these.", endTitle: "Back on your feet soon.", numbers: null },
    sample: { recipient: "Nani", sender: "Your whole family", message: "Nani, the house is too quiet without your stories.\nRest well, take your medicines on time, and come back home soon.", memories: [] },
    whatsapp: { reply: "Thank you {sender}, feeling better already ❤️" },
    share: "🌻 Get well soon, {recipient}:\n{link}",
  }),
  make({
    id: "sorry", name: "I'm Sorry", glyph: "🥺", price: 19,
    tagline: "When a text isn't enough.",
    description: "Say sorry properly, with a heartfelt note and a question they can answer with a tap.",
    themes: ten("love", "romantic", "minimal", "lilac"),
    labels: { recipient: "Their name", messageSuggestions: ["I was wrong, and I'm sorry. You mean too much to me to let this sit."] },
    opts: { opening: "envelope", moment: "question", music: "gentle", greeting: "{recipient}, I'm sorry", openLine: "{sender} has something to say.", cta: "Please open this",
      momentTitle: "Forgive me?", momentHint: "", momentDone: "Thank you. I'll do better. ❤️",
      letterTitle: "What I should have said.", memoriesTitle: "Us, on better days.", endTitle: "Thank you for hearing me out.", numbers: null },
    sample: { recipient: "Sana", sender: "Rehan", message: "I said things I didn't mean and I'm sorry.\nYou matter more to me than being right. Can we talk tonight?", memories: [] },
    whatsapp: { reply: "Okay okay, forgiven 🙈 {sender}" },
    share: "🥺 {recipient}, please open this:\n{link}",
  }),
  make({
    id: "tribute", name: "In Loving Memory", glyph: "🕯️", price: 49,
    tagline: "A quiet, dignified page to remember someone.",
    description: "A memorial page with their life dates, a tribute, photos and a candle visitors can light.",
    themes: ten("gentle", "solemn", "minimal", "elegant"),
    labels: { recipient: "Their name", sender: "Shared by", extra: [F.text("life_dates", "Life dates", { max: 30, placeholder: "1948 – 2026" })], messageSuggestions: ["Forever in our hearts. Your kindness and laughter live on in all of us."] },
    opts: { opening: "candle", moment: "candle", music: "none", greeting: "In loving memory of {recipient}", openLine: "Shared by {sender}.", cta: "Enter",
      momentTitle: "Light a candle.", momentHint: "Tap to light a candle in their memory.", momentDone: "Your candle is lit. Om Shanti.",
      letterTitle: "Remembering.", memoriesTitle: "A life well lived.", endTitle: "Forever in our hearts.", numbers: null },
    sample: { recipient: "Shri Ramesh Chandra Jain", sender: "The Jain family", life_dates: "1948 – 2026", message: "A teacher to hundreds, a father to four, and a friend to everyone he met.\nHe taught us that kindness is never wasted. We will carry his laughter with us always.", memories: [] },
    whatsapp: { reply: "Deepest condolences to the family. Om Shanti 🙏" },
    share: "🕯️ In loving memory of {recipient}.\n{link}",
  }),
];
