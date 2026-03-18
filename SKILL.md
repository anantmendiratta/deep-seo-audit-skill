---
name: deep-seo-audit
description: Expert-level technical SEO audit for any URL. Use this skill whenever the user wants to audit, analyze, review, or check the SEO of a website, page, or URL — even if they just say "check my site", "why isn't my page ranking", "quick SEO check", or "look at my title tags". Covers crawlability, indexation, Core Web Vitals (via Lighthouse), on-page SEO, schema markup, content quality, and E-E-A-T. Automatically detects page type (product listing, product detail, landing page, blog post, homepage, etc.) and tailors the audit accordingly. Also use for focused single-element checks like "is my schema correct?" or "check my page speed".
allowed-tools: mcp__puppeteer, WebSearch, WebFetch, Bash(lighthouse *), Bash(curl *), Bash(python3 *), Bash(node *), Bash(npm *), Read, Write
---

# Deep SEO Audit Skill

Performs technical SEO audits for any URL — from a 2-minute focused check to a full 7-phase deep audit. Adapts to page type and user goal.

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
   - If still empty, use `mcp__puppeteer` to render the page with JavaScript and extract the full DOM
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
Check: returns 200? Contains canonical URLs? `<lastmod>` values? Blog/product sitemaps linked?

### Indexation Signals (from page HTML)
- `<meta name="robots">` — any `noindex`?
- Canonical tag — self-referencing? Correct URL? No chains?
- HTTP → HTTPS redirect chain?

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
- If WebFetch returned CSS-only: page is **JS-rendered** — flag this. Use `mcp__puppeteer` to extract the full rendered DOM for Phases 4–6.
- JS-rendered pages have slower indexation and are at risk of content not being seen by Googlebot.

---

## Phase 4: On-Page SEO

Extract from the HTML (or puppeteer-rendered DOM if JS-rendered):

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

### Competitor Benchmark (if requested or doing full audit)
Fetch the top 1–2 ranking competitor pages for the target keyword via WebSearch, then WebFetch each:
- Compare title tag, meta description, word count, heading count
- Note what they do that this page doesn't

---

## Phase 5: Schema Markup

⚠️ `WebFetch` and `curl` cannot reliably detect JS-injected schema. Never report "no schema" based on raw HTML alone.

**Always verify using one of these methods (in order of preference):**

1. **validator.schema.org** — validates schema correctness and completeness:
   ```
   WebFetch: https://validator.schema.org/
   ```
   Or search: `site:validator.schema.org [URL]` — paste the page URL into the validator.

2. **Rich Results Test** — checks Google-specific rich result eligibility:
   ```
   WebSearch: https://search.google.com/test/rich-results?url=[URL]
   ```

3. **puppeteer DOM extraction** — if `mcp__puppeteer` is available, extract `<script type="application/ld+json">` from the rendered DOM directly.

Use method 1 or 2 for every audit. Never rely on raw HTML alone.

**Expected schema by page type** — see `references/page-type-signals.md` for full table.

| Page Type | Required | Recommended |
|-----------|----------|-------------|
| PDP | Product, Offer | AggregateRating, BreadcrumbList |
| PLP | ItemList | BreadcrumbList |
| Blog Post | Article/BlogPosting | Person (author), BreadcrumbList |
| Homepage | Organization, WebSite | SiteLinksSearchBox |
| Local Business | LocalBusiness | OpeningHoursSpecification |
| FAQ | FAQPage | Organization |

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
- [ ] Unique product description (not manufacturer boilerplate)
- [ ] Product schema: price, availability, AggregateRating
- [ ] Reviews visible and marked up
- [ ] OOS handling: redirect or schema updated
- [ ] Related products internally linked

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
  "schema": {
    "checkedVia": "...",
    "found": ["<type>"],
    "missing": ["<type>"],
    "recommendation": "..."
  },
  "coreWebVitals": {
    "mobile": { "lcp": "...", "inp": "...", "cls": "...", "fcp": "...", "ttfb": "..." },
    "desktop": { "lcp": "...", "inp": "...", "cls": "..." },
    "topBottleneck": "..."
  },
  "crawlability": {
    "robotsTxt": "...", "sitemap": "...", "canonical": "...",
    "indexation": "...", "redirects": "..."
  },
  "onPage": [{ "element": "...", "finding": "...", "status": "✅ / ⚠️ / ❌" }],
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

## Tool Use Notes

- **WebFetch** — initial page fetch, robots.txt, sitemap.xml
- **curl via Bash** — fallback for JS-rendered pages or bot-blocked responses
- **mcp__puppeteer** — full DOM extraction for SPA/CSR pages; also extracts JS-injected schema
- **Lighthouse via Bash** — primary CWV tool; run `scripts/lighthouse_audit.sh`
- **WebSearch** — PageSpeed Insights fallback, Rich Results Test, competitor SERP research
- **Write** — save audit report to `output/audit_report.md`
- **node generate_docx.js** — convert audit JSON to `.docx` (Phase 8); requires `npm install -g docx`
- Never report schema absent without checking validator.schema.org, Rich Results Test, or puppeteer DOM extraction
- Always report CWV for both mobile and desktop
