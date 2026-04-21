---
name: deep-seo-audit
description: Expert-level technical SEO audit for any URL. Use this skill whenever the user wants to audit, analyze, review, or check the SEO of a website, page, or URL — even if they just say "check my site", "why isn't my page ranking", "quick SEO check", or "look at my title tags". Covers crawlability, indexation, Core Web Vitals (via Lighthouse), on-page SEO, schema markup, content quality, and E-E-A-T. Automatically detects page type (product listing, product detail, landing page, blog post, homepage, etc.) and tailors the audit accordingly. Also use for focused single-element checks like "is my schema correct?" or "check my page speed".
allowed-tools: mcp__playwright, WebSearch, WebFetch, Bash(lighthouse *), Bash(curl *), Bash(python3 *), Bash(node *), Bash(npm *), Read, Write
---

# Deep SEO Audit Skill

Performs technical SEO audits for any URL — from a 2-minute focused check to a full 7-phase deep audit. Adapts to page type and user goal.

## Runtime Requirement

This skill depends on **Playwright MCP** for rendered DOM access, screenshots, schema extraction, OG tag confirmation, and mobile-first evidence capture. Importing this skill does **not** install Playwright MCP automatically.

If Playwright MCP is unavailable, say so clearly before continuing and limit the audit to static-fetch checks where possible. Do not imply that rendered checks, screenshots, or JS-dependent schema/OG findings were verified when Playwright tools are unavailable.

Recommended install command:
```bash
claude mcp add playwright npx @playwright/mcp@latest -- --sandbox
```

## Bundled References
Load as needed:
- `references/page-type-signals.md` — URL patterns, content signals, expected schema by page type. Read during Phase 1 if page type is ambiguous.
- `references/cwv-thresholds.md` — Core Web Vitals thresholds, causes, reporting format. Read during Phase 3.
- `references/eeat-checklist.md` — Full E-E-A-T + YMYL checklist. Read during Phase 6.
- `references/google-helpful-content.md` — Google's official helpful content guidelines (Who/How/Why framework, people-first checklist, search-engine-first warning signs). Read during Phase 6 alongside the E-E-A-T checklist.
- `assets/report-template.md` — Output report template for full audits.
- `scripts/lighthouse_audit.sh` — Runs Lighthouse CLI for CWV. Use in Phase 3.
- `scripts/generate_docx.js` — Converts structured audit JSON to professional .docx report. Uses [docx-js](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md). Run in Phase 8.

---

## Phase 0: Scope Check (Always Run First)

Before fetching anything, ask one question — unless the user's message already makes it obvious:

> "What's the goal of this audit — a quick check on something specific, or a full technical audit?"

**Quick check examples** (user mentions one thing — just do that thing, skip the rest):
- "Is my schema correct?" → Phase 5 only
- "Why is my page slow?" → Phase 3 only (run Lighthouse)
- "Check my title and meta description" → Phase 4 title/meta only
- "Is my page indexed?" → Phase 2 indexation only
- "Audit my competitor's page" → Full audit but note competitive framing

**Full audit** — run all phases in order when:
- User says "full audit", "complete audit", "deep dive", or "why isn't it ranking"
- No specific concern mentioned alongside the URL
- The user's goal is clearly holistic (pre-launch check, site migration, etc.)

Also ask (only if not obvious from context):
- Do they have Google Search Console access? (improves depth of Phase 2)
- Is there a specific competitor URL to benchmark against?

If the user just says "audit [URL]" with no other context, default to **full audit** and proceed.

---

## Phase 1: Page Type Detection

Fetch the URL and classify the page type. This determines which checks to run and what schema to expect.

**Primary fetch — try in this order:**

1. `WebFetch [URL]` — fastest, works for SSR pages
2. If WebFetch returns mostly CSS or near-empty content (JS-rendered page):
   - Try: `curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" [URL]`
   - If still empty and Playwright MCP is available, use `browser_navigate` + `browser_evaluate` to render the page with JavaScript and extract the full DOM
   - If still empty and Playwright MCP is unavailable, stop and report that the rendered audit could not be completed because Playwright MCP is not installed. Tell the user to run:
     ```bash
     claude mcp add playwright npx @playwright/mcp@latest -- --sandbox
     ```
3. If the site is offline or returns connection errors, report this immediately as a Critical Issue and skip to a recommendations-only audit

Detect page type from URL structure, title, headings, and content patterns. Read `references/page-type-signals.md` if ambiguous.

| Page Type | Key Signals |
|-----------|-------------|
| Homepage | Root domain, brand name prominent, nav hub |
| Product Detail Page (PDP) | `/products/`, price, add-to-cart, product images |
| Product Listing Page (PLP) | `/category/`, `/collection/`, product grid |
| Blog Post / Article | `/blog/`, `/post/`, date, author byline |
| Landing Page | Minimal nav, single CTA, campaign-specific copy |
| Service Page | Service description, contact/quote CTA |
| Local Business | Address, phone, hours, map embed |
| SaaS Feature Page | Feature description, pricing CTA, testimonials |
| FAQ / Support | Q&A format, `/help/`, `/faq/` |

**State the page type and rendering method at the top of every report.**

Before proceeding to Phase 2, create the output directories so screenshots never fail with `ENOENT`:

```bash
Bash: mkdir -p output/screenshots
```

---

## Phase 2: Crawlability & Indexation

### Robots.txt
```
WebFetch [domain]/robots.txt
```
Check: important paths blocked? Sitemap reference present? Conflicting rules?

### XML Sitemap

```
WebFetch [domain]/sitemap.xml
```

Apply Steps 1–3 to every sitemap fetched. Then run the type-specific checks in Steps 4–7 based on which sitemap extensions are present.

---

**Step 1: Discovery and availability**
- Referenced in `robots.txt` via `Sitemap:` directive? If not, Google must discover it independently — flag as Medium Priority.
- Common fallback paths to try if not in robots.txt: `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap.xml.gz`
- Returns 200? (404 or 500 = Critical)
- Is it a sitemap index (`<sitemapindex>` with `<sitemap>` children) or a plain sitemap (`<urlset>` with `<url>` entries)?
- If sitemap index: list all child sitemaps. Fetch the child covering the audited page at minimum. Note whether child sitemaps are split by type (blog, products, images, video, news) — good practice.
- Does the audited page URL appear in any sitemap? If not, flag as **High Priority**.
- Do all `<loc>` URLs use canonical form — correct protocol, www preference, consistent trailing slash?
- File size: standard sitemaps must not exceed 50MB uncompressed or 50,000 URLs. Flag if approaching limits.

---

**Step 2: `<lastmod>` format validation**

`<lastmod>` must follow the W3C Datetime format (ISO 8601 subset). Sample 5–10 values and check the format used:

| Format | Example | Valid? |
|--------|---------|--------|
| `YYYY-MM-DDThh:mm:ss+TZ` | `2024-03-15T09:30:00+00:00` | ✅ Preferred |
| `YYYY-MM-DDThh:mm:ssZ` | `2024-03-15T09:30:00Z` | ✅ Preferred |
| `YYYY-MM-DD` | `2024-03-15` | ✅ Acceptable |
| `YYYY-MM` | `2024-03` | ⚠️ Imprecise |
| `YYYY` | `2024` | ⚠️ Too imprecise |
| Anything else | `03/15/2024`, `March 2024` | ❌ Invalid — Google ignores |

Flag as **Medium Priority** if any non-W3C format is found.

---

**Step 3: `<lastmod>` staleness check**

*Pattern A — All dates identical:* CMS is stamping on regeneration, not real changes. Flag as **Medium Priority** — Google learns to distrust this site's `<lastmod>` signals.

