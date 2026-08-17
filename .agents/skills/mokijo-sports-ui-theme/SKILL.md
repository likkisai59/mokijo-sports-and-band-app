---
name: mokijo-sports-ui-theme
description: Enforces Mokijo Sports UI/UX design standards across all modules, ensuring consistent light canvas (#f7f7f8), electric lime (#c6ff3d) action accents, elevated pure white cards, high-contrast typography, and fluid responsive layouts.
---

# Mokijo Sports UI Design System & Aesthetic Standard

## Purpose & Scope
This skill provides the comprehensive design system, design tokens, layout patterns, and component rules required to ensure that any interface (Mokijo Sports or BandConnect) looks 100% consistent with the **Mokijo Sports Visual Identity**.

---

## 🎨 1. Core Color Palette & Design Tokens

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#f7f7f8` / `#f8fafc` | Page canvas, outer dashboard background |
| **Surface Card** | `#ffffff` | Elevated cards, forms, modals, tables |
| **Card Border** | `border-slate-200/80` or `rgba(10,10,15,0.08)` | Subtle card outlines and divider borders |
| **Primary Accent** | `#c6ff3d` / `#b8f52e` | Primary CTA buttons, active sidebar pills, focus rings |
| **Accent Glow** | `rgba(198, 255, 61, 0.12)` | Ambient radial glow in page headers & banners |
| **Primary Text** | `#0a0a0f` / `#0f172a` | High-contrast headings, main metric values |
| **Secondary Text** | `#5c5c66` / `#64748b` | Subtitles, body descriptions, table headers |
| **Success / Verified**| `bg-emerald-50 text-emerald-700` | Verified status badges, positive KPI trends |
| **Pending Review** | `bg-amber-50 text-amber-700` | Moderation, pending verification badges |

---

## 📐 2. Spatial Rhythm & Layout Architecture

### Container Widths & Responsiveness
- **Main Dashboard Shell**: `max-w-[1600px] w-full min-w-0 mx-auto` with responsive padding (`p-4 sm:p-6 lg:p-8`).
- **Sidebar Offset**: `md:pl-64` with fixed sidebar `w-64 z-30`.
- **Zero Horizontal Overflow**: Always set `overflow-x-hidden` on main layout containers and `min-w-0` on flex/grid children.

### 12-Column Responsive Workspace Pattern
- **Desktop (`≥ 1280px / xl`)**:
  - Left Primary Workspace: `xl:col-span-8` (~66.7% width).
  - Right Summary / Wallet / Specs Panel: `xl:col-span-4` (~33.3% width).
- **Tablet (`768px – 1279px / md to lg`)**:
  - Full-width stacked columns (`grid-cols-1`). Left workspace above, right details panel below with internal 2-column grid.
- **Mobile (`< 768px`)**:
  - Single column stacked layout. Action buttons scale to full width (`w-full sm:w-auto`).

---

## 🧱 3. Component Design Rules

### A. Elevated Surface Cards
```jsx
<div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
  {/* Card Content */}
</div>
```

### B. Primary Action Triggers (Electric Lime)
```jsx
<Button className="h-10 rounded-xl bg-[#c6ff3d] hover:bg-[#b8f52e] text-slate-950 font-extrabold text-xs px-5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-black/5">
  Action Label
</Button>
```

### C. Status & Identity Badges
```jsx
{/* Verified Badge */}
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
  Verified & Live
</span>

{/* Unique ID Badge */}
<button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors">
  BCV-000104
</button>
```

### D. KPI Stat Cards (4-Grid Standard)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Metric Title</span>
      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="mt-4">
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Value</div>
    </div>
  </div>
</div>
```

---

## 🚫 4. Anti-Patterns to Avoid

1. **Avoid Hardcoded Narrow Containers**: Never cap dashboard content with arbitrary small max-widths like `max-w-4xl` or `max-w-5xl` when a sidebar is present.
2. **Avoid Raw Stark Contrast**: Do not place pitch-black solid cards next to white cards without proper radius, padding, and lighting hierarchy.
3. **Avoid Unpadded Neon Elements**: Always pair `#c6ff3d` with dark slate text (`text-slate-950`), subtle borders, and smooth hover scaling.
4. **Prevent Text Collision**: Never shrink typography excessively to make elements fit; transition to a stacked responsive layout instead.
