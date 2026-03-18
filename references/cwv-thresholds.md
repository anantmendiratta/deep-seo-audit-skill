# Core Web Vitals Thresholds (2024+)

Reference for scoring and reporting Core Web Vitals in audit reports.

## Primary Metrics (Google Ranking Signals)

### Largest Contentful Paint (LCP)
Measures loading performance of the largest visible element.
| Rating | Threshold |
|--------|-----------|
| Good | ≤ 2.5s |
| Needs Improvement | 2.5s – 4.0s |
| Poor | > 4.0s |

**Common LCP elements:** Hero image, H1 heading, large text block, video poster

**Top causes of poor LCP:**
- Unoptimized hero image (no WebP, no preload, no srcset)
- Render-blocking CSS/JS in `<head>`
- Slow TTFB (server response > 800ms)
- Client-side rendering (content not in initial HTML)
- No CDN

---

### Interaction to Next Paint (INP)
Measures responsiveness to ALL user interactions. Replaced FID in March 2024.
| Rating | Threshold |
|--------|-----------|
| Good | < 200ms |
| Needs Improvement | 200ms – 500ms |
| Poor | > 500ms |

**Top causes of poor INP:**
- Long JavaScript tasks (> 50ms blocking the main thread)
- Heavy third-party scripts (analytics, ads, chat widgets, A/B testing)
- Large, unoptimized JS bundles
- No code splitting or lazy loading of non-critical JS

---

### Cumulative Layout Shift (CLS)
Measures visual stability — how much elements shift unexpectedly during load.
| Rating | Threshold |
|--------|-----------|
| Good | < 0.1 |
| Needs Improvement | 0.1 – 0.25 |
| Poor | > 0.25 |

**Top causes of poor CLS:**
- Images without explicit `width` and `height` attributes
- Ads, embeds, iframes without reserved space
- Web fonts causing FOIT/FOUT (Flash of Invisible/Unstyled Text)
- Dynamically injected banners or modals above existing content
- Animations that affect layout (avoid `top`, `left`, `margin` — use `transform`)

---

## Supporting Metrics

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **First Contentful Paint (FCP)** | ≤ 1.8s | 1.8s – 3.0s | > 3.0s |
| **Time to First Byte (TTFB)** | ≤ 800ms | 800ms – 1800ms | > 1800ms |
| **Total Blocking Time (TBT)** | ≤ 200ms | 200ms – 600ms | > 600ms |
| **Speed Index** | ≤ 3.4s (mobile) | — | — |

---

## How to Access PageSpeed Data

Use `web_search` to fetch (cannot be retrieved with `web_fetch` — requires JS rendering):
```
https://pagespeed.web.dev/analysis?url=[URL]
```

Always test **both mobile and desktop**. Google uses mobile for ranking (mobile-first indexing).

## Reporting Format

In audit reports, format CWV findings as:
```
### Core Web Vitals (Mobile)
- LCP: Xs — [Good / Needs Improvement / Poor]
- INP: Xms — [Good / Needs Improvement / Poor]
- CLS: X.XX — [Good / Needs Improvement / Poor]
- FCP: Xs | TTFB: Xms

### Core Web Vitals (Desktop)
- LCP: Xs — [Good / Needs Improvement / Poor]
- INP: Xms — [Good / Needs Improvement / Poor]
- CLS: X.XX — [Good / Needs Improvement / Poor]
```