*Pattern B — Age-based staleness* (compare against today `2026-04-15`):

| Page type | Stale threshold | Severity |
|-----------|----------------|----------|
| Homepage | > 30 days | 🟡 Medium |
| Blog / Article | > 90 days since last visible update | 🟡 Medium |
| PDP | > 60 days | 🔴 High |
| PLP / Category | > 60 days | 🟡 Medium |
| Static pages | > 365 days | Informational |

- Future `<lastmod>`: flag **High Priority** — signals broken date handling; Google may ignore all `<lastmod>` from this domain.
- Absent `<lastmod>`: note — Google cannot use freshness signals for crawl scheduling.

---

**Step 4: Image Sitemap**

Namespace: `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`

Detect: look for `<image:image>` entries in any sitemap (can be standalone or embedded in the main sitemap).

**Required tag:**

| Tag | Rule |
|-----|------|
| `<image:loc>` | Absolute URL of the image — must be present for every `<image:image>` |

**Constraints to check:**
- Maximum **1,000 `<image:image>` entries per `<url>`** — flag if exceeded
- Images on a different domain: both domains must be verified in Google Search Console — note if cross-domain images are present
- Image URLs must not be blocked by `robots.txt` — cross-check against `robots.txt` rules
- **Deprecated tags** — flag if any of these are still in use (Google ignores them): `<image:caption>`, `<image:geo_location>`, `<image:title>`, `<image:license>`

**Absence check:** If the page has significant image content (PDP, blog with hero images, gallery) but no image sitemap entries exist, flag as **Medium Priority** — Google may miss images that aren't in body HTML or are lazy-loaded.

---

**Step 5: News Sitemap**

Namespace: `xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"`

Only relevant if the site is a news publisher. Detect: look for `<news:news>` entries or a dedicated news sitemap referenced in the sitemap index.

**Required tags — all must be present for every article entry:**

| Tag | Rule |
|-----|------|
| `<news:publication>` | Parent container; exactly one per `<news:news>` |
| `<news:name>` | Publication name — must match the name on news.google.com exactly |
| `<news:language>` | ISO 639 language code (2–3 letters); use `zh-cn` / `zh-tw` for Chinese variants |
| `<news:publication_date>` | Original publish timestamp — W3C Datetime format (see Step 2 table) |
| `<news:title>` | Article headline — exclude author name, publication name, and date from this field |

**Critical constraint — 2-day freshness rule:**
- News sitemaps must **only contain articles published within the last 2 days**
- Articles older than 2 days must have their `<news:news>` block removed (the `<url>` entry can remain in the main sitemap — only strip the news extension tags)
- If the news sitemap contains articles older than 2 days, flag as **High Priority** — Google News may distrust the sitemap

**Additional checks:**
- Maximum **1,000 `<news:news>` entries per sitemap file** — use a sitemap index for larger volumes
- `<news:publication_date>` must be the **original** publish date, not the last-modified date — check if dates suspiciously match `<lastmod>`
- Is the news sitemap submitted in Google Search Console under the News property?

---

**Step 6: Video Sitemap**

Namespace: `xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"`

Detect: look for `<video:video>` entries or a dedicated video sitemap. Cross-reference with Phase 5b video findings.

**Required tags — flag as Critical if any are missing:**

| Tag | Rule |
|-----|------|
| `<video:thumbnail_loc>` | Absolute URL to thumbnail image — must be crawlable by Googlebot |
| `<video:title>` | Video title — HTML entities must be escaped or wrapped in CDATA |
| `<video:description>` | Max 2,048 characters — escape HTML entities or use CDATA |
| `<video:content_loc>` OR `<video:player_loc>` | At least one required — `content_loc` preferred for self-hosted; `player_loc` for YouTube/Vimeo embeds |

**`<video:content_loc>` rules:**
- Must be a direct video file URL (not an HTML page or Flash)
- Cannot be the same URL as the parent `<loc>`
- Must be accessible to Googlebot (no auth, not blocked by robots.txt)
- HTTP/FTP protocols only — no streaming-only protocols

**`<video:player_loc>` rules:**
- Use the embed URL (e.g. `https://www.youtube.com/embed/[ID]`) — not the watch URL
- Cannot match the parent `<loc>` URL

**Optional tags to check and report:**

| Tag | Valid values / notes |
|-----|---------------------|
| `<video:duration>` | Integer seconds, 1–28800 (max 8 hours) |
| `<video:expiration_date>` | W3C Datetime — **if set and date has passed, flag as Critical** (Google de-indexes expired videos) |
| `<video:publication_date>` | W3C Datetime |
| `<video:rating>` | Float 0.0–5.0 |
| `<video:view_count>` | Integer |
| `<video:family_friendly>` | `yes` or `no` |
| `<video:requires_subscription>` | `yes` or `no` |
| `<video:restriction>` | ISO 3166 country codes; `relationship` attribute must be `allow` or `deny` |
| `<video:platform>` | `web`, `mobile`, `tv`; `relationship` attribute required |
| `<video:live>` | `yes` or `no` |
| `<video:tag>` | Max 32 tags per video |
| `<video:uploader>` | Max 255 characters |

**Deprecated tags — flag if present (Google ignores them):** `<video:category>`, `<video:gallery_loc>`, `<video:price>`, `<video:tvshow>`

Apply `<lastmod>` format and staleness checks from Steps 2–3 to video sitemap entries. Expired `<video:expiration_date>` = Critical.

---

**Step 7: Combined / Multi-Extension Sitemaps**

A single sitemap file can combine standard `<url>` entries with image, video, and/or news extensions simultaneously. If the audited site uses this pattern, check:

