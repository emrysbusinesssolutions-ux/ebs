# Emrys Business Solutions — website

An enterprise-grade marketing site for **Emrys Business Solutions (EBS)** — business systems for companies in Myanmar and worldwide, deployed on-premise and delivered 100% remotely.
Static, hand-written HTML/CSS/JS: **no framework, no build step, no CDN, no trackers, no external requests**.
Everything (fonts, styles, scripts, images) is served from this folder, so it also works offline.

The design goal was client trust: specific facts instead of hype, transparent pricing ranges, an honest
security page (including what EBS is *not* certified for), legal pages, and a working enquiry path.

The demo area now covers eleven business modules as real product UIs, including a visa & immigration case-management workflow. **USD is the base currency**; customers
can switch the display to MMK, THB or CNY. Conversions are indicative and quotes/invoices are issued in USD.
Demo records are sample data only.

---

## Run it

**Recommended — local server**

```bash
cd ebs-website
bash serve.sh          # → http://127.0.0.1:8895/
```

or without the script:

```bash
python3 -m http.server 8895 --bind 127.0.0.1
```

`open index.html` also works (all links are relative), but the local server is closer to production and
lets you test `404.html`.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: product-led hero, value props, solutions, product showcase, **interactive POS demo**, trust center, in-production case, process, industries, pricing, FAQ, CTA |
| `solutions.html` | Six modules in detail — POS (`#pos`), inventory (`#inventory`), CRM (`#crm`), analytics (`#analytics`), web apps (`#web`), automation (`#automation`) |
| `industries.html` | Six sectors (retail, wholesale, F&B, trading, services, visa & immigration) + deployment models |
| `case-studies.html` | The real in-house deployment (Thun Nay Min), no invented clients |
| `demo.html` | **Enterprise demo hub** — eleven module cards: POS, inventory, purchasing, warehouse, CRM, HR, accounting, projects, analytics, e-commerce, visa & immigration |
| `demos/*.html` | Eleven interactive enterprise demos (product UI, sample data, USD base with display-currency switch; noindex) |
| `pricing.html` | Three tiers with indicative ranges, comparison table, add-ons, upgrade policy, FAQ |
| `security.html` | Trust center: on-premise architecture, roles/audit, backups, monitoring, SLA, honest compliance note |
| `about.html` | Company story, founder, principles, timeline |
| `contact.html` | Enquiry form (mailto draft), Telegram/email, remote service area, what happens next |
| `privacy.html`, `terms.html` | Legal drafts matching the site's actual behaviour |
| `404.html` | Not-found page |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO / PWA basics (domain is a placeholder) |

---

## Structure

```text
ebs-website/
├── index.html … terms.html          # 12 site pages at the root (simple relative links)
├── demo.html                       # enterprise demo hub (11 module cards)
├── demos/                          # 11 self-contained enterprise demo apps
├── assets/
│   ├── css/style.css                # marketing design system (tokens, layout, components, responsive, print)
│   ├── css/app.css                  # enterprise demo shell (topbar, sidebar, tables, drawers, charts)
│   ├── js/main.js                   # nav, mobile menu, scroll reveal, mailto form, copy buttons
│   ├── js/currency.js               # USD base + display currency (MMK/THB/CNY)
│   ├── js/app.js                    # demo shell, drawers, exports, charts, currency binding
│   ├── js/home-demo.js              # home page POS demo (USD, currency-aware, sample data)
│   ├── js/demos/                    # per-module demo data and interactions
│   ├── fonts/                       # self-hosted Inter Tight · Instrument Sans · JetBrains Mono (OFL)
│   └── img/                         # circular EBS logo, favicon, Apple touch icon, OG image
├── docs/
│   ├── SITE-SPEC.md                 # build spec: facts, truth rules, class contract, page checklist
│   ├── DEMOS-SPEC.md                # 10-demo architecture, module briefs and data rules
│   ├── CONTENT-CHECKLIST.md         # what the owner must confirm/replace before launch (start here)
│   └── DEPLOY.md                    # local preview, Cloudflare Pages, GitHub Pages, VPS/nginx, caching
├── tools/qa.py                      # dependency-free static QA (links, titles, h1, alt, ids, placeholders)
├── tools/public_server.py           # public-only static server used behind the temporary tunnel
├── docs/DEMOS-SPEC.md               # enterprise demo architecture and module briefs
├── preview/                         # screenshots used during development (not for production upload)
├── serve.sh · _headers             # local server · Cloudflare Pages security/cache headers
└── README.md
```


