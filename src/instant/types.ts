// Instant Digital Products Engine: shared types.
// A Product is a self-describing definition (fields, steps, design variants, WhatsApp copy).
// Each product is drawn by its family's renderer, configured by the product's `opts`.

export type Family = "celebration" | "festival" | "event" | "business" | "menu" | "profile";

export type CategoryId = "celebrations" | "festivals" | "events" | "business" | "menus" | "profiles";

export type FieldType =
  | "text" | "textarea" | "phone" | "email" | "url" | "date" | "time" | "number"
  | "select" | "chips" | "days" | "photo" | "gallery" | "list" | "toggle";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  max?: number;               // max length, max items, or max photos
  options?: string[];         // select / chips
  suggestions?: string[];     // tap-to-use text suggestions
  item?: Field[];             // list item fields
  itemLabel?: string;         // "plan", "dish", "event"
}

export interface Step {
  title: string;
  hint?: string;
  fields: Field[];
}

/** Layout personality a renderer gives a design: same content, a different arrangement. */
export type Style = "bold" | "photo" | "split" | "editorial" | "soft" | "minimal";

export interface Theme {
  id: string;
  name: string;
  dark: boolean;
  s: Style;
  c: { bg: string; sf: string; tx: string; mu: string; ac: string; ac2: string; ac3: string; on: string; line: string };
  f: { d: string; b: string; h: string };   // display, body, handwriting stacks
  fonts: string[];                         // Google Fonts family specs
}

// Page content is user-shaped JSON whose fields differ per product.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Loose = any;
export type Content = Record<string, Loose>;

export interface Product {
  id: string;
  family: Family;
  category: CategoryId;
  name: string;
  tagline: string;
  description: string;
  glyph: string;        // short visual mark for gallery cards
  price: number;        // display default; the server price in ip_products is the source of truth
  seasonal?: string;
  popular?: boolean;
  steps: Step[];
  themes: Theme[];
  sample: Content;
  titleField: string;   // content field used for the page title and slug
  whatsapp: Record<string, string>;   // message templates with {placeholders}
  share: string;                      // creator's share message, must include {link}
  opts: Record<string, Loose>;          // family-specific behaviour switches
  indexable: boolean;                 // business pages are searchable; personal pages are not
}

export interface RenderProps {
  product: Product;
  theme: Theme;
  content: Content;
  mode: "live" | "preview";
  slug?: string;
  pageUrl: string;
}
