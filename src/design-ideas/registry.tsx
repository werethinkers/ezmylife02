import type { ComponentType } from "react";
import BazaarHome, { BazaarBoard, BazaarHero, BazaarLane, BazaarThali } from "./BazaarHome";
import { BazaarHeader } from "./components/BazaarChrome";
import TruckHome from "./TruckHome";
import LedgerHome from "./LedgerHome";
import TalkiesHome from "./TalkiesHome";
import MeriDukaan from "./MeriDukaan";
import KyaHua from "./KyaHua";
import VendingMachine from "./VendingMachine";
import { HeroLines, InstagramPosts, LoadingLines, NotFoundJoke, PriceTags, PushNotes, RefundLine, RoastMachine } from "./campaigns/pages";

/*
 * The design ideas, listed on /admin/design-ideas. Each one opens on its own at
 * /admin/design-ideas/<id>, as a full page, so it can be judged without the rest of the site around it.
 * To add one: build it from parts in src/design-ideas/components, then add a line here.
 */
export type Idea = { id: string; title: string; line: string; tag: string; Page: ComponentType; group?: "campaign" };

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <BazaarHeader />
    <div className="pt-8">{children}</div>
  </div>
);

export const IDEAS: Idea[] = [
  { id: "bazaar", title: "Bazaar home page", line: "The whole home page: shopkeeper search, the lane of shops, thalis, the all apps board and the free-credits gate.", tag: "Home page", Page: BazaarHome },
  { id: "truck", title: "Truck home page", line: "Road-art look: garland, painted panels and a rhyming line for every shop.", tag: "Home page", Page: TruckHome },
  { id: "ledger", title: "Bahi-Khata home page", line: "The trader's red ledger: every app is an entry with its price on the right.", tag: "Home page", Page: LedgerHome },
  { id: "talkies", title: "Talkies home page", line: "A cinema hoarding: latest releases up top, then one poster rail per shop.", tag: "Home page", Page: TalkiesHome },
  { id: "meri-dukaan", title: "Meri Dukaan", line: "Your home page is your own shop. Every app you use adds a part to it: counter, signboard, photos.", tag: "Home page", Page: MeriDukaan },
  { id: "kya-hua", title: "Kya hua aaj?", line: "Start from what went wrong, in a shop owner's own words. Tap a trouble and get a plan with the right app.", tag: "Home page", Page: KyaHua },
  { id: "vending", title: "The Vending Machine", line: "Apps sit in coils with a code and a price. Press a slot and the app drops into the tray.", tag: "Home page", Page: VendingMachine },
  { id: "bazaar-lane", title: "The lane of shops", line: "Six striped-awning shops. Tap one to step inside and see its apps as price tags.", tag: "Part", Page: () => <Frame><BazaarLane /></Frame> },
  { id: "shopkeeper", title: "Shopkeeper search", line: "The greeting and search box that sit at the top of the home page.", tag: "Part", Page: () => <Frame><BazaarHero /></Frame> },
  { id: "thali", title: "Thali bundles", line: "A steel plate with one katori per app. Pick a thali to see the set for one job.", tag: "Part", Page: () => <Frame><BazaarThali /></Frame> },
  { id: "board", title: "All apps board", line: "A station departures board: every app is one row with its shop, how it opens and its price.", tag: "Part", Page: () => <Frame><BazaarBoard /></Frame> },
  { id: "roast", title: "Roast My Dukaan", line: "Pick your kind of shop. It roasts the usual mess in Hinglish, then points to the app that fixes it.", tag: "Campaign", group: "campaign", Page: RoastMachine },
  { id: "honest-line", title: "The honest home page line", line: "Three stand-up style lines for the top of the home page.", tag: "Campaign", group: "campaign", Page: HeroLines },
  { id: "loading-lines", title: "Loading lines", line: "Jokes that run while an app is working.", tag: "Campaign", group: "campaign", Page: LoadingLines },
  { id: "not-found", title: "The 404 page", line: "A missing page that makes the visitor smile and sends them home.", tag: "Campaign", group: "campaign", Page: NotFoundJoke },
  { id: "price-tags", title: "Price tags in plain words", line: "Real app prices with a plain-words line next to them.", tag: "Campaign", group: "campaign", Page: PriceTags },
  { id: "refund-line", title: "The refund line", line: "A friendly line for the support page. The real rule still has to be added.", tag: "Campaign", group: "campaign", Page: RefundLine },
  { id: "push-notes", title: "Push notifications", line: "Three short phone notifications, one a day at most, opt-in only.", tag: "Campaign", group: "campaign", Page: PushNotes },
  { id: "insta-posts", title: "Instagram posts", line: "Square posts with a caption, hashtags and a sound to look for. Posts only, no reels.", tag: "Campaign", group: "campaign", Page: InstagramPosts },
];

export const ideaById = (id?: string) => IDEAS.find((i) => i.id === id);