## Responsive

Tested at **280, 320, 360, 390, 414, 430, 480, 560, 600, 768, 820, 834, 1024, 1180, 1280, 1366, 1440, 1600, 1920 and 2560 px**.
The marketing site uses a 1200px container at laptop size, 1320px above 1600 and 1440px on iMac/ultra-wide. The demo workspace centres its data area on large screens. Illustrative dashboard mocks are hidden below 680px so phones show clean copy instead of a squeezed UI.

---

## Editing

**Content** lives directly in the HTML files, in reading order. The header and footer are duplicated on every
page (no build step) — if you change nav or footer, update all pages. `docs/SITE-SPEC.md` contains the canonical
header/footer blocks to copy.

**Cache-busting:** CSS/JS are referenced with `?v=YYYYMMDD` query strings. After editing CSS or JS, increment the version in every page (`?v=20261021d` → next) so returning visitors get the new file instead of a cached copy.

**Colours / type / spacing** — top of `assets/css/style.css`:

```css
:root{
  --brand:#1e40af; --brand-2:#2563eb;
  --ink:#0f172a; --bg:#ffffff; --bg-2:#f7f8fb; --line:#e2e8f0;
  --container:1200px; --header-h:72px;
}
```

**Demo data** — every number on `demo.html` and the home demo is labelled sample data; never present it as a live client's figures. Prices shown in the demo are illustrative, not a quote.

**Pricing** — public list prices: Basic $99/mo + $150 setup; Standard $199/mo + $350; Premium $299/mo + $700.
24/7 support channel on every tier; support work is a separate service quoted by agreement. Internal platform/service split stays admin-only.

**Facts policy** — every claim must trace to `docs/SITE-SPEC.md` §1. Do not add client logos, testimonials,
certifications, phone numbers, addresses, uptime percentages or team sizes that do not exist. The site
deliberately says it is **not** ISO 27001 / SOC 2 certified and that interfaces are illustrative.

**Domain / email** — primary URL is `https://emrys-ebs.pages.dev`; a custom domain can be attached later in Cloudflare Pages.
Contact email `minkhantpaiii@gmail.com` is live. Before announcing, work through `docs/CONTENT-CHECKLIST.md`; `docs/DEPLOY.md` has the deployment steps.

---

## QA

```bash
python3 tools/qa.py                 # every page: titles, descriptions, canonical/OG, links, anchors, h1, alt, ids
python3 tools/qa.py pricing.html    # one page
```

Expected: every page `[PASS]`, summary `ALL PASS`. Warnings (e.g. long titles) are acceptable; errors are not.

Screenshots (headless Chrome on macOS):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --force-prefers-reduced-motion \
  --user-data-dir=/tmp/chrome-ebs --window-size=1440,7000 --virtual-time-budget=5000 \
  --screenshot=preview/page.png http://127.0.0.1:8895/index.html
```

Chrome headless enforces a minimum window width, so for a true 390 px mobile render use
`tools/mobile-preview.html?p=../index.html` inside a 390 px iframe (used during development).

---

## Accessibility & performance notes

- Semantic landmarks (`header`, `nav`, `main`, `footer`), skip link, one `h1` per page, labelled form fields.
- Visible focus rings, `aria-expanded`/`aria-controls` on the menu, Escape closes it, focus is returned.
- `prefers-reduced-motion` disables reveal/transition motion; content is visible without JS.
- No cookies, no analytics, no third-party requests; self-hosted fonts; no render-blocking external CSS/JS.
- Responsive at 1440 / 1024 / 768 / 390 px; comparison tables scroll horizontally on small screens.

---

## Deploy

There is no build step. Copy the site folder (excluding `preview/` and `tools/`) to any static host.
Cloudflare Pages, GitHub Pages and a VPS/nginx setup are documented with exact steps in `docs/DEPLOY.md`.

Before announcing the site, complete `docs/CONTENT-CHECKLIST.md` — it lists every placeholder, legal review,
domain/email decision and the 404-status check.

---

© Emrys Business Solutions. Interfaces shown on the site are illustrative CSS mock-ups, not live client data.