**Namespace declarations** — all used extensions must be declared in the `<urlset>` opening tag:
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
```
Flag as **Critical** if an extension's tags are used but its namespace is not declared — Google will reject the tags silently.

**Structure rules:**
- All extension tags (`<image:image>`, `<video:video>`, `<news:news>`) must be nested inside the `<url>` block, after `<loc>`
- Order of extension blocks within `<url>` does not matter
- Each extension's own required fields still apply (see Steps 4–6 above)

**File size warning:** combining extensions significantly increases sitemap file size. Flag if the combined sitemap approaches 50MB or 50,000 URLs — recommend splitting into a sitemap index with type-specific child sitemaps.

### Indexation Signals (from page HTML)

⚠️ All `<link>` and `<meta>` tags in this section live in `<head>`. They are **frequently JS-injected** and invisible to `WebFetch`. If the page is JS-rendered, extract this entire section via playwright (`browser_navigate` + `browser_evaluate`) — do not guess or omit.

#### Meta Robots (complete directive audit)

**Collection — gather from all three sources before analysing:**
1. `<meta name="robots" content="...">` — applies to all crawlers
2. `<meta name="googlebot" content="...">` — Google web search override
3. `<meta name="googlebot-news" content="...">` — Google News override
4. HTTP `X-Robots-Tag` response header — run `curl -I [URL]` and inspect

Report the exact `content` value from each source found. If a directive appears in both an HTML tag and the HTTP header, **the more restrictive rule always wins** — flag any conflict explicitly.

> ⚠️ A page blocked by `robots.txt` will never have its meta robots directives evaluated by Google — if robots.txt blocks the page, skip this analysis and report that as Critical instead.

**Full directive reference — check every directive present against this table:**

| Directive | What it does | Flag if present unexpectedly? | Severity |
|-----------|-------------|-------------------------------|----------|
| `all` | Default; no restrictions (same as omitting the tag) | No | — |
| `index` | Explicitly allows indexing (redundant; same as default) | No | — |
| `follow` | Explicitly allows link following (redundant; same as default) | No | — |
| `noindex` | Page excluded from search results entirely | Yes | ⛔ Critical |
| `nofollow` | Links on page not followed; link equity not passed | Yes | 🔴 High |
| `none` | Shorthand for `noindex, nofollow` | Yes | ⛔ Critical |
| `nosnippet` | No text snippet or video preview shown in results | Yes | 🔴 High — harms CTR |
| `indexifembedded` | Allows indexing of content embedded via iframe despite `noindex` on the host page | Informational | — |
| `max-snippet:[n]` | Limits text snippet to n characters | Yes if n is very low (e.g. `max-snippet:0`) | 🟡 Medium |
| `max-image-preview:[setting]` | Controls image preview size in Search and Discover | See dedicated block below | — |
| `max-video-preview:[n]` | Limits video preview to n seconds; `-1` = no limit | Yes if `0` | 🟡 Medium |
| `notranslate` | Google will not offer a translated version of the page | Yes | 🟡 Medium |
| `noimageindex` | All images on the page excluded from Google Images | Yes | 🔴 High |
| `unavailable_after:[date]` | Page removed from results after the given date | Yes — check if date has passed | ⛔ Critical if expired |

**`max-image-preview` — always check, absence is a silent CTR loss:**

| Value set | Effect | Flag as |
|-----------|--------|---------|
| `max-image-preview:large` | Full-size previews in Search and Discover | ✅ Correct |
| `max-image-preview:standard` | Small thumbnails only; Discover visibility limited | 🟡 Medium Priority |
| `max-image-preview:none` | No image previews at all | 🔴 High Priority |
| *(directive absent)* | Google defaults to `standard` behaviour | 🟡 Medium Priority |

Priority by page type:
- **Blog posts, articles, Discover-eligible content** — missing or non-`large`: **High Priority** (Discover traffic depends on large image previews)
- **PDPs, landing pages, homepages** — missing or non-`large`: **Medium Priority**
- **PDP + `noimageindex` together**: **Critical** — products invisible in Google Images and Shopping surfaces

**Conflict detection — check all combinations:**
- `<meta name="googlebot">` overrides `<meta name="robots">` for Google — if they contradict, the googlebot tag wins
- `X-Robots-Tag` HTTP header overrides HTML meta tags — if they contradict, the header wins
- `noimageindex` + `max-image-preview:large` simultaneously set — `noimageindex` wins silently; flag this as a conflict
- `nosnippet` + `max-snippet:[n]` simultaneously set — `nosnippet` wins; flag redundancy
- `unavailable_after` date already past — flag as Critical, page will be/has been de-indexed

#### Canonical Tag
- Look for: `<link rel="canonical" href="...">`  — there must be **exactly one** in `<head>`.
- Also check the HTTP `Link: <url>; rel="canonical"` response header — some frameworks set canonical here instead of in HTML. Run `curl -I [URL]` and inspect the `Link:` header.
- Quote the exact canonical `href` value found.
- Check all of:
  - **Self-referencing?** Canonical URL matches the current page URL exactly (including protocol, www/non-www, trailing slash).
  - **Correct protocol?** Must be `https://`, not `http://`.
  - **www consistency?** Canonical must match the site's preferred domain (www vs. non-www).
  - **Trailing slash consistency?** `/page/` vs `/page` — must match the preferred form sitewide.
  - **No canonical chain?** The canonical target must not itself have a different canonical (chain = Google ignores both).
  - **Multiple canonicals?** If more than one `<link rel="canonical">` is found, that is a Critical Issue — Google will ignore all of them.
  - **Injected vs. static?** If found in rendered DOM but not raw HTML, note: "Canonical is JS-injected — Googlebot may see a different value during crawl."

#### hreflang Tags (International Targeting)
- Look for: `<link rel="alternate" hreflang="[lang-region]" href="[url]">` in `<head>`
- Also check: HTTP `Link` header and XML sitemap for hreflang entries (some sites declare them there instead).
- If hreflang tags are present, check all of:
  - **Return tags:** Every URL declared in hreflang must have a reciprocal hreflang pointing back to this page — missing return tags cause Google to ignore the entire set.
  - **x-default present?** There should be a `hreflang="x-default"` pointing to the fallback/global page.
  - **Valid language codes?** Must use BCP 47 format (e.g. `en`, `en-US`, `fr-FR`) — not `english`, `fr_FR`, or ISO 639-2 codes.
  - **Canonical consistency?** The hreflang URL for this locale must match the canonical URL of this page exactly.
  - **Self-reference?** This page's own locale tag must be present in the set.
- If no hreflang tags are found: note "No hreflang tags detected" — only flag as an issue if the site appears to target multiple languages/regions (check nav for language switcher, alternate-language content, or multi-country domain structure).

#### rel="alternate" Tags (Non-hreflang)
- Look for: `<link rel="alternate" type="..." href="...">` where `type` is not an hreflang
- Common forms to check:
  - `type="application/rss+xml"` — RSS feed linked? (positive signal for blog/news)
  - `type="application/atom+xml"` — Atom feed
  - `type="application/json"` — JSON feed
  - `media="only screen and (max-width: 640px)"` — separate mobile URL (legacy m-dot pattern — flag if found, now discouraged)
  - AMP: `<link rel="amphtml" href="...">` — if present, verify the AMP URL is valid and the canonical points back to this page

#### rel="prev" / rel="next" (Pagination)
- Look for: `<link rel="prev" href="...">` and `<link rel="next" href="...">`
- **Google dropped support for rel=prev/next in 2019** — they no longer use these for indexation. Note this if found.
- However, Bing and other search engines still use them — report their presence as informational, not an error.
- If found: verify the URLs are correct and the sequence is logically consistent.
- If the page is a paginated series (PLP, blog archive, search results) and these tags are absent: note that Google expects self-contained content on each page or proper canonicalization of paginated pages to the root.

#### HTTP → HTTPS Redirect Chain
- Run: `curl -I --max-redirs 10 -L http://[domain]`
- Report the full redirect chain (each hop). Flag:
  - Any redirect going through HTTP before landing on HTTPS (mixed-security chain)
  - More than one redirect hop (slow for crawlers and users)
  - Redirect to a page other than the canonical URL

### Google Index Verification (always run for full audits)

Run a `site:` search to confirm what Google has actually indexed:

```
WebSearch: site:[domain]
```

Then take a **[mobile screenshot]** of the SERP results as evidence:

```
browser_resize: { width: 390, height: 844 }
browser_navigate: { url: "https://www.google.com/search?q=site:[domain]" }
browser_take_screenshot: { filename: "output/screenshots/google_site_search_mobile.png" }
```

Save to `output/screenshots/google_site_search_mobile.png`. Report:
- Approximate number of indexed pages shown
- Whether the target URL appears in results
- Any unexpected URLs indexed (staging, params, duplicates)
- Any sitelinks shown (positive signal for authority)

If the specific page is the audit target, also run:
```
WebSearch: site:[full-page-URL]
```
Take a **[mobile screenshot]** of this too (`output/screenshots/google_page_indexed_mobile.png`) and note whether the exact URL is indexed or a different variant (www/non-www, http/https, trailing slash).

> **Evidence rule:** Never assert a page is or isn't indexed without a screenshot of the Google SERP result to back it up.

---

## Phase 3: Technical SEO & Core Web Vitals

### Run Lighthouse for CWV (primary method)
```bash
bash $SKILL_DIR/scripts/lighthouse_audit.sh [URL]
```
This outputs LCP, INP, CLS, FCP, TTFB for both mobile and desktop. Read `references/cwv-thresholds.md` for scoring.

If Lighthouse is not installed, fall back to WebSearch:
```
https://pagespeed.web.dev/analysis?url=[URL]
```
Search for the PSI results page and extract scores. Always report both mobile and desktop.

