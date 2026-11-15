import type { ComponentType } from "react";
import BazaarHome, { BazaarBoard, BazaarHero, BazaarLane, BazaarThali } from "./BazaarHome";
import { BazaarHeader } from "./components/BazaarChrome";
import TruckHome from "./TruckHome";
import LedgerHome from "./LedgerHome";
import TalkiesHome from "./TalkiesHome";

/*
 * The design ideas, listed on /admin/design-ideas. Each one opens on its own at
 * /admin/design-ideas/<id>, as a full page, so it can be judged without the rest of the site around it.
 * To add one: build it from parts in src/design-ideas/components, then add a line here.
 */
export type Idea = { id: string; title: string; line: string; tag: string; Page: ComponentType };

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
  { id: "bazaar-lane", title: "The lane of shops", line: "Six striped-awning shops. Tap one to step inside and see its apps as price tags.", tag: "Part", Page: () => <Frame><BazaarLane /></Frame> },
  { id: "shopkeeper", title: "Shopkeeper search", line: "The greeting and search box that sit at the top of the home page.", tag: "Part", Page: () => <Frame><BazaarHero /></Frame> },
  { id: "thali", title: "Thali bundles", line: "A steel plate with one katori per app. Pick a thali to see the set for one job.", tag: "Part", Page: () => <Frame><BazaarThali /></Frame> },
  { id: "board", title: "All apps board", line: "A station departures board: every app is one row with its shop, how it opens and its price.", tag: "Part", Page: () => <Frame><BazaarBoard /></Frame> },
];

export const ideaById = (id?: string) => IDEAS.find((i) => i.id === id);
