# SEO Audit: [URL]

**Page Type:** [e.g. Product Detail Page — Variant / Blog Post / Homepage]
**Rendering:** [SSR / JS-rendered / Offline]
**Audit Scope:** [Full / Quick check: what was checked]
**Audit Date:** [YYYY-MM-DD]

---

## Executive Summary

[2–4 sentences: overall SEO health, single biggest opportunity, most urgent issue to fix.]

---

## Critical Issues ⛔
*Actively blocking indexation, rendering, or ranking. Fix immediately.*

### [Issue Title]
**What:** [Specific problem with evidence — quote exact tag content, values, character counts]
**Fix:** [Concrete action]
**Impact:** Critical

---

## High Priority 🔴
*Hurting performance or visibility but not fully blocking. Fix within 2 weeks.*

---

## Medium Priority 🟡
*Optimisations for rankings or CTR. Fix within 1–2 months.*

---

## Quick Wins 🟢
*Small changes, meaningful impact — e.g. missing alt text, meta description tweaks.*

---

## What's Working ✅
[2–3 genuine strengths. Be specific, not generic.]

---

## Crawlability & Indexation

### robots.txt
- **URL:** `[domain]/robots.txt` — [200 OK / Not found / Error]
- **Sitemap referenced:** [Yes / No — flag if missing]
- **Issues:** [Important paths blocked? Conflicting rules?]

### XML Sitemap
- **Type:** [Sitemap index / Plain sitemap]
- **Audited page listed:** [Yes / No]
- **Child sitemaps:** [List types — blog, products, images, video, news]

#### `<lastmod>` check
- **Format used:** [`YYYY-MM-DDThh:mm:ssZ` ✅ / `YYYY-MM-DD` ✅ / Other ❌ — quote example]
- **Audited page value:** `[date]`
- **Staleness:** [Fresh / Stale — X days old / Bulk-regeneration pattern detected / Future date ❌]

#### Image sitemap
- **Present:** [Yes / No]
- **Audited page has image entries:** [Yes / No]
- **Image count for page:** [n] (max 1,000)
- **Issues:** [Deprecated tags found / Cross-domain images without Search Console verification / Missing `<image:loc>`]

