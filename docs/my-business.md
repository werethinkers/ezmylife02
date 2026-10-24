# My Business

One tab where an owner runs their whole business. Pages: `/business` (pick your business and set up),
`/business/app` (the app), `/business/print/:billId` (print a bill), `/b/:slug` (the business's own website).

## What one entry does

All of it is plain code in `src/business/engine.ts` (no AI, no network). Each action returns one change that is saved in one go.

| The owner does | What happens by itself |
| --- | --- |
| Takes an order | Customer found by phone or added, order numbered, bill made (GST per the business's mode), advance recorded, stock taken (pieces, or raw materials by recipe), pickup reminder set |
| Marks it ready | A "your order is ready" WhatsApp message is put on the to-do list |
| Delivers it | Money left becomes dues, with reminders on day 3 and 7 (owner can change the days) |
| Gets paid | Put against the oldest unpaid bills; their dues reminders close |
| Cancels | Bill cancelled, stock put back, reminders stopped |
| Makes a counter bill | Bill, payment, stock, dues if part paid |
| Adds an enquiry | Follow-ups on day 2 and 5; "They said yes" turns it into an order with all of the above |
| Books an appointment | Reminder before the time; "Done" makes the bill and records payment |
| Buys stock | Stock added, cost price updated, payable to the supplier kept, low-stock reminder closed |
| Marks attendance | Pay for the month worked out; paying adds a salary expense |
| Adds a licence | Renewal reminder 30 days before it ends |

Reports (`src/business/reports.ts`) read the same records: profit, cash book (cash and bank), dues and payables,
stock value and "can make", GST (composition per quarter with CMP-08 due date, or regular per month by rate,
B2B and HSN, with output minus input tax), best sellers and customers.

## Business types

`src/business/catalog.ts` holds 99 types in 15 sectors and 5 sizes. Each type sets which sections show, the words
used ("Patient", "Appointment", "Job"), the default GST mode and composition rate, and example items (bakery comes
with materials and recipes). Adding a type is one line in `RAW`.

## Where data lives

- Signed in: `biz_workspaces` (one row per business) and `biz_records` (one row per record, `kind` + `data` jsonb).
  Only the owner can read or write their rows. `biz_apply` saves one action atomically.
- Not signed in: this device's localStorage, so anyone can try it straight away. Signing in offers to move it to the account.
- Website: `biz_public_site(slug)` returns only the business name, contact and items shown on the site.
  `biz_site_order` takes orders and enquiries; prices come from the owner's items, names and phones are checked,
  and there are limits per hour. Website orders wait in the app until the owner accepts them.

Migration: `supabase/migrations/20261024120000_my_business.sql`. Apply it to the live database before release.

## Messages

Every message is tap-to-send: it opens WhatsApp on the owner's phone with the text filled in (`src/business/whatsapp.ts`).
It costs nothing and sends from the owner's own number. Unpaid bills carry a UPI QR when the owner adds a UPI ID.

## Credits

Entering and viewing data is free; nothing here charges credits. Paid jobs (automatic sending, reports by email and so on)
would be added later through the existing billing code, after Abhi decides prices.

## Checks

`npm run test:business` runs the engine checks (bill maths, GST quarters, GSTIN, orders, dues, stock, purchases, leads,
website orders, appointments, staff pay).
