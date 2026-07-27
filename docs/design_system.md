# Design System Specifications & Tokens

This document details the complete production design system specifications for **BandConnect**, matching the theme, typography, spacing, layouts, and accessibility requirements defined in `MASTER.md`.

---

## 1. Color Palette Tokens

The colors map the custom dark-mode theme specified in Section 13.1 of `MASTER.md`:

| Token | Class / CSS Variable | HEX Value | Usage |
|-------|---------------------|-----------|-------|
| **Primary** | `--color-primary` / `bg-primary` | `#FF6B35` | Main CTAs, logo highlights, focus indices |
| **Primary Hover** | `--color-primary-hover` / `hover:bg-primary-hover` | `#E85A25` | Active hover states of buttons |
| **Secondary** | `--color-secondary` / `bg-secondary` | `#1DB954` | Success status labels, complete workflow tags |
| **Accent** | `--color-accent` / `bg-accent` | `#FFD700` | Stars ratings, premium performer badges |
| **Background Primary** | `--color-bg-primary` / `bg-bg-primary` | `#0A0A0F` | Outer viewport background |
| **Card Background** | `--color-bg-card` / `bg-bg-card` | `#12121A` | Inner cards body background |
| **Elevated Surface** | `--color-bg-elevated` / `bg-bg-elevated` | `#1A1A28` | Dialogs and dropdown items background |
| **Borders** | `--color-border` / `border-border` | `#2A2A3A` | Dividers, container boundaries |
| **Text Primary** | `--color-text-primary` / `text-text-primary` | `#F0F0F5` | Main content readability |
| **Text Secondary** | `--color-text-secondary` / `text-text-secondary` | `#8888AA` | Descriptions, metadata labels |
| **Text Muted** | `--color-text-muted` / `text-text-muted` | `#555570` | Placeholders, inactive links |

---

## 2. Typography & Fonts

### 2.1 Font Families
- **Headings & Accents**: `Syne` (loaded via `next/font/google`). Gives a stylized, modern entertainment-industry feel.
- **Body & Labels**: `Inter` (loaded via `next/font/google`). Enforces standard readability.
- **Code & IDs**: `JetBrains Mono`. Used for displaying database key UUIDs or syntax indicators.

### 2.2 Sizing Scale
- `text-xs`: 12px (Captions, metadata labels)
- `text-sm`: 14px (Secondary buttons text, inputs placeholders)
- `text-base`: 16px (Body paragraphs readability)
- `text-lg`: 18px (Card labels/descriptions)
- `text-xl`: 20px (Card titles, section headings)
- `text-2xl`: 24px (Sub-module section headers)
- `text-3xl`: 30px (Main page headers)
- `text-4xl`: 36px (Hero headers, landing CTAs)

---

## 3. Spacing System (4px base)

Spacing follows a consistent layout scale based on standard tailwind margins and paddings:

- `space-1` (4px): Tight inner labels offsets.
- `space-2` (8px): Inputs inner padding, small buttons gap.
- `space-4` (16px): Card inner padding, list grids spacing.
- `space-6` (24px): Page headers gap, section margin.
- `space-8` (32px): Dashboard layouts container borders margin.

---

## 4. Reusable Layouts & Grid Structures

### 4.1 Responsive Viewport Grid
Use tailwind screen sizes to progressive enhancement structures:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Elements render as single columns on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### 4.2 Glassmorphism Panels
Apply standard backdrop blurs using CSS utilities:
- `glass-card`: blur offsets with low opacity border values.
- `glass-panel`: navbar navigation banners backdrop blurs.

---

## 5. Accessibility Guidelines (WCAG 2.1 Level AA)

- **Keyboard Focus**: Never hide focus outlines. Inputs and button indicators are explicitly configured with active highlight colors:
  `focus-visible:ring-2 focus-visible:ring-primary/50`
- **Labels Mapping**: Every text input contains a matching `<Label htmlFor="...">` mapping to prevent form validation failures.
- **Color Contrast**: Important text elements use `#F0F0F5` against `#0A0A0F` base (contrast ratio exceeds 7:1).
