# Deep SEO Audit Skill

A Claude Code skill that performs expert-level technical SEO audits for any URL — from a 2-minute focused check to a full 7-phase deep audit.

**Created by [Anant Mendiratta](https://github.com/anantmendiratta) and [Claude Code](https://claude.ai/code)**

---

## What It Does

Drop any URL into Claude Code and get a structured SEO audit tailored to the page type. The skill auto-detects whether a page is a product detail page, blog post, homepage, local business, SaaS page, or SPA — and adjusts every recommendation accordingly.

**Audit phases:**
1. **Scope check** — quick check or full audit, based on what you ask
2. **Crawlability & indexation** — robots.txt, sitemap, canonical tags, noindex signals
3. **Core Web Vitals** — real Lighthouse scores (LCP, INP, CLS, FCP, TTFB) for mobile and desktop
4. **On-page SEO** — title tag, meta description, headings, content depth, images, internal links
5. **Schema markup** — validated via validator.schema.org or Google Rich Results Test
6. **E-E-A-T & content quality** — people-first signals, author credentials, trust signals
7. **Page-type-specific checks** — PDP, PLP, blog, landing page, homepage, local business, SaaS

## Usage

```
/deep-seo-audit
```

Then give it a URL:

```
Can you do a full SEO audit on https://example.com/products/my-product?
```

Or a focused check:

```
Just check the title tag and meta description on https://example.com
```

## Features

- **JS-rendered pages** — falls back to `curl` + `mcp__puppeteer` when `WebFetch` returns CSS-only content
- **Real CWV scores** — runs `scripts/lighthouse_audit.sh` for actual Lighthouse lab data
- **Schema verification** — uses validator.schema.org or Rich Results Test, never raw HTML alone
- **People-first framework** — applies Google's helpful content guidelines (Who/How/Why) in E-E-A-T phase
- **Structured output** — Critical / High / Medium / Quick Wins / What's Working

## Repository Structure

```
deep-seo-audit-skill/
├── SKILL.md                          # Skill definition and audit instructions
├── scripts/
│   └── lighthouse_audit.sh           # Lighthouse CLI runner for CWV
├── references/
│   ├── page-type-signals.md          # URL patterns and schema by page type
│   ├── cwv-thresholds.md             # CWV thresholds and scoring
│   ├── eeat-checklist.md             # E-E-A-T + YMYL checklist
│   └── google-helpful-content.md     # Google's helpful content guidelines
└── assets/
    └── report-template.md            # Audit report output template
```

## Requirements

- [Claude Code](https://claude.ai/code)
- Lighthouse CLI (optional, for real CWV scores): `npm install -g lighthouse`
- Puppeteer MCP (optional, for JS-rendered pages): `claude mcp add puppeteer npx -- -y @modelcontextprotocol/server-puppeteer`

## Eval Results

Tested across 5 eval types (quick check, local business, blog, PDP, SPA) against a no-skill baseline:

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