### HTTPS & Security
- Served over HTTPS?
- Mixed content (http:// in src attributes)?
- Response headers: HSTS, X-Content-Type-Options, X-Frame-Options

### URL Quality
- Lowercase, hyphen-separated, readable?
- Under 100 characters?
- No session IDs, underscores, or excessive parameters?

### JavaScript Rendering Assessment
After fetching, note:
- Was critical content (H1, body text, price, CTAs) in the initial HTML?
- If WebFetch returned CSS-only: page is **JS-rendered** — flag this. Use playwright (`browser_navigate` + `browser_evaluate`) to extract the full rendered DOM for Phases 4–6.
- JS-rendered pages have slower indexation and are at risk of content not being seen by Googlebot.

### Mobile-First Indexing

Google indexes and ranks the **mobile version** of a page. All checks in this section compare the mobile-rendered page against the desktop-rendered page. Use playwright to render both versions — `browser_resize { width: 390, height: 844 }` for mobile and `browser_resize { width: 1440, height: 900 }` for desktop.

#### Site configuration type

Identify which mobile configuration the site uses — this determines which checks apply:

| Configuration | Signal | Checks |
|---------------|--------|--------|
| **Responsive design** | Same URL, same HTML, CSS adapts layout | Content parity, image resolution, lazy-load |
| **Dynamic serving** | Same URL, different HTML per `User-Agent` | All parity checks + `Vary: User-Agent` header |
| **Separate mobile URL (m-dot)** | `m.example.com` or `/m/` subdirectory | All parity checks + canonicalization + redirect rules |

Responsive design is Google's recommended approach. Flag dynamic serving or m-dot as informational — not an error, but requires stricter parity checks.

#### Content parity

Fetch the page with both a desktop and a mobile user-agent (or compare `WebFetch` vs. playwright at mobile viewport via `browser_resize 390×844`) and check:

- **Primary content identical?** All body text, product descriptions, prices, and key information present on mobile. If mobile shows less content (hidden behind tabs, accordions, or completely absent), flag as **High Priority** — Google only indexes what it sees in the mobile version.
- **Headings consistent?** H1 and H2 text identical across both versions (same keywords, same intent).
- **Primary content not requiring user interaction to load?** Content that requires a swipe, tap, click, or form input to reveal will not be indexed. Flag any primary content behind interaction as **Critical**.
- **Lazy-loaded content?** Lazy loading is acceptable for images below the fold. Flag as **Critical** if primary text content, prices, or schema-relevant information requires scrolling to trigger lazy load — Googlebot may not scroll.

#### Metadata parity

- `<title>` — identical on mobile and desktop?
- `<meta name="description">` — identical on mobile and desktop?
- `<meta name="robots">` — same directives on both versions? A `noindex` on the mobile version while desktop is indexed = **Critical** — Google will de-index the page.
- Canonical tag — does the mobile version have a self-referencing canonical (responsive) or point to the desktop URL (m-dot)? Both are acceptable patterns but must be consistent.

#### Structured data parity

- Same schema types present on both mobile and desktop versions?
- URLs within structured data updated to mobile URLs if using separate mobile URLs?
- Flag as **High Priority** if VideoObject, Product, or BreadcrumbList schema is present on desktop but absent on mobile — these directly affect rich results.

#### Image checks (mobile-specific)

- Images load at appropriate resolution on mobile — not the full desktop-resolution image scaled down in CSS (causes slow LCP on mobile)?
- `alt` text identical across mobile and desktop versions?
- Image URLs stable — not dynamically generated URLs that change on each page load (breaks Google's image index)?
- Images in supported formats — SVG accepted; avoid `.jpg` inside SVG `<image>` tags.
- For separate mobile URLs: same image URLs used on both versions where possible to avoid re-crawling.

#### Video checks (mobile-specific)

- Videos use supported HTML tags: `<video>`, `<embed>`, `<object>` — not custom JS players that Googlebot cannot render?
- Videos positioned without excessive scrolling required to reach them?
- No dynamic video URLs that change per page load?
- No `loading="lazy"` on above-the-fold or primary video content — Googlebot may not trigger lazy load?
- Structured data (`VideoObject`) identical on both mobile and desktop versions?

#### Separate mobile URL (m-dot) specific checks

Run only if the site uses `m.example.com` or a `/m/` subdirectory:

- **No URL fragments on mobile URLs** — `m.example.com/page#section` will not be indexed; flag as **Critical**.
- **Error page parity** — if the desktop page returns 200 but the mobile equivalent returns 404 or redirects to the homepage, the page will be removed from the index. Flag as **Critical**.
- **No many-to-one redirects** — multiple desktop URLs must not all redirect to a single mobile URL (e.g. all pages → `m.example.com/home`). Each desktop URL must map 1:1 to a mobile URL. Flag as **Critical**.
- **robots.txt parity** — same `Disallow` rules applied to both versions? Resources (CSS, JS, images) blocked on mobile but not desktop will break Googlebot's rendering.
- **Canonicalization** — mobile URL should have `<link rel="canonical">` pointing to the desktop URL; desktop should have `<link rel="alternate" media="only screen and (max-width: 640px)" href="[mobile-URL]">`.
- **hreflang** — for international sites, mobile `hreflang` links must point to mobile URLs, and desktop `hreflang` links to desktop URLs — mixed references cause incorrect locale targeting.

#### Interstitials and intrusive elements

- Full-page interstitials (cookie banners, login prompts, app download pop-ups) that cover the main content on mobile are a ranking signal — flag as **High Priority** if a full-page overlay appears before content loads.
- App download banners using a small, dismissible banner at the top are acceptable (e.g. native iOS/Android smart app banners). Flag full-page app install interstitials as **High Priority**.
- Follow Better Ads Standards — ads that cover content on mobile hurt both rankings and user experience.

#### Mobile-first indexing verdict

Summarise findings in a table:

| Check | Status | Notes |
|-------|--------|-------|
| Site configuration | Responsive / Dynamic serving / m-dot | |
| Content parity | ✅ / ⚠️ / ❌ | |
| Metadata parity | ✅ / ⚠️ / ❌ | |
| Structured data parity | ✅ / ⚠️ / ❌ | |
| Primary content accessible without interaction | ✅ / ❌ | |
| Images load correctly on mobile | ✅ / ⚠️ / ❌ | |
| No intrusive interstitials | ✅ / ❌ | |
| robots.txt parity (m-dot only) | ✅ / ❌ / N/A | |
| Canonical + alternate correct (m-dot only) | ✅ / ❌ / N/A | |

---

## Phase 4: On-Page SEO

Extract from the HTML (or playwright-rendered DOM if JS-rendered):

### Title Tag
- Quote the exact title
- Character count (target: 50–60 chars / 512px)
- Primary keyword in first 50 characters?
- Compelling for clicks?

**Formula by page type:**
- PDP: `[Product Name] - [Differentiator] | [Brand]`
- PLP: `[Category] - [USP] | [Brand]`
- Blog: `[Headline with keyword] | [Brand]`
- Landing: `[Value Proposition] - [Brand]`
- Homepage: `[Brand] - [Core Value Prop]`

### Meta Description
- Quote exact text
- Character count (target: 150–160 chars)
- Includes primary keyword? Has a CTA?

### Open Graph & Social Meta Tags

⚠️ OG tags are frequently injected by JavaScript and **will not appear in a raw `WebFetch` response**. Always verify using the rendered DOM.

**Extraction method (use in order):**
1. Use playwright: `browser_navigate` to the URL, then `browser_evaluate` to extract all `<meta property="og:*">` and `<meta name="twitter:*">` from the rendered DOM — this is the only reliable method for JS-rendered pages.
2. Grep the raw HTML for `og:` — if found, the site uses SSR for meta tags and WebFetch results are trustworthy.
3. If neither yields results, note explicitly: "OG tags not detectable via static fetch — playwright DOM extraction required for confirmation."

**Check each of these:**

| Tag | Target |
|-----|--------|
| `og:title` | Set? Matches/improves on `<title>`? |
| `og:description` | Set? 1–2 sentences, compelling for shares? |
| `og:image` | Set? Image is ≥1200×630px? Absolute URL? |
| `og:url` | Matches canonical URL exactly? |
| `og:type` | Correct type? (`website`, `article`, `product`) |
| `og:site_name` | Brand name present? |
| `twitter:card` | `summary_large_image` preferred? |
| `twitter:title` / `twitter:description` | Set independently or falling back to OG? |

Flag as **Medium Priority** if any of `og:title`, `og:image`, `og:url` are missing or mismatched. Flag `og:image` missing as **High Priority** for blog posts and PDPs where social sharing drives traffic.

### Heading Structure
- Exactly one H1? Quote it.
- Logical hierarchy (H1 → H2 → H3, no skipping)?
- List the first 5 H2s — are they descriptive or marketing slogans?

### Content
- Primary keyword in first 100 words?
- Thin content? (<300 words for blog/service, <150 for PDP)
- Search intent match?

### Images
- Quote 3 example alt texts. Missing alt? Duplicate alt?
- `width` and `height` attributes set?

### Internal Links
- List internal `<a href>` links found in body content (not just nav/footer)
- Anchor text descriptive?

### Video Detection

Scan the page for any video content. Check for all of the following patterns (use playwright DOM extraction if JS-rendered):

| Signal | What to look for |
|--------|-----------------|
| Native video | `<video>` tag anywhere in the body |
| YouTube embed | `<iframe>` with `src` containing `youtube.com/embed/` or `youtu.be/` |
| Vimeo embed | `<iframe>` with `src` containing `vimeo.com` |
| Other embed | `<iframe>` with video-related `src` (wistia, loom, dailymotion, etc.) |
| VideoObject schema | `"@type": "VideoObject"` in any `<script type="application/ld+json">` |
| Lazy-loaded video | `data-src` containing video URL, or JS-injected `<iframe>` (only visible via playwright DOM extraction) |

If **no video is found**: note "No video content detected" and skip Phase 5b.

If **video is found**: record the type(s), count, and location on page, then proceed to Phase 5b.

### Competitor Benchmark (if requested or doing full audit)

**Step 1: SERP screenshot**

Run the target keyword search and take a **[mobile screenshot]** of the results page as evidence of who is actually ranking:
```
WebSearch: [target keyword]
browser_resize: { width: 390, height: 844 }
browser_navigate: { url: "https://www.google.com/search?q=[target+keyword]" }
browser_take_screenshot: { filename: "output/screenshots/serp_[keyword-slug]_mobile.png" }
```
Save to `output/screenshots/serp_[keyword-slug]_mobile.png`. This proves which competitors were selected and what position they hold at time of audit — on mobile, which is what Google ranks against.

**Step 2: Per-competitor screenshot and fetch**

For the top 1–2 organic results (skip ads, featured snippets, and map packs):
1. Take a **[mobile screenshot]** of each competitor page before fetching it:
   ```
   browser_resize: { width: 390, height: 844 }
   browser_navigate: { url: "[competitor-URL]" }
   browser_take_screenshot: { filename: "output/screenshots/competitor_1_mobile.png" }
   ```
   Save to `output/screenshots/competitor_1_mobile.png`, `competitor_2_mobile.png`. Mobile viewport is required — this is what Google crawls and what users on mobile see.
2. `WebFetch [competitor-URL]` — extract on-page signals.

**Step 3: Comparison table**

Report findings in a table:

| Signal | Audited page | Competitor 1 | Competitor 2 |
|--------|-------------|-------------|-------------|
| Title tag | ... | ... | ... |
| Title length (chars) | ... | ... | ... |
| Meta description | ... | ... | ... |
| H1 | ... | ... | ... |
| Word count (approx.) | ... | ... | ... |
| H2 count | ... | ... | ... |
| Schema types | ... | ... | ... |
| Internal links (body) | ... | ... | ... |

Note: what the top-ranking pages do that the audited page doesn't.

> **Evidence rule:** Never name a competitor or claim a ranking position without a SERP screenshot saved as proof.

---

## Phase 5: Schema Markup

⚠️ `WebFetch` and `curl` see the raw HTML before JavaScript executes. Schema fields that appear empty in raw HTML may be populated at runtime by JS. **Always extract schema via playwright first.**

### Step 1: Extract schema via playwright (primary method)

```
browser_navigate: { url: "[URL]" }
browser_evaluate: {
  function: "Array.from(document.querySelectorAll('script[type=\"application/ld+json\"]')).map(s => s.innerText)"
}
```

This returns the schema exactly as a JSON-LD processor (and Google) sees it after JS has run. Parse each block and record all types found.

Only fall back to `WebFetch` raw HTML extraction if playwright is unavailable. If using raw HTML, note explicitly: "Schema extracted from static HTML — JS-populated fields may differ from what Google indexes."

### Step 2: Validate via official tools

After extracting schema via playwright, cross-reference with at least one of:

1. **Rich Results Test** — checks Google-specific rich result eligibility:
   ```
   WebSearch: https://search.google.com/test/rich-results?url=[URL]
   ```

2. **validator.schema.org** — checks structural correctness:
   ```
   WebFetch: https://validator.schema.org/#url=[URL]
   ```

Use these tools to check for rich result eligibility and structural errors. However, **validators can infer or normalise values that are not actually present in the markup** — do not let a validator's output override what you extracted from the DOM. If the raw schema has `@id: ""` and the validator displays a resolved URL, the raw value is still `""` and must be reported as such.

### Step 3: Evaluate field values — report what the DOM contains

Always quote the exact raw value from the playwright-extracted JSON-LD. Report what is actually there, not what a processor might infer.

| State | Example | How to report |
|-------|---------|--------------|
| Field absent | key not in JSON-LD at all | "`X` is absent from the schema" |
| Field present, empty string | `"@id": ""` | "`@id` is present but empty (`""`) — must be set to a valid URL" |
| Field present, null | `"price": null` | "`price` is present but `null` — not a valid value" |
| Field present, wrong format | `"uploadDate": "Jan 2024"` | "`uploadDate` value `"Jan 2024"` is not ISO 8601 — must be e.g. `2024-01-15T08:00:00Z`" |
| Field present, correct value | `"@id": "https://..."` | Report as passing |

Never say "field is missing" when the key exists in the JSON-LD — distinguish absent from empty. Never soften an empty or invalid value finding because an external validator happens to accept or infer it.

**Expected schema by page type** — see `references/page-type-signals.md` for full table.

| Page Type | Required | Recommended |
|-----------|----------|-------------|
| PDP — parent/configurable product | ProductGroup (with `hasVariant`) | AggregateRating, BreadcrumbList, Offer |
| PDP — variant/SKU product | Product (with `isVariantOf` → ProductGroup) | AggregateRating, BreadcrumbList, Offer |
| PLP | ItemList | BreadcrumbList |
| Blog Post | Article/BlogPosting | Person (author), BreadcrumbList |
| Homepage | Organization, WebSite | SiteLinksSearchBox |
| Local Business | LocalBusiness | OpeningHoursSpecification |
| FAQ | FAQPage | Organization |
| Page with video | VideoObject | Clip, SeekToAction |

For VideoObject specifically, check in Phase 5b below.

---

## Phase 5b: Video Indexing

**Run only if video was detected in Phase 4.** This is separate from schema validation — it checks whether Google can actually find, crawl, and index the video.

### Step 1: Identify video type(s)

**YouTube embed** — extract the video ID from the iframe `src`:
- `https://www.youtube.com/embed/[VIDEO_ID]`
- `https://www.youtube-nocookie.com/embed/[VIDEO_ID]` (privacy-enhanced — Google can still index)
- Check the `title` attribute on the `<iframe>` — required for accessibility; also used by Google as a signal.

**Native `<video>` tag** — extract:
- `src` attribute or `<source src="...">` — is the video file URL absolute and publicly accessible?
- `poster` attribute — thumbnail image URL present?
- `<track kind="subtitles">` or `<track kind="captions">` — captions present?
- `type` attribute on `<source>` (e.g. `video/mp4`) — correct MIME type declared?

**Other embeds (Vimeo, Wistia, etc.)** — note the provider and iframe `src`. Same checks as YouTube: is the video public? Does the page have VideoObject schema for it?

---

### Step 2: Video Sitemap Check

```
WebFetch [domain]/video-sitemap.xml
```

Also check `robots.txt` and the main `sitemap.xml` for a `<sitemap>` entry pointing to a video sitemap.

Report:
- Video sitemap present? (required for Google to reliably discover native videos)
- Does it include the audited page URL or video?
- Required fields present per video entry: `<video:thumbnail_loc>`, `<video:title>`, `<video:description>`, and either `<video:content_loc>` (direct file URL) or `<video:player_loc>` (embed URL)?
- `<video:duration>` set? (recommended — shown in rich results)
- `<video:expiration_date>` set? (if past, Google may de-index the video)

> **Note:** YouTube embeds do not require a video sitemap — YouTube's own sitemap covers them. A video sitemap is primarily needed for native/self-hosted videos.

---

### Step 3: VideoObject Schema Validation

Check for `VideoObject` in the page's structured data (use playwright DOM extraction or Rich Results Test):

**Required fields for Google rich results:**
| Field | Requirement |
|-------|-------------|
| `name` | Video title — present and descriptive? |
| `description` | Non-empty, accurate? |
| `thumbnailUrl` | Absolute URL, publicly accessible, ≥ 60×30px (Google recommends ≥ 1280×720) |
| `uploadDate` | ISO 8601 format (`YYYY-MM-DDThh:mm:ss+TZ`) |

**Recommended fields:**
| Field | Check |
|-------|-------|
| `duration` | ISO 8601 duration format (e.g. `PT1M30S`) — matches actual video length? |
| `contentUrl` | Direct video file URL (for native videos) — accessible without login? |
| `embedUrl` | Embed URL (for YouTube: `https://www.youtube.com/embed/[ID]`) |
| `transcript` | Full transcript text — valuable for E-E-A-T and content depth |
| `hasPart` (Clip) | Timestamps for key moments — enables Jump To results in Google |
| `interactionStatistic` | View count — adds social proof signals |

**For YouTube embeds specifically:**
- `embedUrl` must be `https://www.youtube.com/embed/[VIDEO_ID]` — not the watch URL
- `contentUrl` should be omitted (Google fetches from YouTube directly)
- `thumbnailUrl` must point to a publicly accessible image — `https://img.youtube.com/vi/[VIDEO_ID]/maxresdefault.jpg` is a reliable default

Flag as **Critical** if: video is present but no VideoObject schema exists and no video sitemap entry exists — Google has no structured signal to index the video as a rich result.

---

### Step 4: Googlebot Video Crawlability

Check that the video itself is not blocked from crawling:

**For native/self-hosted video:**
```bash
curl -I [video-file-URL]
```
- Returns 200? (not 403, 401, or 404)
- `Content-Type` header matches video format (e.g. `video/mp4`)?
- Check `robots.txt` — does any `Disallow` rule block the video file path or its directory?

**For YouTube embeds:**
- Is the video set to Public on YouTube? (Private/Unlisted = Google cannot index it)
- Run: `WebSearch: site:youtube.com/watch?v=[VIDEO_ID]` — if no result, the video may be private, age-restricted, or otherwise blocked from indexation.
- Does the iframe have `loading="lazy"`? If so, flag: Google may not render the video during crawl — prefer eager loading or ensure VideoObject schema is present as a fallback.

**Geo-restriction or login wall check:**
- Is the video accessible without logging in? (session cookies, paywalls = not indexable)
- Any `Vary: Cookie` response headers on the video URL? (signals auth gating)

---

### Step 5: Video Rich Result Eligibility Summary

After Steps 1–4, give a clear verdict:

| Check | Status |
|-------|--------|
| Video detected on page | ✅ / ❌ |
| Video type | YouTube / Native / Vimeo / Other |
| VideoObject schema present | ✅ / ⚠️ / ❌ |
| All required schema fields present | ✅ / ⚠️ missing: [...] |
| Video sitemap present (native) | ✅ / ❌ / N/A |
| Video publicly crawlable | ✅ / ❌ |
| Rich result eligible | ✅ Eligible / ⚠️ Partial / ❌ Not eligible |

---

## Phase 6: E-E-A-T & Content Quality

Read `references/eeat-checklist.md` and `references/google-helpful-content.md`. Assess based on what's visible on the page:

- **Experience:** First-hand insights, original data, real examples?
- **Expertise:** Author credentials, accurate/specific information?
- **Authoritativeness:** Cited by others, industry recognition?
- **Trustworthiness:** HTTPS, privacy policy, contact info, no deceptive ads?

For YMYL pages (health, finance, legal), flag absent expert credentials as Critical.

---

## Phase 7: Page-Type-Specific Checks

Run the matching section only:

### PDP

#### Step 1: Classify as parent product or variant

Before checking schema, determine which type of product page this is:

**Parent / configurable product page** — signals:
- URL contains no variant-specific parameters (no `?color=red`, no `/blue-xl` slug)
- Page shows a product with selectable options (color swatch, size picker, dropdown)
- Title/H1 refers to the base product name without a specific variant (e.g. "Nike Air Max 90" not "Nike Air Max 90 — Red / Size 10")
- URL is typically the "canonical" product URL that variant URLs point back to

**Variant / SKU product page** — signals:
- URL changes when a variant is selected (e.g. `/products/nike-air-max-90?variant=123` or `/products/nike-air-max-90-red-size-10`)
- Page shows a specific SKU with a fixed price, specific availability, and no further option selection needed
- Title/H1 includes variant attributes (color, size, material)

State the classification explicitly in the report before checking schema.

#### Step 2: Schema check by product page type

**If parent product page → expect `ProductGroup` as the primary schema type:**
- [ ] `@type: "ProductGroup"` present as the top-level entity
- [ ] `name` — base product name
- [ ] `description` — unique (not manufacturer boilerplate)
- [ ] `url` — matches canonical URL of this page
- [ ] `hasVariant` — array of `Product` objects or references, one per variant (color/size/etc.)
  - Each `hasVariant` item should have: `name`, `sku`, `offers` (with `price`, `priceCurrency`, `availability`), and `variesBy` attribute values
- [ ] `variesBy` — declares which dimensions vary (e.g. `"color"`, `"size"`) — required for Google to surface variant selectors in search
- [ ] `brand` — `Organization` or `Brand` with `name`
- [ ] `image` — array of product images, absolute URLs
- [ ] `AggregateRating` — if reviews exist on the page, must be marked up here at the ProductGroup level
- [ ] Flag as **Critical** if `@type: "Product"` is used instead of `ProductGroup` on a configurable product page — Google will not display variant-level rich results

**If variant product page → expect `Product` as the primary schema type:**
- [ ] `@type: "Product"` present as the top-level entity
- [ ] `name` — includes variant-specific attributes (e.g. "Nike Air Max 90 — Red / Size 10")
- [ ] `sku` — unique SKU for this variant
- [ ] `isVariantOf` — points to the parent `ProductGroup` (by `@id` or inline) — required for Google to understand the variant relationship
- [ ] `color`, `size`, or other variant attribute properties — must match what `variesBy` declares on the ProductGroup
- [ ] `offers` — `Offer` or `AggregateOffer` with:
  - `price` and `priceCurrency` — exact values, not ranges
  - `availability` — schema.org URL (`InStock`, `OutOfStock`, `PreOrder`, etc.)
  - `priceValidUntil` — recommended; required to maintain eligibility in some markets
  - `url` — matches this variant's canonical URL
- [ ] `AggregateRating` — present if reviews are visible; can reference parent ProductGroup ratings
- [ ] `image` — variant-specific images (not just the base product image)
- [ ] `BreadcrumbList` — canonical breadcrumb ending at this variant's name
- [ ] Flag as **Critical** if `isVariantOf` is missing — Google cannot associate this variant with its parent, breaking variant indexation

#### Step 3: Cross-check canonical alignment

- The variant page's canonical should point to itself (the variant URL), not to the parent product page — unless the site intentionally consolidates all variant traffic to the parent
- If variant pages canonical back to the parent, flag: variant-specific content (price, availability, images) will not be indexed for that SKU
- The parent ProductGroup schema's `hasVariant[].url` values must match the actual variant page URLs (or their canonicals if canonicalized elsewhere)

#### Step 4: Remaining PDP checks (apply to both types)
- [ ] Unique product description (not manufacturer boilerplate)
- [ ] Reviews visible on page and marked up in schema
- [ ] OOS handling: is `availability` schema updated to `OutOfStock`? Page still live or redirecting?
- [ ] Related products internally linked in body content
- [ ] Product images: multiple angles? `width`/`height` attributes set? Alt text includes product name + variant?

### PLP / Category
- [ ] Unique category description (300+ words)
- [ ] Faceted nav: canonicalized or noindexed?
- [ ] ItemList schema
- [ ] Pagination handled without duplicate indexation

### Blog Post
- [ ] Author bio with credentials visible
- [ ] Article schema with `datePublished` + `dateModified`
- [ ] Internal links to related posts and pillar pages
- [ ] Cannibalization check: other posts targeting the same keyword?
- [ ] Last updated date visible on page?

### Landing Page
- [ ] Single clear CTA, not buried
- [ ] Indexed? (landing pages are often accidentally noindexed)
- [ ] Conversion element works without JS?

### Homepage
- [ ] Clear value prop in H1
- [ ] Organization schema
- [ ] Links to all major site sections

### Local Business
- [ ] NAP (name, address, phone) visible and consistent
- [ ] LocalBusiness schema
- [ ] Google Map embedded
- [ ] Location keyword in title and H1

### SaaS / Feature Page
- [ ] Content depth >500 words
- [ ] Feature-specific keyword (not generic "software")
- [ ] Comparison or alternative pages linked

---

## Phase 8: Generate DOCX Report

**For full audits only.** After completing Phases 1–7, generate a professional `.docx` report.

### Step 1: Structure findings as JSON

Collect all findings from Phases 1–7 into a single JSON object. The schema:

```json
{
  "url": "<audited URL>",
  "pageType": "<detected page type>",
  "rendering": "<SSR | JS-rendered | Offline>",
  "auditScope": "<Full | Quick check: ...>",
  "auditDate": "<YYYY-MM-DD>",
  "executiveSummary": "<2-4 sentence summary>",
  "criticalIssues": [{ "title": "...", "what": "...", "fix": "...", "impact": "High" }],
  "highPriority": [{ "title": "...", "what": "...", "fix": "..." }],
  "mediumPriority": [{ "title": "...", "what": "...", "fix": "..." }],
  "quickWins": [{ "title": "...", "what": "...", "fix": "..." }],
  "whatsWorking": ["<strength 1>", "<strength 2>"],
  "pageTypeFindings": ["<finding with emoji status>"],
  "competitorBenchmark": {
    "targetKeyword": "...",
    "serpScreenshot": "output/screenshots/serp_[keyword-slug]_mobile.png",
    "competitors": [
      {
        "url": "...",
        "rank": 1,
        "screenshot": "output/screenshots/competitor_1_mobile.png",
        "titleTag": "...", "titleLength": 0,
        "metaDescription": "...",
        "h1": "...", "wordCount": 0, "h2Count": 0,
        "schemaTypes": [], "internalLinksInBody": 0
      }
    ],
    "gaps": ["<what competitors do that audited page doesn't>"]
  },
  "schema": {
    "checkedVia": "...",
    "found": ["<type>"],
    "missing": ["<type>"],
    "recommendation": "..."
  },
  "pdpSchema": {
    "productPageKind": "<parent-product | variant-product | not-a-pdp>",
    "expectedSchemaType": "<ProductGroup | Product>",
    "actualSchemaType": "...",
    "schemaTypeCorrect": true,
    "isVariantOfPresent": true,
    "hasVariantCount": 0,
    "variesByDeclared": [],
    "offerFields": { "price": "...", "currency": "...", "availability": "...", "priceValidUntil": "..." },
    "canonicalAlignedToVariant": true,
    "issues": []
  },
  "video": {
    "detected": false,
    "types": [{ "kind": "<youtube|native|vimeo|other>", "id": "...", "location": "..." }],
    "videoSitemap": { "present": false, "url": "...", "coversThisPage": false, "missingFields": [] },
    "videoObjectSchema": {
      "present": false,
      "requiredFields": { "name": "...", "description": "...", "thumbnailUrl": "...", "uploadDate": "..." },
      "missingRequired": [],
      "missingRecommended": []
    },
    "crawlability": {
      "videoFileAccessible": true,
      "blockedByRobots": false,
      "youtubePublic": true,
      "lazyLoadedIframe": false,
      "issues": []
    },
    "richResultEligible": "<Eligible | Partial | Not eligible>",
    "richResultBlockers": []
  },
  "coreWebVitals": {
    "mobile": { "lcp": "...", "inp": "...", "cls": "...", "fcp": "...", "ttfb": "..." },
    "desktop": { "lcp": "...", "inp": "...", "cls": "..." },
    "topBottleneck": "..."
  },
  "mobileFirstIndexing": {
    "siteConfiguration": "<responsive | dynamic-serving | separate-mobile-url>",
    "contentParity": true,
    "headingParity": true,
    "primaryContentRequiresInteraction": false,
    "lazyLoadedPrimaryContent": false,
    "metadataParity": { "title": true, "metaDescription": true, "metaRobots": true, "canonical": true },
    "structuredDataParity": true,
    "structuredDataMissingOnMobile": [],
    "imageUrlsStable": true,
    "altTextParity": true,
    "videoTagsSupported": true,
    "intrusiveInterstitials": false,
    "mdot": {
      "applicable": false,
      "urlFragmentsOnMobile": false,
      "errorPageParityBroken": false,
      "manyToOneRedirects": false,
      "robotsTxtParity": true,
      "canonicalAlternateCorrect": true,
      "hreflangPointsToCorrectVersion": true
    },
    "issues": []
  },
  "crawlability": {
    "robotsTxt": "...",
    "sitemap": {
      "url": "...",
      "returns200": true,
      "type": "<sitemap-index | plain-sitemap>",
      "referencedInRobotsTxt": true,
      "auditedPageListed": true,
      "childSitemaps": [],
      "lastmod": {
        "auditedPageValue": "...",
        "format": "<YYYY-MM-DDThh:mm:ssZ | YYYY-MM-DD | invalid | absent>",
        "formatValid": true,
        "allDatesIdentical": false,
        "identicalDate": null,
        "auditedPageStale": false,
        "futureDate": false,
        "issues": []
      },
      "imageSitemap": {
        "present": false,
        "url": "...",
        "auditedPageHasImageEntries": false,
        "imageCountForPage": 0,
        "exceeds1000Limit": false,
        "crossDomainImages": false,
        "deprecatedTagsFound": [],
        "issues": []
      },
      "newsSitemap": {
        "present": false,
        "url": "...",
        "articleCount": 0,
        "articlesOlderThan2Days": false,
        "missingRequiredTags": [],
        "publicationNameMatchesGoogleNews": true,
        "languageCodeValid": true,
        "issues": []
      },
      "videoSitemap": {
        "present": false,
        "url": "...",
        "videoCount": 0,
        "missingRequiredTags": [],
        "expiredExpirationDate": false,
        "deprecatedTagsFound": [],
        "contentLocAccessible": true,
        "issues": []
      },
      "combinedExtensions": {
        "detected": false,
        "namespacesUsed": [],
        "namespacesUndeclared": [],
        "issues": []
      }
    },
    "metaRobots": {
      "sources": {
        "metaRobots": "...",
        "metaGooglebot": "...",
        "metaGooglebotNews": "...",
        "xRobotsTag": "..."
      },
      "effectiveDirectives": {
        "noindex": false, "nofollow": false, "none": false,
        "nosnippet": false, "noimageindex": false, "notranslate": false,
        "indexifembedded": false,
        "maxSnippet": null,
        "maxImagePreview": "<large | standard | none | absent>",
        "maxVideoPreview": null,
        "unavailableAfter": null, "unavailableAfterExpired": false
      },
      "conflicts": [],
      "issues": []
    },
    "canonical": {
      "value": "...",
      "source": "<html-tag | http-header | js-injected>",
      "selfReferencing": true,
      "httpsCorrect": true,
      "wwwConsistent": true,
      "trailingSlashConsistent": true,
      "multipleFound": false,
      "chainDetected": false,
      "issues": []
    },
    "hreflang": {
      "present": false,
      "tags": [{ "lang": "...", "url": "..." }],
      "xDefaultPresent": false,
      "returnTagsVerified": false,
      "issues": []
    },
    "relAlternate": [{ "type": "...", "href": "...", "note": "..." }],
    "relPrevNext": { "present": false, "prev": "...", "next": "...", "note": "Google dropped support in 2019" },
    "redirectChain": ["<hop 1>", "<hop 2>"],
    "indexation": "..."
  },
  "onPage": [{ "element": "...", "finding": "...", "status": "✅ / ⚠️ / ❌" }],
  "ogTags": {
    "extractionMethod": "<playwright | static HTML | not detectable>",
    "ogTitle": "...", "ogDescription": "...", "ogImage": "...",
    "ogUrl": "...", "ogType": "...", "ogSiteName": "...",
    "twitterCard": "...", "issues": ["<missing og:image>", "..."]
  },
  "indexationEvidence": {
    "siteSearchScreenshot": "output/screenshots/google_site_search_mobile.png",
    "pageIndexedScreenshot": "output/screenshots/google_page_indexed_mobile.png",
    "indexedPageCount": "...",
    "targetUrlIndexed": true,
    "notes": "..."
  },
  "nextSteps": ["<action 1>", "<action 2>"]
}
```

Write this JSON to `output/audit_data.json`.

### Step 2: Generate the DOCX

```bash
# Ensure docx package is available
npm list -g docx > /dev/null 2>&1 || npm install -g docx

# Generate the report
node $SKILL_DIR/scripts/generate_docx.js output/audit_data.json output/audit_report.docx
```

Confirm the `.docx` was created, then tell the user:
> "Your audit report is ready in two formats: `output/audit_report.md` (Markdown) and `output/audit_report.docx` (Word document)."

---

## Output Format

**For quick checks:** Answer the specific question directly. No full template needed — just the finding, evidence, and fix.

**For full audits:** Use `assets/report-template.md` as the base. Be specific — quote actual tag content, show character counts, name the exact issue. After writing the markdown report, run Phase 8 to also generate a `.docx` version.

```
# SEO Audit: [URL]
**Page Type:** [type] | **Rendering:** [SSR / JS-rendered / Offline]
**Audit Scope:** [Full / Quick check: what was checked]
**Audit Date:** [date]

## Executive Summary
[2–4 sentences: health, biggest opportunity, most urgent issue]

## Critical Issues ⛔
[Actively blocking indexation, rendering, or ranking]

## High Priority 🔴
[Hurting performance, not blocking]

## Medium Priority 🟡
[Optimizations for rankings/CTR]

## Quick Wins 🟢
[Small changes, meaningful impact]

## What's Working ✅
[2–3 genuine strengths]

## Page-Type-Specific Findings
## Schema Summary
## Core Web Vitals
## Next Steps (top 5–7, in order)
```

---

## Mobile-First Screenshot Protocol

Google uses mobile-first indexing — the mobile version of a page is what Google crawls and ranks. All screenshots taken during an audit **must use a mobile viewport** so the evidence reflects what Google actually sees.

**Run once at the start of every audit (Phase 1) before any screenshot is taken:**

```bash
Bash: mkdir -p output/screenshots
```

This ensures the directory exists — Playwright cannot create parent directories automatically and will throw `ENOENT` if they are missing. `mkdir -p` is safe to run even if the directory already exists.

Then before every screenshot, resize to iPhone 14 dimensions using `browser_resize`, then capture:

```
browser_resize: { width: 390, height: 844 }
browser_take_screenshot: { filename: "output/screenshots/[name]_mobile.png" }
```

Shorthand used in instructions below:
> **[mobile screenshot]** = `browser_resize 390×844` → `browser_take_screenshot`

Apply this to every screenshot in the audit: SERP screenshots, indexation checks, competitor pages, and any page screenshot taken for evidence.

If the page has a separate mobile URL (m-dot) detected via `rel="alternate" media="..."` in Phase 2, screenshot **both** the desktop and mobile URLs, saving them as `_desktop.png` and `_mobile.png` respectively.

---

## Tool Use Notes

- **WebFetch** — initial page fetch, robots.txt, sitemap.xml
- **curl -I via Bash** — always run to get HTTP response headers: `X-Robots-Tag`, `Link: rel=canonical`, `Link: rel=alternate`, HSTS, redirect chain. Do not skip this even when WebFetch succeeds.
- **curl via Bash** — fallback for JS-rendered pages or bot-blocked responses
- **playwright** (`mcp__playwright`) — full DOM extraction for SPA/CSR pages via `browser_navigate` + `browser_evaluate`; extracts JS-injected schema and OG tags; screenshots via `browser_take_screenshot` after `browser_resize 390×844` for mobile viewport
- **Lighthouse via Bash** — primary CWV tool; run `scripts/lighthouse_audit.sh`
- **WebSearch** — PageSpeed Insights fallback, Rich Results Test, competitor SERP research, `site:` indexation checks
- **Write** — save audit report to `output/audit_report.md`
- **node generate_docx.js** — convert audit JSON to `.docx` (Phase 8); requires `npm install -g docx`
- Never report schema absent without checking validator.schema.org, Rich Results Test, or playwright DOM extraction
- Always report CWV for both mobile and desktop
- Never assert a page is indexed or not indexed without a playwright screenshot of the Google `site:` SERP as evidence
- Never report OG tags as absent based on `WebFetch` alone — always confirm via playwright DOM extraction or note it as unverifiable
