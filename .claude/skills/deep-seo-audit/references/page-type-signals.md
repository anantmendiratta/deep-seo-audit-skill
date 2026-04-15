# Page Type Detection Reference

Use this reference to classify a URL before running the audit. Page type determines which schema to expect, which checklist to run, and how to frame recommendations.

## Detection Signals

| Page Type | URL Patterns | Content Signals |
|-----------|-------------|-----------------|
| **Product Detail Page (PDP)** | `/products/`, `/p/`, `/item/`, `/dp/` (Amazon), SKU in URL | Price, Add to Cart button, product images, size/color selectors |
| **Product Listing Page (PLP) / Category** | `/category/`, `/collection/`, `/shop/`, `/c/` | Grid of product cards, filters/facets sidebar, sort controls |
| **Blog Post / Article** | `/blog/`, `/post/`, `/article/`, `/news/`, date in URL | Author byline, publish date, long-form body text, related posts |
| **Homepage** | Root domain `/` or `/?` | Brand name prominent, primary navigation hub, multiple CTAs |
| **Landing Page** | `/lp/`, `/landing/`, UTM params common, no-nav layout | Single CTA, minimal header/footer, campaign-specific copy |
| **Service Page** | `/services/`, `/solutions/`, `/[service-name]/` | Service description, testimonials, contact/quote CTA |
| **Local Business Page** | `/location/`, `/locations/`, city/neighborhood in URL | Address, phone, hours, map embed |
| **SaaS Feature Page** | `/features/`, `/product/[feature]`, `/platform/` | Feature description, screenshot/demo, pricing CTA |
| **Pricing Page** | `/pricing/`, `/plans/` | Tier comparison table, feature lists, monthly/annual toggle |
| **FAQ / Support** | `/faq/`, `/help/`, `/support/`, `/kb/` | Q&A accordion format, search bar |
| **About / Company** | `/about/`, `/about-us/`, `/company/` | Team photos, mission statement, founding story |

## Schema Expected by Page Type

| Page Type | Required Schema | Recommended Additional |
|-----------|----------------|----------------------|
| PDP | Product, Offer | AggregateRating, Review, Brand, BreadcrumbList |
| PDP (multi-variant) | ProductGroup, Product | AggregateRating |
| PLP / Category | ItemList | BreadcrumbList, CollectionPage |
| Blog Post | Article or BlogPosting | Person (author), BreadcrumbList, Organization |
| Homepage | Organization, WebSite | SiteLinksSearchBox |
| Landing Page | WebPage | Organization |
| Service Page | Service | Organization, AggregateRating, Offer |
| Local Business | LocalBusiness, PostalAddress | OpeningHoursSpecification, AggregateRating |
| Pricing Page | WebPage | Offer |
| FAQ | FAQPage, Question | Organization |
| About | Organization | Person |

## Intent Classification

| Page Type | Primary Search Intent | Example Queries |
|-----------|----------------------|-----------------|
| PDP | Transactional | "buy [product]", "[product] price" |
| PLP | Commercial Investigation | "best [category]", "[category] shop" |
| Blog Post | Informational | "how to [X]", "what is [X]" |
| Homepage | Navigational | "[brand name]" |
| Landing Page | Transactional | "[offer/campaign]" |
| Service Page | Commercial Investigation | "[service] near me", "[service] company" |
| Local Business | Local / Navigational | "[business] [city]", "[service] near me" |
| FAQ | Informational | "how do I [X]", "what is [X]" |
