# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Claude Code skill (`SKILL.md`) that performs expert-level technical SEO audits for any URL. The skill auto-detects page type (PDP, PLP, blog, landing page, homepage, local business, SaaS) and tailors its audit accordingly.

## Skill Structure

```
deep-seo-audit-skill/
├── SKILL.md          # The skill definition — frontmatter + audit instructions
└── evals/
    └── evals.json    # Test cases for evaluating skill quality
```

## Developing the Skill

This skill follows the [skill-creator framework](https://github.com/anthropics/skills/tree/main/skills/skill-creator).

**To test the skill locally**, use the skill-creator eval loop:
1. Run test prompts from `evals/evals.json` with the skill loaded
2. Run baseline runs (same prompts, no skill)
3. Compare outputs using the eval-viewer

**To iterate on the skill**, edit `SKILL.md` directly. The key sections to tune:
- Frontmatter `description` — controls when the skill triggers
- Phase order and checklist items — controls audit depth
- Output format template — controls report structure

## Key Design Decisions

- **Page type detection is Phase 1** — every recommendation is framed around the detected page type (PDP, PLP, blog, etc.)
- **Schema checking always uses Rich Results Test** — `web_fetch` cannot see JS-injected schema; the skill explicitly instructs using `web_search` to access the Google Rich Results Test URL
- **Core Web Vitals checked via PageSpeed Insights** — accessed via `web_search` since it requires JavaScript rendering
- **Priority hierarchy:** Crawlability → Technical → On-Page → Content → E-E-A-T

## Audit Phases (in order)

1. Page type detection
2. Crawlability & indexation (robots.txt, sitemap, canonical, noindex)
3. Technical SEO (HTTPS, URL quality, Core Web Vitals, mobile)
4. On-page SEO (title, meta, headings, content, images, internal links)
5. Schema markup (via Rich Results Test)
6. E-E-A-T & content quality
7. Page-type-specific checks
