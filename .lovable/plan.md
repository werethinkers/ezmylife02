## About page rewrite with founders

### Changes
1. **Copy uploaded photos** to `src/assets/`:
   - `WhatsApp_Image_2026-05-16_at_12.15.54.jpeg` → `src/assets/founder-arinjay.jpg`
   - `WhatsApp_Image_2026-05-16_at_17.41.23.jpeg` → `src/assets/founder-abhijay.jpg`

2. **Rewrite `src/pages/About.tsx`**:
   - Keep hero, stats, contact form, SEOHead, Navbar, SEOFooter.
   - Replace "Our Story" + "Our Values" sections with the new copy split into readable paragraphs.
   - Add a **Founders** section: two-card grid with circular/rounded portraits, name, role, and bio paragraph each.
     - Abhijay Jain — Founder & CEO (VIT Vellore, Daly College Indore; ex-SeaFund, ex-VP Investments)
     - Arinjay Jain — Co-Founder, Marketing & Growth (Tetr College of Business; founder of ThingMonkey)
   - Add "What makes us different" + "Our Vision" closing paragraphs.
   - Use existing design tokens, Card components, Space Grotesk styling, subtle gradient borders on portraits.

### Files
- New: `src/assets/founder-abhijay.jpg`, `src/assets/founder-arinjay.jpg`
- Edited: `src/pages/About.tsx`

No backend, schema, or routing changes.