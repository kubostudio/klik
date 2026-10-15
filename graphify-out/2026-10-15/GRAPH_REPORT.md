# Graph Report - klik  (2026-10-15)

## Corpus Check
- 79 files · ~96,143 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .scss 12, .ico 2, .example 1)

## Summary
- 395 nodes · 1004 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c576e171`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Core App Layout & Static Pages
- Analytics & Customer CRM
- Store Settings & Product Management
- Storefront & WhatsApp Checkout
- Shared UI & Supabase Client
- Subscriptions & Billing Providers
- TypeScript Compiler Config
- Instagram Profile Importer
- PWA Manifest Config
- Orders Dashboard & Notifications
- Package Dependencies
- External Product Scraper API
- Brand Assets & Payment Integrations
- Next.js Build Config
- Monochromatic Design Tokens
- PWA Service Worker

## God Nodes (most connected - your core abstractions)
1. `next` - 36 edges
2. `react` - 31 edges
3. `formatCurrency()` - 30 edges
4. `lucide-react` - 30 edges
5. `getCurrentStore()` - 23 edges
6. `Logo()` - 21 edges
7. `useDashboard()` - 19 edges
8. `getStoreBySlug()` - 18 edges
9. `createStore()` - 15 edges
10. `getOrders()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `WhatsApp Order Flow & Checkout` --references--> `Plin Payment Badge`  [INFERRED]
  README.md → public/icons/plin.png
- `WhatsApp Order Flow & Checkout` --references--> `Yape Payment Badge`  [INFERRED]
  README.md → public/icons/yape.png
- `Social OpenGraph Banner` --references--> `Klik WhatsApp Ecommerce Architecture`  [INFERRED]
  app/opengraph-image.png → README.md
- `Klik Brand Vector Logo` --references--> `Klik WhatsApp Ecommerce Architecture`  [INFERRED]
  public/logo-klik.png → README.md
- `Order Notification Sound System` --conceptually_related_to--> `WhatsApp Order Flow & Checkout`  [INFERRED]
  public/sounds/README.txt → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **WhatsApp Checkout & Local Mobile Payments** — readme_whatsapp_order_flow, public_icons_yape_badge, public_icons_plin_badge [INFERRED 0.85]

## Communities (17 total, 3 thin omitted)

### Community 0 - "Core App Layout & Static Pages"
Cohesion: 0.06
Nodes (40): CookiesPage(), metadata, DashboardLayout(), DashboardLayoutInner(), inter, jsonLd, metadata, RootLayout() (+32 more)

### Community 1 - "Analytics & Customer CRM"
Cohesion: 0.10
Nodes (46): POST(), AnalyticsDashboardPage(), loadAnalytics(), CustomersDashboardPage(), loadData(), STATUS_LABELS, FollowUpsDashboardPage(), loadData() (+38 more)

### Community 2 - "Store Settings & Product Management"
Cohesion: 0.08
Nodes (43): POST(), ProductsDashboardPage(), BANKS, generateId(), SettingsContent(), loadSettings(), SettingsDashboardPage(), OnboardingPage() (+35 more)

### Community 3 - "Storefront & WhatsApp Checkout"
Cohesion: 0.10
Nodes (30): CartPage(), CheckoutPage(), loadStore(), copyToClipboard(), PERU_DEPARTMENTS, StoreLayout(), OrderConfirmationPage(), loadData() (+22 more)

### Community 4 - "Shared UI & Supabase Client"
Cohesion: 0.05
Nodes (35): NextArrow(), PrevArrow(), ProductCarousel(), ProductCarouselProps, createClient(), devDependencies, potrace, @types/canvas-confetti (+27 more)

### Community 5 - "Subscriptions & Billing Providers"
Cohesion: 0.13
Nodes (7): BillingProvider, billingService, CulqiBillingAdapter, SubscriptionStatus, PLAN_CONFIG, PLAN_FEATURES, PlanType

### Community 6 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 7 - "Instagram Profile Importer"
Cohesion: 0.17
Nodes (13): cleanUsername(), dynamic, extractCity(), extractWhatsApp(), fetchFromRapidApi(), PERUVIAN_CITIES, POST(), supabaseAdmin (+5 more)

### Community 8 - "PWA Manifest Config"
Cohesion: 0.13
Nodes (14): background_color, categories, description, display, display_override, icons, id, name (+6 more)

### Community 9 - "Orders Dashboard & Notifications"
Cohesion: 0.32
Nodes (9): FILTER_TABS, OrdersDashboardPage(), STATUS_CONFIG, updateOrderStatus(), formatDateTime(), buildSellerContactWhatsAppUrl(), getOrderStatusMessageText(), getStatusWhatsAppActionLabel() (+1 more)

### Community 10 - "Package Dependencies"
Cohesion: 0.17
Nodes (12): dependencies, canvas-confetti, geist, lucide-react, next, react, react-dom, react-slick (+4 more)

### Community 11 - "External Product Scraper API"
Cohesion: 0.46
Nodes (7): cleanPrice(), decodeHtmlEntities(), ExtractedProduct, isValidPublicUrl(), POST(), stripHtml(), toAbsoluteUrl()

### Community 12 - "Brand Assets & Payment Integrations"
Cohesion: 0.29
Nodes (7): Social OpenGraph Banner, Plin Payment Badge, Yape Payment Badge, Klik Brand Vector Logo, Order Notification Sound System, Klik WhatsApp Ecommerce Architecture, WhatsApp Order Flow & Checkout

### Community 13 - "Next.js Build Config"
Cohesion: 0.29
Nodes (3): __dirname, __filename, nextConfig

## Knowledge Gaps
- **18 isolated node(s):** `RFC-5322`, `geist`, `react-dom`, `sass`, `@types/canvas-confetti` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 150 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Core App Layout & Static Pages` to `Analytics & Customer CRM`, `Store Settings & Product Management`, `Storefront & WhatsApp Checkout`, `Shared UI & Supabase Client`, `Subscriptions & Billing Providers`, `Instagram Profile Importer`, `External Product Scraper API`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **What connects `RFC-5322`, `geist`, `react-dom` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App Layout & Static Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06277665995975855 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Core App Layout & Static Pages` to `Analytics & Customer CRM`, `Store Settings & Product Management`, `Storefront & WhatsApp Checkout`, `Shared UI & Supabase Client`, `Orders Dashboard & Notifications`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `Analytics & Customer CRM` be split into smaller, more focused modules?**
  _Cohesion score 0.09935064935064936 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Core App Layout & Static Pages` to `Analytics & Customer CRM`, `Store Settings & Product Management`, `Storefront & WhatsApp Checkout`, `Shared UI & Supabase Client`, `Orders Dashboard & Notifications`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `Store Settings & Product Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07922077922077922 - nodes in this community are weakly interconnected._