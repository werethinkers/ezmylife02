# WhatsApp link previews for cards and websites

## Where things stand
The feature is already built. When a card or website is published, the app draws its own preview picture (its photo or a 1200x630 card), takes its own title and line of text, and can write a small "share page" that WhatsApp reads. Owners can even pick the picture, title and text in the link preview editor.

It is switched off because three setup pieces are missing:
- The secret `GITHUB_SHARE_TOKEN` is not saved (checked: not in the secrets list).
- The share site `share.ezyourlife.com` does not answer yet (checked: no response).
- So every link falls back to the plain `ezyourlife.com/p/...` link, which WhatsApp shows with the site-wide picture.

## What you do (one time, about 10 minutes)
1. On GitHub (werethinkers account) create an empty public repo `ezyourlife-share`.
2. In that repo: Settings → Pages → deploy from branch `main`, folder `/`; custom domain `share.ezyourlife.com`, tick "Enforce HTTPS" once offered.
3. At your domain provider add a DNS record: `CNAME share → werethinkers.github.io`.
4. Create a fine-grained GitHub token with access only to that repo, permission "Contents: read and write".

## What I do
1. Open the secure form so you can save that token as `GITHUB_SHARE_TOKEN`.
2. Redeploy the checkout function (`ip-checkout`) so it picks the token up. No code changes.
3. Publish a test birthday card, open the share link, and confirm the page carries its own picture, title and text, and that it forwards to the real card.
4. Run the existing "make share links for old pages" step so pages already published also get their own preview.

## Result
Sending a card or website on WhatsApp shows a big preview like your screenshot: the card's own picture, its title (e.g. "Happy Birthday Riya"), one line of text, and the link.

## Notes
- WhatsApp remembers a link's preview the first time it sees it; the app already waits until the share link is live before handing it out.
- Nothing about payments, prices or credits is touched.
