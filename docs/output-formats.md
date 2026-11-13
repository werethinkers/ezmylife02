# Text or PDF: how apps hand over results

Every app that makes words or numbers asks **"How do you want your result?"** next to its run button:
text on screen, PDF document, Word file or WhatsApp message. All formats are made at the same
time from the one result (no extra AI call, same price), so the person can switch after. The
choice only decides what opens first. It is remembered per app on that device.

## Where it lives (`src/apps/output/`)

| File | What |
| --- | --- |
| `choice.ts` | Formats each app offers (`formatsFor`), its PDF template (`templateFor`), the remembered choice (`useOutputChoice`) |
| `OutputChoice.tsx` | The question, placed in DocApp, VisionApp and the studio engines (Plan, Analyse, Interview, Coach) |
| `markdown.ts` | AI Markdown → PDF blocks (headings, paragraphs, lists, tick lists, tables, quotes) |
| `buildDoc.ts` | A result as a PDF document: `docFromText` (AI text), `docFromCalc` (calculators), `docFromRows` (trackers); letterhead from the saved business profile |
| `render.ts` | The templates' styles, page layout (tables split between rows with the header repeated, headings kept with what follows) and the PDF maker |
| `usePreparedPdf.ts` | Makes the PDF in the background as soon as a result appears (and again after edits), so Download is instant |
| `PdfView.tsx`, `save.ts` | The "PDF pages" preview in the result box; Download, and Send on phones (share sheet; in the iPhone app the share sheet is used to save) |

The result box (`src/apps/shell/OutputPanel.tsx`) shows a Text / PDF pages switch and a PDF button
for every result. Calculators get a PDF button beside Copy; trackers a "PDF register" button.

## Templates

| Template | Used by | Look |
| --- | --- | --- |
| Letter | Letters, notices, agreements, quotations, invoices, slips (words in the app's id or file name) | Business letterhead, date, title |
| Report | Studios (plan, pack, analyse, interview, coach) | Cover page, then sections |
| Document | Other writing apps | Title bar with app tag |
| Statement | Calculators | "You entered" box, answer tiles, split bar, full table, AI note |
| Register | Trackers | Landscape table with totals and sign-off lines |
| Plan | Planner-style apps and plan studios | Title bar, sections |

PDFs are drawn by the browser from HTML (html2canvas + jsPDF, both already used by Virasat), so
Hindi and other Indian scripts come out correctly. Pages are pictures, so text in the PDF can't be
selected; Word and Text cover copying.

## Next

- Photo sheet PDF for ID, passport and exam photo apps.
- Startup Analyser and Virasat restyled to the same look.
- Public API: `format: "pdf"` on `POST /apps/{id}/run` returning a link to a page that shows the
  result with Download PDF, so the keyboard and Siri can insert a PDF link (needs a saved-results table).
