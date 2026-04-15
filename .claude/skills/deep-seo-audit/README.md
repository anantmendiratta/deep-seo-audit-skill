# Deep SEO Audit Skill

A Claude Code skill that performs expert-level technical SEO audits for any URL — from a 2-minute focused check to a full deep audit with evidence screenshots and a Word document report.

**Created by [Anant Mendiratta](https://github.com/anantmendiratta) and [Claude Code](https://claude.ai/code)**

---

## What It Does

Drop any URL into Claude Code and get a structured, evidence-backed SEO audit tailored to the page type. The skill auto-detects whether a page is a product detail page, blog post, homepage, local business, SaaS page, or SPA — and adjusts every recommendation accordingly.

Every finding is backed by evidence: screenshots of Google SERPs, competitor pages, and indexation checks are all taken at mobile viewport (390×844) since Google uses mobile-first indexing.

---

## Audit Phases

| Phase | What it covers |
|-------|---------------|
| **0 — Scope Check** | Confirms quick check vs. full audit before fetching anything |
| **1 — Page Type Detection** | Classifies page (PDP, PLP, blog, landing page, homepage, local, SaaS, FAQ) and chooses render method (SSR vs. puppeteer for JS-rendered pages) |
| **2 — Crawlability & Indexation** | robots.txt, XML sitemaps (standard, image, news, video, combined), all meta robots directives, canonical tag (HTML + HTTP header), hreflang, rel=alternate, rel=prev/next, redirect chains, Google `site:` SERP verification with screenshot |
| **3 — Technical SEO & Core Web Vitals** | Lighthouse scores (LCP, INP, CLS, FCP, TTFB) for mobile and desktop, HTTPS, mixed content, URL quality, JS rendering assessment, mobile-first indexing checks |
| **4 — On-Page SEO** | Title tag, meta description, Open Graph + Twitter Card tags, heading structure, content depth, images, internal links, video detection, competitor benchmark with SERP + page screenshots |
| **5 — Schema Markup** | Validated via Rich Results Test or validator.schema.org — never raw HTML alone |
| **5b — Video Indexing** | Runs when video is detected: YouTube embed vs. native `<video>` vs. third-party, video sitemap, VideoObject schema (required + optional fields), Googlebot crawlability, rich result eligibility verdict |
| **6 — E-E-A-T & Content Quality** | Experience, Expertise, Authoritativeness, Trustworthiness — applies Google's helpful content (Who/How/Why) framework; YMYL flagging |
| **7 — Page-Type-Specific Checks** | PDP (parent ProductGroup vs. variant Product schema), PLP, blog, landing page, homepage, local business, SaaS |
| **8 — DOCX Report** | Structured JSON → professional Word document via `generate_docx.js` |

---

## Key Features

### Evidence-First Auditing
All indexation and competitor claims are backed by puppeteer screenshots saved to `output/screenshots/`. The skill will not assert a page is indexed or not indexed without a screenshot of the Google SERP result.

### Mobile-First Screenshots
All screenshots use a 390×844 viewport (iPhone 14) with `isMobile: true` — matching Google's mobile-first indexing crawler perspective.

### Open Graph & Social Tag Detection
OG tags and Twitter Card tags are frequently JS-injected and invisible to a plain HTTP fetch. The skill uses puppeteer DOM extraction first, falling back to static HTML grep, and explicitly notes when tags cannot be confirmed without a rendered DOM.

### Complete Meta Robots Audit
All 14 Google-supported directives are checked in one place across all three sources (`<meta name="robots">`, `<meta name="googlebot">`, `X-Robots-Tag` HTTP header):

- Blocking: `noindex`, `nofollow`, `none`
- Content suppression: `nosnippet`, `noimageindex`, `noarchive`
- Preview controls: `max-image-preview` (large/standard/none), `max-snippet:[n]`, `max-video-preview:[n]`
- Other: `notranslate`, `unavailable_after`, `indexifembedded`, `all`

Conflict detection catches cases where a googlebot-specific tag or HTTP header overrides a permissive HTML tag.

### `max-image-preview:large` Check
Missing or non-`large` image preview is flagged by page type severity — High Priority for blog posts and Discover-eligible content, Medium Priority for PDPs and landing pages. The skill also catches the silent `noimageindex` + `max-image-preview:large` conflict where `noimageindex` wins.

### Canonical Tag (Dual-Source)
Checks both `<link rel="canonical">` in HTML and the `Link:` HTTP response header — some frameworks set canonical only in the header. Detects multiple canonicals, chains, www/trailing-slash mismatches, and JS-injected canonicals that Googlebot may not see.

### hreflang, rel=alternate, rel=prev/next
Full international targeting audit: return tag verification, x-default presence, BCP 47 language code validation. Also catches AMP (`rel="amphtml"`), RSS/Atom feeds, legacy m-dot URLs, and notes that Google dropped rel=prev/next support in 2019.

### Comprehensive Sitemap Audit (7 Steps)

All four Google sitemap extension types are checked:

**Standard sitemap** — availability, sitemap index vs. plain, audited page listed, canonical URL consistency, file size limits.

**`<lastmod>` validation** — W3C Datetime format check across all values sampled, bulk-regeneration pattern detection (all dates identical = CMS stamping, not real changes), staleness thresholds by page type.

**Image sitemap** — namespace declaration, `<image:loc>` presence, 1,000-image-per-URL limit, cross-domain image Search Console requirement, deprecated tag detection (`caption`, `geo_location`, `title`, `license`).

**News sitemap** — all required fields (`name`, `language`, `publication_date`, `title`), 2-day freshness rule enforcement (articles older than 2 days must have `<news:news>` stripped), publication name must match news.google.com exactly.

**Video sitemap** — required fields (`thumbnail_loc`, `title`, `description`, `content_loc` or `player_loc`), `content_loc` vs `player_loc` rules, optional fields table, expired `<video:expiration_date>` (Critical), deprecated tags (`category`, `gallery_loc`, `price`, `tvshow`).

**Combined/multi-extension sitemaps** — namespace declaration enforcement (undeclared namespace = silent tag rejection), file size warning when combining extensions.

### Video Indexing (Phase 5b)
Runs automatically when any video is detected on the page:
- Detects YouTube embeds (extracts video ID, checks `title` attribute, privacy-enhanced mode), native `<video>` (src, poster, captions, MIME type), Vimeo, Wistia, lazy-loaded iframes
- Validates VideoObject schema — required: `name`, `description`, `thumbnailUrl`, `uploadDate`; recommended: `duration`, `embedUrl`, `transcript`, `hasPart` (enables Jump To results)
- YouTube-specific: `embedUrl` must be the embed URL, not the watch URL
- Googlebot crawlability: `curl -I` on native video files, `site:youtube.com/watch?v=ID` search for YouTube visibility, `loading="lazy"` iframe flag
- Outputs a clear eligibility table: ✅ Eligible / ⚠️ Partial / ❌ Not eligible

### PDP Schema — ProductGroup vs. Product
The skill classifies product pages before checking schema:
- **Parent/configurable product** → expects `ProductGroup` with `hasVariant[]` and `variesBy` (required for Google's variant selectors in search). Flags `Product` used on a configurable page as Critical.
- **Variant/SKU product** → expects `Product` with `isVariantOf` pointing to the parent ProductGroup. Flags missing `isVariantOf` as Critical.
- Cross-checks that variant page canonicals point to themselves (not the parent), and that `hasVariant[].url` values match actual variant URLs.

### Mobile-First Indexing Checks

Google indexes and ranks the mobile version of every page. The skill compares mobile vs. desktop at puppeteer render time and checks:

- **Site configuration** — responsive (recommended), dynamic serving, or separate mobile URL (m-dot) — different checks apply per type
- **Content parity** — all primary content, headings, prices, and descriptions present on mobile; content hidden behind required user interaction (swipe, tap, type) flagged as Critical since Googlebot won't trigger it
- **Metadata parity** — `<title>`, `<meta description>`, `<meta name="robots">`, and canonical identical across both versions; a `noindex` on mobile while desktop is indexed = Critical
- **Structured data parity** — same schema types on both versions; VideoObject, Product, and BreadcrumbList missing on mobile flagged as High Priority
- **Image checks** — stable image URLs (not dynamically generated), correct resolution for mobile, identical alt text, supported formats
- **Video checks** — supported HTML tags (`<video>`, `<embed>`, `<object>`), no dynamic video URLs, no `loading="lazy"` on primary video content
- **Intrusive interstitials** — full-page overlays, app install pop-ups, and non-compliant ad placements flagged as High Priority
- **m-dot specific** — URL fragment prohibition, 1:1 desktop-to-mobile URL mapping, error page parity, robots.txt parity, canonical + `rel=alternate` structure, hreflang pointing to correct version per locale

Outputs a verdict table with ✅/⚠️/❌ per check.

### Competitor Benchmarking with Screenshots
1. Screenshots the Google SERP at mobile viewport before selecting competitors (proves who was ranking and at what position)
2. Screenshots each competitor page at mobile viewport before fetching it (captures the page as it appeared at audit time)
3. Outputs a comparison table: title, meta description, H1, word count, H2 count, schema types, internal links in body

---

## Usage

Install the skill, then invoke it:

```
/deep-seo-audit
```

**Full audit:**
```
Audit https://example.com/products/my-product
```

**Focused check:**
```
Is my page indexed? https://example.com/blog/my-post
Check the schema on https://example.com/products/widget
Why is https://example.com slow?
```

The skill asks one clarifying question if the goal isn't clear. If you just say `audit [URL]`, it defaults to a full audit.

---

## Output

**Quick checks** — direct answer, evidence, fix recommendation.

**Full audits** — structured Markdown report saved to `output/audit_report.md`:

```
## Critical Issues ⛔      — blocking indexation, rendering, or ranking
## High Priority 🔴        — hurting performance, not blocking
## Medium Priority 🟡      — optimisations for rankings/CTR
## Quick Wins 🟢           — small changes, meaningful impact
## What's Working ✅       — genuine strengths
## Page-Type-Specific Findings
## Schema Summary
## Core Web Vitals
## Next Steps (top 5–7, in priority order)
```

Plus a Word document at `output/audit_report.docx` (requires `npm install` — see Requirements).

Screenshots are saved to `output/screenshots/`:
- `google_site_search_mobile.png` — `site:` SERP evidence
- `google_page_indexed_mobile.png` — page-specific indexation
- `serp_[keyword]_mobile.png` — competitor SERP
- `competitor_1_mobile.png`, `competitor_2_mobile.png` — competitor pages

---

## Repository Structure

```
deep-seo-audit-skill/
├── SKILL.md                          # Skill definition and full audit instructions
├── package.json                      # npm dependency (docx) for report generation
├── scripts/
│   ├── lighthouse_audit.sh           # Lighthouse CLI runner for CWV
│   └── generate_docx.js              # Converts audit JSON → Word document
├── references/
│   ├── page-type-signals.md          # URL patterns and schema by page type
│   ├── cwv-thresholds.md             # CWV thresholds and scoring
│   ├── eeat-checklist.md             # E-E-A-T + YMYL checklist
│   └── google-helpful-content.md     # Google's helpful content guidelines
└── assets/
    └── report-template.md            # Audit report output template
```

---

## Requirements

- [Claude Code](https://claude.ai/code)
- **Playwright MCP** — required for JS-rendered pages, OG tag extraction, and all screenshots. The old `@modelcontextprotocol/server-puppeteer` is deprecated and archived; use Microsoft's official replacement:
  ```
  claude mcp add playwright npx @playwright/mcp@latest
  ```
- **Lighthouse CLI** — optional, for real CWV lab scores (falls back to PageSpeed Insights):
  ```
  npm install -g lighthouse
  ```
- **docx** — optional, for Word document report generation (Phase 8):
  ```
  npm install
  ```

---

## Eval Results

Tested across 5 eval types against a no-skill baseline:

| Eval | With Skill | Baseline | Delta |
|------|:----------:|:--------:|:-----:|
| Quick Check | 100% | 83% | +17% |
| Local Business | 100% | 71% | +29% |
| Blog Post | 87.5% | 75% | +12.5% |
| Product Page (PDP) | 89% | 67% | +22% |
| React SPA | 87.5% | 75% | +12.5% |
| **Average** | **92.8%** | **74.2%** | **+18.6%** |

---

*Built with [Claude Code](https://claude.ai/code)*