#### News sitemap
- **Present:** [Yes / No — only flag if site is a news publisher]
- **2-day freshness rule:** [Pass / Articles older than 2 days present ❌]
- **Required fields:** [`name` ✅/❌ | `language` ✅/❌ | `publication_date` ✅/❌ | `title` ✅/❌]
- **Issues:** [e.g. publication name doesn't match news.google.com]

#### Video sitemap
- **Present:** [Yes / No / N/A — only needed for native/self-hosted video]
- **Required fields:** [`thumbnail_loc` ✅/❌ | `title` ✅/❌ | `description` ✅/❌ | `content_loc` or `player_loc` ✅/❌]
- **`expiration_date` expired:** [No / Yes ❌ — Critical]
- **Issues:** [Deprecated tags / `content_loc` inaccessible]

#### Combined sitemap extensions
- **Namespaces declared:** [All declared ✅ / Missing: [namespace] ❌]
- **File size:** [OK / Approaching 50MB limit ⚠️]

### Meta Robots (all sources)

| Source | Raw value |
|--------|-----------|
| `<meta name="robots">` | `[exact content value or "absent"]` |
| `<meta name="googlebot">` | `[exact content value or "absent"]` |
| `<meta name="googlebot-news">` | `[exact content value or "absent"]` |
| `X-Robots-Tag` (HTTP header) | `[exact value or "absent"]` |

**Effective directives:**

| Directive | Present? | Issue? |
|-----------|----------|--------|
| `noindex` | ✅/❌ | [Flag if unexpected] |
| `nofollow` | ✅/❌ | [Flag if unexpected] |
| `none` | ✅/❌ | [Flag if present] |
| `nosnippet` | ✅/❌ | [Flag if unexpected] |
| `noimageindex` | ✅/❌ | [Flag if unexpected] |
| `notranslate` | ✅/❌ | [Flag if unexpected] |
| `max-snippet` | [value or absent] | |
| `max-image-preview` | [`large` ✅ / `standard` ⚠️ / `none` ❌ / absent ⚠️] | |
| `max-video-preview` | [value or absent] | |
| `unavailable_after` | [date or absent] | [Flag if date has passed ❌] |

**Conflicts detected:** [None / e.g. `meta name="robots"` sets `max-image-preview:large` but `X-Robots-Tag` overrides with `none` ❌]

### Canonical Tag
- **HTML tag:** `<link rel="canonical" href="[exact value]">` — [Found / Absent / Multiple found ❌]
- **HTTP `Link:` header:** `[exact value or "absent"]`
- **Source:** [HTML tag / HTTP header / JS-injected ⚠️]
- **Self-referencing:** [Yes ✅ / No ❌ — points to: [URL]]
- **Protocol correct (https):** [Yes ✅ / No ❌]
- **www consistent:** [Yes ✅ / No ❌]
- **Trailing slash consistent:** [Yes ✅ / No ❌]
- **Chain detected:** [No ✅ / Yes ❌]
- **Multiple canonicals:** [No ✅ / Yes ❌ — Critical]

### hreflang Tags
- **Present:** [Yes / No]
- *(If absent)* No hreflang detected — [not required / flag if multi-region signals present]
- *(If present)*
  - **Tags found:** [`en` → `[url]`, `fr-FR` → `[url]`, `x-default` → `[url]`]
  - **Return tags verified:** [Yes ✅ / No ❌]
  - **`x-default` present:** [Yes ✅ / No ❌]
  - **Valid BCP 47 codes:** [Yes ✅ / Invalid codes found: [list] ❌]
  - **Canonical consistency:** [Yes ✅ / No ❌]

### rel=alternate / rel=prev / rel=next
- **RSS/Atom feed linked:** [Yes / No]
- **AMP (`rel="amphtml"`):** [Present / Absent]
- **Separate mobile URL (`m-dot`):** [Detected ⚠️ / Not detected]
- **rel=prev / rel=next:** [Absent / Present — informational, Google dropped support in 2019]

### Google Index Verification
- **`site:[domain]` search:** [~X pages indexed / Screenshot: `output/screenshots/google_site_search_mobile.png`]
- **Target page indexed:** [Yes ✅ / No ❌ / Indexed as different variant: [URL]]
  Screenshot: `output/screenshots/google_page_indexed_mobile.png`
- **Unexpected URLs indexed:** [None / e.g. staging URLs, param variants]
- **Sitelinks shown:** [Yes ✅ / No]

### HTTP Redirect Chain
```
[http://domain] → [https://domain] → [https://www.domain/] — X hops
```
[Pass — single clean redirect ✅ / Flag issues: mixed-security hop / multiple hops / wrong destination]

---

## Technical SEO & Core Web Vitals

### Core Web Vitals

| Metric | Mobile | Status | Desktop | Status |
|--------|--------|--------|---------|--------|
| LCP | Xs | [Good ✅ / Needs Improvement ⚠️ / Poor ❌] | Xs | |
| INP | Xms | | Xms | |
| CLS | X.XX | | X.XX | |
| FCP | Xs | | Xs | |
| TTFB | Xms | | Xms | |

**Top bottleneck:** [Single biggest CWV cause and fix]

### HTTPS & Security
- Served over HTTPS: [Yes ✅ / No ❌]
- Mixed content: [None ✅ / Found: [examples] ❌]
- HSTS header: [Present ✅ / Absent ⚠️]

### URL Quality
- [Lowercase, hyphen-separated, under 100 chars: ✅ / Issues: [describe]]

### JavaScript Rendering
- **Rendering method:** [SSR / JS-rendered / Hybrid]
- **Critical content in initial HTML:** [Yes ✅ / No — H1/body text/price JS-injected ❌]

### Mobile-First Indexing

**Site configuration:** [Responsive ✅ / Dynamic serving ⚠️ / Separate mobile URL (m-dot) ⚠️]

| Check | Status | Notes |
|-------|--------|-------|
| Content parity (mobile = desktop) | ✅ / ⚠️ / ❌ | |
| Primary content accessible without interaction | ✅ / ❌ | |
| Lazy-loaded primary content | ✅ / ❌ | |
| Metadata parity (title, meta, robots, canonical) | ✅ / ⚠️ / ❌ | |
| Structured data parity | ✅ / ⚠️ / ❌ | [Schema missing on mobile: list types] |
| Image URLs stable (not dynamic) | ✅ / ❌ | |
| Alt text identical across versions | ✅ / ❌ | |
| Video tags supported (`<video>`, `<embed>`) | ✅ / ❌ | |
| No intrusive interstitials | ✅ / ❌ | |
| robots.txt parity (m-dot only) | ✅ / ❌ / N/A | |
| Canonical + `rel=alternate` correct (m-dot only) | ✅ / ❌ / N/A | |

---

## On-Page SEO

### Title Tag
- **Exact value:** `"[title]"`
- **Length:** [XX chars / XX px] — [Good ✅ / Too long ⚠️ / Too short ⚠️]
- **Primary keyword in first 50 chars:** [Yes ✅ / No ❌]
- **Recommended:** `"[suggested title]"`

### Meta Description
- **Exact value:** `"[description]"`
- **Length:** [XX chars] — [Good ✅ / Too long ⚠️ / Absent ❌]
- **Includes keyword:** [Yes ✅ / No ⚠️]
- **Has CTA:** [Yes ✅ / No ⚠️]

### Open Graph & Social Meta Tags
**Extraction method:** [playwright DOM ✅ / Static HTML / Not detectable]

| Tag | Value | Status |
|-----|-------|--------|
| `og:title` | `"[value or absent]"` | ✅ / ⚠️ / ❌ |
| `og:description` | `"[value or absent]"` | ✅ / ⚠️ / ❌ |
| `og:image` | `[URL or absent]` | ✅ / ⚠️ / ❌ |
| `og:url` | `[URL or absent]` | ✅ / ⚠️ / ❌ |
| `og:type` | `[value or absent]` | ✅ / ⚠️ / ❌ |
| `og:site_name` | `[value or absent]` | ✅ / ⚠️ / ❌ |
| `twitter:card` | `[value or absent]` | ✅ / ⚠️ / ❌ |
| `twitter:title` | `[value or absent]` | ✅ / ⚠️ / ❌ |
| `twitter:description` | `[value or absent]` | ✅ / ⚠️ / ❌ |

### Heading Structure
- **H1:** `"[exact H1 text]"` — [One ✅ / Multiple ❌ / Absent ❌]
- **Hierarchy:** [Logical H1→H2→H3 ✅ / Skips detected ⚠️]
- **First 5 H2s:** [list]

### Content
- **Word count:** ~[X] words — [Sufficient ✅ / Thin ❌]
- **Primary keyword in first 100 words:** [Yes ✅ / No ❌]
- **Search intent match:** [Yes ✅ / Partial ⚠️ / No ❌]

### Images
| Example | Alt text | Width/Height set |
|---------|----------|-----------------|
| `[img src]` | `"[alt]"` | ✅ / ❌ |
| `[img src]` | `"[alt]"` | ✅ / ❌ |
| `[img src]` | `"[alt]"` | ✅ / ❌ |

### Internal Links (body content only)
| Anchor text | URL | Issue? |
|-------------|-----|--------|
| [text] | [url] | ✅ / ⚠️ generic anchor |

---

## Video Indexing *(skip if no video detected)*

**Video detected:** [Yes / No]
**Type:** [YouTube embed / Native `<video>` / Vimeo / Other]
**Video ID / URL:** `[value]`

| Check | Status | Notes |
|-------|--------|-------|
| VideoObject schema present | ✅ / ⚠️ / ❌ | |
| `name` | ✅ / ❌ | `"[value]"` |
| `description` | ✅ / ❌ | |
| `thumbnailUrl` | ✅ / ❌ | `[URL]` |
| `uploadDate` | ✅ / ❌ | `[value]` — ISO 8601? |
| `duration` | ✅ / ❌ / absent | `[value]` |
| `embedUrl` / `contentUrl` | ✅ / ❌ | |
| Video sitemap present | ✅ / ❌ / N/A | |
| Video publicly crawlable | ✅ / ❌ | |
| YouTube video public | ✅ / ❌ / N/A | |
| `loading="lazy"` on iframe | ⚠️ / ❌ / N/A | |
| **Rich result eligible** | ✅ Eligible / ⚠️ Partial / ❌ Not eligible | |

---

## Schema Markup

**Extraction method:** [playwright DOM ✅ / Static HTML ⚠️ / Rich Results Test]
**Validation:** [Rich Results Test: X errors, X warnings / validator.schema.org]

### Schema types found

*(For each schema block found, quote the exact raw values for key fields)*

#### [Schema type — e.g. LocalBusiness]
| Field | Raw value | Status |
|-------|-----------|--------|
| `@type` | `"LocalBusiness"` | ✅ |
| `@id` | `"[exact value — empty string if blank]"` | ✅ / ❌ empty |
| `name` | `"[value]"` | ✅ / ❌ |
| [other fields] | | |

*(Repeat block for each schema type)*

### PDP schema classification *(PDP pages only)*
- **Page kind:** [Parent/configurable product / Variant/SKU product]
- **Expected schema type:** [`ProductGroup` / `Product`]
- **Actual schema type found:** [`[type]`] — [Correct ✅ / Wrong ❌ Critical]
- **`isVariantOf` present:** [Yes ✅ / No ❌ Critical] *(variant pages only)*
- **`hasVariant` count:** [X] *(parent pages only)*
- **`variesBy` declared:** [`color`, `size`] *(parent pages only)*
- **Canonical aligned to variant:** [Yes ✅ / No ❌]

### Missing schema
[Schema types expected for this page type but absent — with fix recommendation]

---

## E-E-A-T & Content Quality

| Signal | Finding | Status |
|--------|---------|--------|
| Experience (first-hand insights, original data) | | ✅ / ⚠️ / ❌ |
| Expertise (author credentials, accuracy) | | ✅ / ⚠️ / ❌ |
| Authoritativeness (citations, recognition) | | ✅ / ⚠️ / ❌ |
| Trustworthiness (HTTPS, privacy policy, contact) | | ✅ / ⚠️ / ❌ |
| YMYL flag | [Yes — flag absent credentials as Critical / No] | |

---

## Page-Type-Specific Findings

*[Results of the Phase 7 checklist for the detected page type]*

| Check | Status |
|-------|--------|
| [Check 1] | ✅ / ⚠️ / ❌ |
| [Check 2] | ✅ / ⚠️ / ❌ |

---

## Competitor Benchmark

**Target keyword:** `[keyword]`
**SERP screenshot:** `output/screenshots/serp_[keyword-slug]_mobile.png`

| Signal | [Audited page] | [Competitor 1 — rank X] | [Competitor 2 — rank X] |
|--------|---------------|------------------------|------------------------|
| Title tag | | | |
| Title length (chars) | | | |
| Meta description | | | |
| H1 | | | |
| Word count | | | |
| H2 count | | | |
| Schema types | | | |
| Internal links (body) | | | |

**Competitor screenshots:** `output/screenshots/competitor_1_mobile.png`, `competitor_2_mobile.png`

**Gaps vs. top-ranking pages:**
- [What competitors do that audited page doesn't]

---

## Next Steps (Priority Order)

1. [Most urgent — Critical or High issue]
2. [Second priority]
3. [Third priority]
4. [Fourth priority]
5. [Fifth priority]
6. [Sixth priority — optional]
7. [Seventh priority — optional]

---

> **Reports saved to:**
> - Markdown: `output/audit_report.md`
> - Word document: `output/audit_report.docx` (Phase 8)
> - Screenshots: `output/screenshots/`
