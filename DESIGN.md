# UI — Style Reference
> Clinical blueprint on frosted paper

**Theme:** Light

shadcn/ui monochromatic design-system workshop: pure white canvas, soft warm-gray surfaces, and large-radius cards floating on hairline borders. The interface is almost entirely achromatic — black text, white surfaces, gray secondary tones — with a single destructive red reserved for error states and nothing else. Typography leans on Geist's geometric neutrality with tight letter-spacing on display sizes, creating a quiet, code-adjacent feel that reads as developer infrastructure rather than consumer product.

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas | `#f5f5f5` | `--color-canvas` | Page background, muted surface fills, secondary buttons |
| Paper | `#ffffff` | `--color-paper` | Card surfaces, popover backgrounds, primary button fills |
| Surface Alt | `#fafafa` | `--color-surface-alt` | Sidebar background, subtle card variant, input resting state |
| Ink | `#0a0a0a` | `--color-ink` | Primary text, headings, button labels, icon strokes |
| Ink Soft | `#171717` | `--color-ink-soft` | Filled button backgrounds, secondary text on light surfaces |
| Mid Gray | `#737373` | `--color-mid-gray` | Muted body text, placeholder text, helper labels, icon fills at rest |
| Hairline | `#e5e5e5` | `--color-hairline` | Borders, input outlines, card edges, badge outlines |
| Ember | `#e7000b` | `--color-ember` | Red decorative accent for icons, marks, and small graphic details. Use as a supporting accent, not as a status color |

---

## Tokens — Typography

### Geist — All interface text
- **Substitute:** Inter
- **Weights:** 400, 500, 600
- **Sizes:** 12, 13, 14, 16, 18, 24, 30, 36, 48
- **Line height:** 1.10, 1.11, 1.20, 1.33, 1.43, 1.50, 1.56, 1.63, 2.00
- **Letter spacing:** -0.0500em at display (48px), -0.0250em at subheading (24–30px), 0.0500em at caption (12px uppercase). Tracking tightens aggressively at large sizes and loosens slightly at small uppercase labels.
- **OpenType features:** `"ss01" on, "cv11" on`
- **Role:** All interface text — body at 14px/400, headings ranging 24–48px/600, buttons at 13–14px/500. Geist's geometric letterforms and uniform stroke width create a developer-tool neutrality; weight 600 at 48px with -0.05em tracking produces tight, confident display headlines that feel engineered rather than editorial.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.33 | 0.6px | `--text-caption` |
| body | 14px | 1.43 | — | `--text-body` |
| body-lg | 16px | 1.5 | — | `--text-body-lg` |
| subheading | 18px | 1.56 | — | `--text-subheading` |
| heading-sm | 24px | 1.33 | -0.6px | `--text-heading-sm` |
| heading | 30px | 1.2 | -0.75px | `--text-heading` |
| heading-lg | 36px | 1.11 | -0.9px | `--text-heading-lg` |
| display | 48px | 1.1 | -2.4px | `--text-display` |

---

## Tokens — Spacing & Shapes

**Base unit:** 4px  
**Density:** compact

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 48 | 48px | `--spacing-48` |

### Border Radius

| Element | Value | Role |
|---------|-------|------|
| cards | 24px | Primary containers, preview cards, dashboard panels |
| small | 6px | Fine details, inner indicators |
| badges | 18px | Pill status tags, counter labels |
| inputs | 18px | Pill text fields, search bars |
| nested | 10px | Elements inside cards |
| buttons | 18px | Pill action buttons |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| subtle | `oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | `--shadow-subtle` |
| subtle-2 | `lab(2.75381 0 0) 0px 0px 0px 0px` | `--shadow-subtle-2` |

### Layout

- **Page max-width:** 1280px
- **Section gap:** 48–80px
- **Card padding:** 20px
- **Element gap:** 8px

---

## Components

### Primary Filled Button
- **Role:** High-emphasis action (Submit, Save, Create)
- Background `#0a0a0a`, text `#fafafa`, border none, radius `18px`, padding `0px 12px` (compact) or `8px 16px` (comfortable), font `14px` Geist weight `500`. Height ≈ 36–40px. Fully rounded pill geometry with tonal contrast.

### Secondary Ghost Button
- **Role:** Low-emphasis action (Cancel, Back)
- Background `#f5f5f5`, text `#0a0a0a`, no border, radius `18px`, padding `0px 12px` or `8px 16px`, font `14px` weight `500`.

### Outline Button
- **Role:** Tertiary action with visible boundary
- Background transparent, text `#0a0a0a`, border `1px solid #e5e5e5`, radius `18px`, padding `0px 12px` or `8px 10px`.

### Card
- **Role:** Content container for blocks, previews, dashboard panels
- Background `#ffffff`, radius `24px`, border `1px solid #e5e5e5`, shadow subtle, padding `20px`.

### Nested Card Header/Footer
- **Role:** Header or footer strip inside a card
- Asymmetric radius — top corners `24px` on header, bottom corners `24px` on footer. Padding `20px` horizontal, transparent fill.

### Input Field
- **Role:** Text entry, search, form controls
- Background `#f5f5f5` (resting) or transparent (inline), text `#0a0a0a`, placeholder `#737373`, border none at rest with `1px #e5e5e5` on focus, radius `18px`, padding `8px 10px`, font `14px` weight `400`.

### Badge — Solid
- Background `#171717`, text `#fafafa`, radius `18px`, padding `2px 8px`, font `12px` weight `500`.

### Badge — Soft
- Background `#f5f5f5`, text `#171717`, radius `18px`, padding `2px 8px`, font `12px` weight `500`.

### Badge — Outline
- Transparent background, text `#0a0a0a`, border `1px solid #e5e5e5`, radius `18px`, padding `2px 8px`.

### Sidebar Surface
- Background `#fafafa`, full-height, contained width. Sits one tonal step off the canvas (`#f5f5f5`).

### Breadcrumb Trail
- Inline text with chevron separators, font `14px` weight `400`, color `#737373` for separators and `#0a0a0a` for current segment. No background, no borders.

### Stat Block
- Label in `12–14px` uppercase `#737373`, value in `30–48px` weight `600` `#0a0a0a` with tight tracking. Typography-first.

### Search Trigger
- Background `#f5f5f5`, text `#737373`, radius `18px`, padding `8px 10px`, right-aligned keyboard shortcut (`⌘K`).

### Destructive Action
- Text or icon in `#e7000b` against the monochromatic palette. Reserved exclusively for destructive or error contexts.

---

## Do's and Don'ts

### Do
- Use `#0a0a0a` on `#ffffff` for filled buttons.
- Maintain `18px` radius on all buttons, inputs, and badges; `24px` radius only on cards.
- Set display headlines at `48px/600` with `-0.0500em` tracking.
- Reserve `#e7000b` exclusively for destructive states.
- Stack card shadows with 1px hairline border + subtle elevation.
- Use the 3-tone surface stack: Canvas (`#f5f5f5`) → Sidebar/Alt (`#fafafa`) → Card/Paper (`#ffffff`).

### Don't
- Do not introduce chromatic brand colors beyond `#e7000b`.
- Do not use arbitrary border-radius values (avoid square corners).
- Do not skip the `1px hairline border` on cards.
- Do not apply gradients, colored shadows, or decorative accent fills.
