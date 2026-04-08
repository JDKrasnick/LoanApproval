# LoanApproval — Frontend Design Specification

> **Reference this document when building any UI element.** All component variants, color values, spacing, and page layouts are defined here. Do not deviate without updating this spec first.

**Stack:** Next.js 14 (App Router) + Tailwind CSS
**Last updated:** 2026-03-24
**Surfaces:** Borrower Portal (public) · Lender Dashboard (internal)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)

2. [Color System](#2-color-system)

3. [Typography](#3-typography)

4. [Spacing & Sizing](#4-spacing--sizing)

5. [Responsive Breakpoints](#5-responsive-breakpoints)

6. [Design Tokens (Tailwind Config)](#6-design-tokens-tailwind-config)

7. [Component Library](#7-component-library)

8. [Navigation Structure](#8-navigation-structure)

9. [Page Layouts — Borrower Portal](#9-page-layouts--borrower-portal)

10. [Page Layouts — Lender Dashboard](#10-page-layouts--lender-dashboard)

11. [State Design](#11-state-design)

12. [Data Visualization](#12-data-visualization)

13. [Dark Mode](#13-dark-mode)

14. [Accessibility](#14-accessibility)

15. [Pre-Delivery Checklist](#15-pre-delivery-checklist)

---

## 1. Design Philosophy

**Aesthetic:** Brex / Ramp / Mercury — professional, data-dense, trustworthy. Clean surfaces, precise typography, no unnecessary decoration.

**Principles:**

- **Trust over delight** — users are submitting sensitive financial data. Clarity and confidence trump animation.

- **Data density without clutter** — the lender dashboard surfaces a lot of numbers. Use whitespace and typographic hierarchy, not color chaos.

- **Status at a glance** — every deal/application status must be immediately readable via badge color + label. Never rely on color alone.

- **Progressive disclosure** — complex financial forms are broken into steps. Don't overwhelm borrowers.

**Style:** Minimal with strategic glassmorphism on modal overlays and sidebar panels only. Flat cards with subtle shadows as the default surface. No gradients on data surfaces.

---

## 2. Color System

### 2.1 Primitive Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `navy-950` | `#060F2A` | — | Darkest bg (dark mode page) |
| `navy-900` | `#0F172A` | `slate-900` | Dark bg, sidebar |
| `navy-800` | `#1E293B` | `slate-800` | Dark surface card |
| `navy-700` | `#1E3A8A` | `blue-900` | Primary brand |
| `navy-600` | `#1D4ED8` | `blue-700` | Interactive primary |
| `navy-500` | `#3B82F6` | `blue-500` | Links, accents |
| `navy-100` | `#DBEAFE` | `blue-100` | Light tints |
| `gray-50`  | `#F8FAFC` | `slate-50` | Page bg (light mode) |
| `gray-100` | `#F1F5F9` | `slate-100` | Surface bg |
| `gray-200` | `#E2E8F0` | `slate-200` | Borders |
| `gray-400` | `#94A3B8` | `slate-400` | Placeholder, muted |
| `gray-600` | `#475569` | `slate-600` | Secondary text |
| `gray-900` | `#0F172A` | `slate-900` | Primary text (light mode) |

### 2.2 Semantic Colors

These are the **only** colors that encode meaning. Use them consistently.

| Semantic | Hex (light) | Hex (dark) | Tailwind class | Use case |
|----------|-------------|------------|----------------|----------|
| **Approved / Success** | `#10B981` | `#34D399` | `emerald-500/400` | Approved deals, success toasts, positive metrics |
| **Declined / Error** | `#EF4444` | `#F87171` | `red-500/400` | Declined, validation errors, destructive actions |
| **In Review / Warning** | `#F59E0B` | `#FBBF24` | `amber-500/400` | Manual review, pending states, warnings |
| **Funded / Special** | `#8B5CF6` | `#A78BFA` | `violet-500/400` | Funded/completed deals, AI features |
| **New / Neutral** | `#6B7280` | `#9CA3AF` | `gray-500/400` | New/unreviewed applications |
| **Info** | `#3B82F6` | `#60A5FA` | `blue-500/400` | Informational banners, tooltips |
| **In Progress** | `#0EA5E9` | `#38BDF8` | `sky-500/400` | In-progress steps, active pipeline stage |

### 2.3 Deal Status Color Map

| Status | Badge bg | Badge text | Dot color |
|--------|----------|------------|-----------|
| New | `bg-gray-100` | `text-gray-700` | `bg-gray-400` |
| In Review | `bg-amber-50` | `text-amber-700` | `bg-amber-400` |
| Approved | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-500` |
| Funded | `bg-violet-50` | `text-violet-700` | `bg-violet-500` |
| Declined | `bg-red-50` | `text-red-700` | `bg-red-500` |

*Dark mode: swap `50` bg to `950`, bump text one shade lighter.*

### 2.4 Background Layers (Light Mode)

```text
Page         →  bg-slate-50       (#F8FAFC)
Card/Surface →  bg-white           (#FFFFFF)
Elevated     →  bg-white + shadow-md
Sidebar      →  bg-white border-r border-slate-200
Table row    →  bg-white / hover:bg-slate-50
Table header →  bg-slate-50

```text

### 2.5 Background Layers (Dark Mode)

```text
Page         →  bg-slate-950      (#060F2A — custom)
Card/Surface →  bg-slate-900      (#0F172A)
Elevated     →  bg-slate-800      (#1E293B)
Sidebar      →  bg-slate-900 border-r border-slate-800
Table row    →  bg-slate-900 / hover:bg-slate-800
Table header →  bg-slate-950

```css

---

## 3. Typography

### 3.1 Font Family

**Primary:** IBM Plex Sans — financial, trustworthy, corporate, highly legible at small sizes.

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
}

```css

**Mono (for financial figures, IDs, code):** IBM Plex Mono

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

.font-mono { font-family: 'IBM Plex Mono', 'Fira Code', monospace; }

```text

### 3.2 Type Scale

| Name | Size | Line-height | Weight | Tailwind | Use |
|------|------|------------|--------|----------|-----|
| `display` | 48px | 1.1 | 700 | `text-5xl font-bold` | Hero headlines only |
| `h1` | 36px | 1.2 | 700 | `text-4xl font-bold` | Page titles |
| `h2` | 30px | 1.25 | 600 | `text-3xl font-semibold` | Section headers |
| `h3` | 24px | 1.3 | 600 | `text-2xl font-semibold` | Card titles, modal headers |
| `h4` | 20px | 1.35 | 600 | `text-xl font-semibold` | Sub-section labels |
| `h5` | 18px | 1.4 | 500 | `text-lg font-medium` | Field group headers |
| `body-lg` | 18px | 1.6 | 400 | `text-lg` | Lede text, hero subhead |
| `body` | 16px | 1.6 | 400 | `text-base` | Default body text |
| `body-sm` | 14px | 1.5 | 400 | `text-sm` | Form labels, table cells |
| `caption` | 12px | 1.4 | 400 | `text-xs` | Helper text, timestamps |
| `label` | 12px | 1.4 | 500 | `text-xs font-medium uppercase tracking-wide` | Form field labels |
| `metric` | 36px | 1 | 700 | `text-4xl font-bold font-mono` | Dashboard KPI numbers |
| `metric-sm` | 24px | 1 | 600 | `text-2xl font-semibold font-mono` | Smaller metrics |

### 3.3 Text Colors

| Context | Light | Dark |
|---------|-------|------|
| Primary text | `text-slate-900` | `text-slate-50` |
| Secondary text | `text-slate-600` | `text-slate-400` |
| Muted / placeholder | `text-slate-400` | `text-slate-500` |
| Links | `text-blue-600` | `text-blue-400` |
| Danger | `text-red-600` | `text-red-400` |

**Line length:** Max `65ch` for body copy. Never constrain metric/table columns.

---

## 4. Spacing & Sizing

Base unit: **4px** (Tailwind default). All spacing uses multiples of 4px.

### 4.1 Spacing Scale

| Token | px | Tailwind | Use |
|-------|----|----------|-----|
| `xs` | 4 | `p-1` | Icon padding, tight badges |
| `sm` | 8 | `p-2` | Compact elements |
| `md` | 16 | `p-4` | Default card padding (mobile) |
| `lg` | 24 | `p-6` | Card padding (desktop) |
| `xl` | 32 | `p-8` | Section padding |
| `2xl` | 48 | `p-12` | Page section vertical rhythm |
| `3xl` | 64 | `p-16` | Hero padding |

### 4.2 Component Sizing

| Component | Height | Notes |
|-----------|--------|-------|
| Button (default) | 40px (`h-10`) | Touch target >= 44px including padding |
| Button (sm) | 32px (`h-8`) | Table actions, dense UI only |
| Button (lg) | 48px (`h-12`) | Primary CTAs on borrower portal |
| Input | 40px (`h-10`) | |
| Select | 40px (`h-10`) | |
| Table row | 52px | Comfortable data scanning |
| Navbar height | 64px (`h-16`) | |
| Sidebar width | 256px (`w-64`) | |
| Modal width | 480-640px | |
| Card border-radius | 8px (`rounded-lg`) | |
| Button border-radius | 6px (`rounded-md`) | |
| Badge border-radius | 9999px (`rounded-full`) | |

### 4.3 Shadow Scale

```text
shadow-xs  →  box-shadow: 0 1px 2px rgba(0,0,0,0.05)        (inputs, subtle cards)
shadow-sm  →  box-shadow: 0 1px 3px rgba(0,0,0,0.1)         (default cards)
shadow-md  →  box-shadow: 0 4px 6px rgba(0,0,0,0.1)         (elevated panels)
shadow-lg  →  box-shadow: 0 10px 15px rgba(0,0,0,0.1)       (modals, dropdowns)
shadow-xl  →  box-shadow: 0 20px 25px rgba(0,0,0,0.15)      (floating panels)

```js

Dark mode: reduce opacity by 50% — shadows are less visible on dark bg; use border instead.

---

## 5. Responsive Breakpoints

Desktop-first design. Mobile support is required for the Borrower Portal; the Lender Dashboard is desktop-only (underwriters work on workstations).

| Breakpoint | px | Tailwind | Target |
|------------|-----|----------|--------|
| `xs` | 375 | — (default) | Mobile portrait |
| `sm` | 640 | `sm:` | Mobile landscape |
| `md` | 768 | `md:` | Tablet |
| `lg` | 1024 | `lg:` | Small laptop |
| `xl` | 1280 | `xl:` | Desktop (primary for dashboard) |
| `2xl` | 1440 | `2xl:` | Large desktop |

**Borrower Portal:** Full responsive (375px to 1440px)
**Lender Dashboard:** `lg:` minimum. Below `lg`, show a "Please use a larger screen" message.

---

## 6. Design Tokens (Tailwind Config)

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#1D4ED8',
          700: '#1E3A8A',
          900: '#1E293B',
          950: '#060F2A',
        },
        status: {
          new:       '#6B7280',
          reviewing: '#F59E0B',
          approved:  '#10B981',
          funded:    '#8B5CF6',
          declined:  '#EF4444',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'metric':    ['2.25rem', { lineHeight: '1', fontWeight: '700' }],
        'metric-sm': ['1.5rem',  { lineHeight: '1', fontWeight: '600' }],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

```text

---

## 7. Component Library

### 7.1 Buttons

All buttons: `cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`. Disabled state: `opacity-50 cursor-not-allowed`.

| Variant | Classes | Use |
|---------|---------|-----|
| **Primary** | `bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600 rounded-md px-4 py-2.5 text-sm font-medium` | Main CTA |
| **Secondary** | `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-blue-500 rounded-md px-4 py-2.5 text-sm font-medium` | Secondary actions |
| **Danger** | `bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 rounded-md px-4 py-2.5 text-sm font-medium` | Destructive actions |
| **Ghost** | `text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md px-3 py-2 text-sm font-medium` | Toolbar, subtle actions |
| **Link** | `text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline text-sm font-medium` | Inline links |
| **Icon** | `p-2 rounded-md hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500` | Icon-only (must have `aria-label`) |

**Sizes:**

- `sm`: `px-3 py-1.5 text-xs`

- `default`: `px-4 py-2.5 text-sm`

- `lg`: `px-6 py-3 text-base`

**Loading state:** Replace label with `<svg class="animate-spin -ml-1 mr-2 h-4 w-4"/>` + disable button.

### 7.2 Form Inputs

Base input classes:

```tsx
block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm
text-slate-900 placeholder:text-slate-400
focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50 dark:placeholder:text-slate-500

```html

**States:**

- Default: `border-slate-300`

- Focus: `border-blue-500 ring-1 ring-blue-500`

- Error: `border-red-500 ring-1 ring-red-500`

- Disabled: `bg-slate-50 text-slate-400 cursor-not-allowed`

**Field anatomy:**

```html
<div class="space-y-1.5">
  <label for="field" class="block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
    Field Label <span class="text-red-500" aria-label="required">*</span>
  </label>
  <input id="field" ... />
  <!-- Error: -->
  <p class="text-xs text-red-600" role="alert">Error message here</p>
  <!-- Helper: -->
  <p class="text-xs text-slate-500">Helper text here</p>
</div>

```html

**Currency input:** `font-mono` for value, left adornment with `$` symbol.
**Number formatting:** Always use `toLocaleString()` for display. Store raw numbers.

### 7.3 Badges / Status Pills

```html
<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium [color-classes]">
  <span class="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
  Status Label
</span>

```html

| Status | Light classes | Dark classes |
|--------|--------------|-------------|
| New | `bg-gray-100 text-gray-700` | `dark:bg-gray-800 dark:text-gray-300` |
| In Review | `bg-amber-50 text-amber-700` | `dark:bg-amber-950 dark:text-amber-300` |
| Approved | `bg-emerald-50 text-emerald-700` | `dark:bg-emerald-950 dark:text-emerald-300` |
| Funded | `bg-violet-50 text-violet-700` | `dark:bg-violet-950 dark:text-violet-300` |
| Declined | `bg-red-50 text-red-700` | `dark:bg-red-950 dark:text-red-300` |

**Never use color alone** — always pair with the text label.

### 7.4 Cards

```html
<!-- Default card -->
<div class="rounded-lg bg-white border border-slate-200 shadow-sm p-6
            dark:bg-slate-900 dark:border-slate-800">
</div>

<!-- Metric / KPI card -->
<div class="rounded-lg bg-white border border-slate-200 shadow-sm p-6
            dark:bg-slate-900 dark:border-slate-800">
  <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
    Total Exposure
  </p>
  <p class="mt-2 font-mono text-4xl font-bold text-slate-900 dark:text-white">$24.3M</p>
  <p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400">+12% vs last month</p>
</div>

<!-- Clickable card -->
<div class="... cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-150">
</div>

```html

### 7.5 Tables

```html
<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
  <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
    <thead class="bg-slate-50 dark:bg-slate-950">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <button class="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            Company <svg ... />
          </button>
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-100">
        <td class="px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100"></td>
      </tr>
    </tbody>
  </table>
</div>

```html

Pagination: `Showing X-Y of Z results` + prev/next controls + page size select (10, 25, 50).

### 7.6 Modals

Glassmorphism backdrop is permitted here.

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <!-- Panel -->
  <div class="w-full max-w-lg rounded-xl bg-white shadow-xl
              dark:bg-slate-900 dark:border dark:border-slate-800">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
      <h3 id="modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">Title</h3>
      <button class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog">
        <svg ... />
      </button>
    </div>
    <!-- Body -->
    <div class="px-6 py-5"></div>
    <!-- Footer -->
    <div class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
      <button class="[secondary]">Cancel</button>
      <button class="[primary]">Confirm</button>
    </div>
  </div>
</div>

```html

Focus must be trapped inside modal. Esc key closes. Return focus to trigger on close.

### 7.7 Toast Notifications

Position: `fixed bottom-4 right-4 z-50 flex flex-col gap-2`. Animate in with `translateY` from below.

| Type | Left border | Icon color |
|------|------------|------------|
| Success | `border-l-4 border-emerald-500` | `text-emerald-500` |
| Error | `border-l-4 border-red-500` | `text-red-500` |
| Warning | `border-l-4 border-amber-500` | `text-amber-500` |
| Info | `border-l-4 border-blue-500` | `text-blue-500` |

Base toast: `bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-72 max-w-sm`

Auto-dismiss after 5s. Always include dismiss button. Stack multiple vertically.

### 7.8 Progress Stepper (Multi-step Form)

Desktop — horizontal stepper with connector lines:

```html
<nav aria-label="Application progress">
  <ol class="flex items-center">
    <!-- Completed -->
    <li class="flex items-center">
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white">
        <svg class="h-4 w-4" ... checkmark />
      </span>
      <span class="ml-2 text-sm font-medium text-blue-700">Business Profile</span>
    </li>
    <li class="flex-1 h-px bg-blue-700 mx-3"></li>
    <!-- Current -->
    <li class="flex items-center">
      <span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-700 bg-white font-semibold text-sm text-blue-700">
        2
      </span>
      <span class="ml-2 text-sm font-medium text-blue-700">Loan Details</span>
    </li>
    <li class="flex-1 h-px bg-slate-200 dark:bg-slate-700 mx-3"></li>
    <!-- Upcoming -->
    <li class="flex items-center">
      <span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-sm text-slate-400">
        3
      </span>
      <span class="ml-2 text-sm text-slate-400">Financials</span>
    </li>
  </ol>
</nav>

```html

Mobile: collapse to `<p class="text-sm font-medium text-slate-600">Step 2 of 5 — Loan Details</p>` + thin `<progress>` bar.

### 7.9 File Upload Zone

```html
<div class="rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400
            dark:border-slate-700 dark:hover:border-blue-500
            transition-colors cursor-pointer p-8 text-center">
  <svg class="mx-auto h-10 w-10 text-slate-400" ... upload-icon />
  <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
    Drop files here or <span class="text-blue-600 font-medium">browse</span>
  </p>
  <p class="mt-1 text-xs text-slate-400">PDF, PNG, JPEG up to 20MB</p>
  <input type="file" class="sr-only" accept=".pdf,.png,.jpg,.jpeg" multiple />
</div>

```html

After upload: file list with name, size, type icon, remove button, and upload progress bar.

### 7.10 Search + Filter Bar

```html
<div class="flex items-center gap-3 flex-wrap">
  <div class="relative flex-1 min-w-48">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" ... search />
    <input type="search" placeholder="Search companies..."
           class="pl-9 [base-input-classes]" />
  </div>
  <select class="[base-input-classes] w-auto">
    <option value="">All Statuses</option>
    ...
  </select>
  <!-- Active filter chip -->
  <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
    Status: Approved
    <button aria-label="Remove filter" class="ml-1 hover:text-blue-900 cursor-pointer">x</button>
  </span>
</div>

```text

Use debounced fetch (300ms) for search autocomplete suggestions.

---

## 8. Navigation Structure

### 8.1 Borrower Portal

**Public header** (`sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16`):

```text
[LoanApproval logo]                          [Sign In]  [Apply Now →]

```text

**Application in-progress header** (focused, no external nav links):

```text
[← Exit]    [LoanApproval logo]    Step 2 of 5    [Save & Continue Later]

```tsx

### 8.2 Lender Dashboard

**Left sidebar** (`w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col`):

```text
┌──────────────────────────┐
│  LoanApproval  INTERNAL  │
├──────────────────────────┤
│ Overview                 │  ← /dashboard
│ Deal Pipeline            │  ← /dashboard/pipeline
│ Applications             │  ← /dashboard/applications
│ Borrowers                │  ← /dashboard/borrowers
├── AI Tools ──────────────┤
│ Underwriter Assistant    │  ← slide-in panel
├──────────────────────────┤
│ [Avatar] J. Doe          │
│ Settings  |  Sign out    │
└──────────────────────────┘

```text

**Top bar** (`h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4`):

```text
[Page title / breadcrumb]          [Date range]  [Notifications]  [Dark toggle]  [User menu]

```tsx

**Nav item — active:** `bg-blue-50 text-blue-700 font-medium rounded-md dark:bg-blue-950 dark:text-blue-300`
**Nav item — default:** `text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md dark:text-slate-400 dark:hover:bg-slate-800`

All nav items: `flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100 cursor-pointer`

---

## 9. Page Layouts — Borrower Portal

### 9.1 Landing / Hero Page

```text
HEADER (sticky)
─────────────────────────────────────────────────────────
HERO  (py-24 bg-white)
  Eyebrow:  "Trusted by 500+ businesses"  (text-sm text-blue-600 font-medium)
  H1:       "Business financing,
              decided in minutes."         (text-5xl font-bold max-w-2xl)
  Subhead:  [text-lg text-slate-600 max-w-xl mt-4]
  CTAs:     [Check Your Rate →]  [How It Works ↓]
  Trust:    SOC 2 Certified  |  256-bit Encryption  |  No hard credit pull
─────────────────────────────────────────────────────────
HOW IT WORKS  (py-20 bg-slate-50)
  3-column grid:
    1. Apply (5 min)  →  2. Instant Decision  →  3. Funded in 24h
  Icon (Lucide) + bold step title + 2-line description
─────────────────────────────────────────────────────────
LOAN TYPES  (py-20 bg-white)
  3-4 cards in grid: Term Loan / Line of Credit / Equipment / Bridge
  Each: icon, name, amount range, brief description, [Learn More]
─────────────────────────────────────────────────────────
ELIGIBILITY  (py-20 bg-slate-50)
  Simple checklist: requirements borrowers must meet
─────────────────────────────────────────────────────────
SOCIAL PROOF  (py-20 bg-white)
  2-3 testimonial cards: quote + name + company + industry
─────────────────────────────────────────────────────────
CTA BANNER  (py-20 bg-blue-700 text-white)
  "Ready to grow your business?"
  [Start Your Application]  (bg-white text-blue-700 button)
─────────────────────────────────────────────────────────
FOOTER
  Links: Privacy / Terms / Contact
  "LoanApproval is not a bank. Loans subject to credit approval."

```text

### 9.2 Multi-Step Application Form

**URL pattern:** `/apply/step/[1-5]`

**Layout (desktop):**

```tsx
┌─ Focused header ──────────────────────────────────────────────┐
│ [← Exit]    LoanApproval    Step 2 of 5    [Save & Exit]      │
├─ Progress stepper (full width) ────────────────────────────────┤
│                                                                │
│  ┌─ Help sidebar (w-80) ─┐  ┌─ Form panel (flex-1) ────────┐  │
│  │                       │  │                              │  │
│  │  Why we ask this      │  │  [Step title]                │  │
│  │  [FAQ items]          │  │  [Step description]          │  │
│  │                       │  │                              │  │
│  │  Need help?           │  │  [Form fields]               │  │
│  │  [Chat with us]       │  │                              │  │
│  │                       │  │  [← Back]      [Continue →] │  │
│  └───────────────────────┘  └──────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

```html

**Mobile:** Hide sidebar. Stack form fields full-width. Progress = text + bar.

**Step 1 — Business Profile:**

- Company legal name (required)

- DBA / Trade name (optional)

- Industry (select — from predefined list matching credit policy categories)

- Years in business (number, min 1)

- Legal structure (select: LLC, C-Corp, S-Corp, Sole Proprietorship, Partnership)

- EIN (text, format: XX-XXXXXXX)

- Business address (street, city, state, ZIP)

**Step 2 — Loan Request:**

- Loan amount (currency input, $10,000–$5,000,000; slider for quick selection)

- Loan purpose (select: Working Capital, Equipment Purchase, Real Estate, Acquisition, Refinancing, Other)

- Purpose details (textarea, conditional on "Other")

- Desired term (select: 12 / 24 / 36 / 48 / 60 months)

**Step 3 — Financial Data:**

- Annual revenue — most recent fiscal year (currency, required)

- EBITDA (currency, required)

- Total existing debt (currency, required)

- Total assets (currency, required)

- Auto-calculated display (read-only, styled card):
  - Debt-to-Equity ratio
  - DSCR (Debt Service Coverage Ratio)
  - Current Ratio

- Info callout: "These ratios are calculated automatically and used in our credit evaluation."

**Step 4 — Document Upload:**

| Document | Required | Accepted formats |
|----------|----------|-----------------|
| Financial statements (last 2 fiscal years) | Yes | PDF |
| Tax returns (last 2 years) | Yes | PDF |
| Bank statements (last 3 months) | Yes | PDF |
| Accounts receivable aging | No | PDF, XLSX |
| Collateral documentation | No | PDF, PNG, JPEG |

Each slot = independent upload zone. Show file name, size, remove button after upload.

**Step 5 — Review & Submit:**

- Accordion sections, one per step, collapsed by default

- Each section has [Edit] link → navigates back to that step

- Certification checkbox (required): `<label>` wrapping `<input type="checkbox">`

- Text: "I certify that all information provided is accurate and complete to the best of my knowledge."

- [Submit Application] — `lg` primary button, disabled until checkbox checked

### 9.3 Submission Confirmation

```text
Centered card (max-w-md mx-auto mt-20)
  [Lucide CheckCircle, h-16 w-16, text-emerald-500]
  Application Submitted          (text-2xl font-semibold mt-4)
  Application ID: #LA-2026-04821 (font-mono text-slate-500)
  "We'll review your application and respond within 1-2 business days."
  [Track Your Application →]     (primary button)
  [Return to Home]               (ghost button)

```text

### 9.4 Application Status Tracking

**URL:** `/apply/status?id=LA-2026-04821`

```text
┌─ Public header ─────────────────────────────────────────────┐
│                                                             │
│  Application #LA-2026-04821        [In Review badge]        │
│  Submitted March 20, 2026                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  STATUS TIMELINE (vertical, left-border style)              │
│                                                             │
│  ● Application Received     March 20, 2026 at 9:41 AM      │
│  ● Under Review             March 21, 2026 at 10:00 AM     │
│  ○ Decision                 Estimated: March 22             │
│  ○ Funding                  —                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  LOAN SUMMARY (card)                                        │
│  Amount: $250,000  |  Purpose: Working Capital  |  36 mo   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  What happens next?                                         │
│  Plain text explanation of the review process              │
│                                                             │
│  Questions? [Contact support]                               │
└─────────────────────────────────────────────────────────────┘

```html

**Status: Approved** — Show offer box (emerald bg) with amount, rate, term, [Accept Offer] CTA.
**Status: Declined** — Show decline card (neutral, not alarming) with reason categories + [Contact Us].
**Status: Funded** — Show funded confirmation with disbursement date.

---

## 10. Page Layouts — Lender Dashboard

**Shell layout:**

```tsx
// All dashboard pages use this shell
<div class="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
  <Sidebar />  // w-64, fixed height, internal scroll if needed
  <div class="flex-1 flex flex-col overflow-hidden">
    <TopBar />   // h-16, sticky
    <main id="main-content" class="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>

```text

### 10.1 Dashboard Overview

**URL:** `/dashboard`

```text
Page title: "Portfolio Overview"    Subtitle: "Last updated 2 minutes ago"

KPI CARDS (4-column grid, gap-4)
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total        │  │ Active       │  │ Approval     │  │ Avg. Loan    │
│ Exposure     │  │ Deals        │  │ Rate         │  │ Size         │
│ $24.3M       │  │ 47           │  │ 68%          │  │ $517K        │
│ +12% ↑       │  │ +3 this week │  │ -2pp MoM     │  │ +8% MoM      │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

CHARTS ROW (2-column, gap-4, mt-6)
┌─── Monthly Originations (Area Chart) ─────┐  ┌── Status Breakdown (Donut) ────┐
│  12-month area chart                      │  │  New / In Review / Approved /  │
│  Recharts AreaChart, gradient fill        │  │  Funded / Declined             │
│  Hover: tooltip with exact value          │  │  Center: total count           │
└───────────────────────────────────────────┘  └────────────────────────────────┘

RECENT APPLICATIONS (full width, mt-6)
Condensed table: last 5 apps, columns: Company / Amount / Status / Submitted / [View]

```text

### 10.2 Deal Pipeline

**URL:** `/dashboard/pipeline`

Toggle: `[Kanban] [Table]` — top right, segmented control.

**Kanban view** (`flex gap-4 overflow-x-auto pb-4`):

```text
┌── NEW (12) ──┬── IN REVIEW (8) ──┬── APPROVED (5) ──┬── FUNDED (22) ──┬── DECLINED (9) ──┐
│ Column bg:   │                   │                  │                 │                  │
│ slate-50     │                   │                  │                 │                  │
│              │                   │                  │                 │                  │
│ [Deal card]  │ [Deal card]       │ [Deal card]      │ [Deal card]     │ [Deal card]      │
│ [Deal card]  │                   │                  │                 │                  │
│ + Add note   │                   │                  │                 │                  │
└──────────────┴───────────────────┴──────────────────┴─────────────────┴──────────────────┘

```text

**Deal card:**

```text
┌──────────────────────────────────┐
│ Acme Corp Inc.        [In Review] │
│ SaaS                             │
│ $350,000  ·  36 months           │
│ Submitted Mar 18, 2026           │
│ Assigned: J. Smith               │
└──────────────────────────────────┘

```text
Card: `bg-white rounded-lg border border-slate-200 shadow-xs p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150`

**Table view:** See §10.3 Applications List — same table, same columns.

### 10.3 Applications List

**URL:** `/dashboard/applications`

```text
FILTER BAR (mb-4)
[Search companies...]  [Status v]  [Industry v]  [Loan Size v]  [Date Range v]  [Active chips]

TABLE
┌────────────┬─────────────────┬──────────────┬──────────┬───────┬──────────────┬───────────┬─────────┬───────────┐
│ Checkbox   │ Company         │ Industry     │ Amount   │ Term  │ Status       │ Submitted │ Assigned│ Actions   │
├────────────┼─────────────────┼──────────────┼──────────┼───────┼──────────────┼───────────┼─────────┼───────────┤
│ [ ]        │ Acme Corp Inc.  │ SaaS         │ $350,000 │ 36 mo │ [In Review]  │ Mar 18    │ J. Smith│ [View]    │
│ [ ]        │ Beta Industries │ Manufacturing│ $1.2M    │ 60 mo │ [Approved]   │ Mar 17    │ K. Lee  │ [View]    │
└────────────┴─────────────────┴──────────────┴──────────┴───────┴──────────────┴───────────┴─────────┴───────────┘

PAGINATION
Showing 1-25 of 143 applications    [< Prev]  1  2  3  ...  6  [Next >]    Per page: [25 v]

```text

Amount column: `font-mono text-right`. Submitted column: relative time + absolute on hover tooltip.
Bulk select via header checkbox → sticky bulk action bar appears above table.

### 10.4 Deal / Borrower Detail Page

**URL:** `/dashboard/applications/[id]`

```text
BREADCRUMB: Applications > Acme Corp Inc.

PAGE HEADER
Acme Corp Inc.                                    [In Review  ●]
#LA-2026-04821  ·  Submitted March 18, 2026   [Approve] [Decline] [Flag for Review]

TWO-COLUMN LAYOUT (lg:grid lg:grid-cols-3 gap-6)

LEFT COLUMN (col-span-2):
┌── Loan Request ────────────────────────────────┐
│  Amount: $350,000   Purpose: Working Capital   │
│  Term: 36 months    Submitted: Mar 18, 2026    │
└────────────────────────────────────────────────┘

┌── Business Profile ────────────────────────────┐
│  Company: Acme Corp Inc.   Industry: SaaS      │
│  Founded: 2019             Structure: LLC      │
│  EIN: 12-XXXXXXX           State: Delaware     │
└────────────────────────────────────────────────┘

┌── Financial Snapshot ──────────────────────────┐
│  Revenue:    $2.4M    EBITDA:    $480K         │
│  Total Debt: $820K    Assets:    $1.9M         │
│                                                │
│  KEY RATIOS (2-col grid with color coding)     │
│  Debt-to-Equity  1.2x   [●]  (amber)          │
│  Interest Cov.   3.4x   [●]  (green)          │
│  Current Ratio   2.1x   [●]  (green)          │
│  DSCR            1.35x  [●]  (green)          │
│                                                │
│  [Radar chart — 4 axes, all ratios]            │
└────────────────────────────────────────────────┘

┌── Documents ───────────────────────────────────┐
│  [PDF icon] Financial Statements 2024.pdf      │
│  [PDF icon] Tax Return 2024.pdf                │
│  [PDF icon] Bank Statements Q1 2026.pdf        │
└────────────────────────────────────────────────┘

┌── Decision Audit Log ──────────────────────────┐
│  Timeline of rule triggers and evaluations     │
│  Mar 21, 10:02 AM — Rules engine evaluated     │
│    DSCR check: PASS (1.35x > 1.25 threshold)  │
│    D/E check: CAUTION (1.2x, threshold 1.0)   │
│    Industry tier: Low Risk (SaaS)              │
│    Recommendation: APPROVE                    │
└────────────────────────────────────────────────┘

RIGHT COLUMN (col-span-1):
┌── Decision Panel ──────────────────────────────┐
│  AI Recommendation:                           │
│  [APPROVE]  (emerald badge, prominent)        │
│  Confidence: High                             │
│                                               │
│  Rule triggers: 4 pass, 1 caution            │
│  [View full report]                           │
│                                               │
│  [Approve Deal]   (emerald primary button)    │
│  [Decline]        (red secondary button)      │
│  [Send to Manual Review]  (amber ghost)       │
└────────────────────────────────────────────────┘

┌── Assignment ──────────────────────────────────┐
│  Assigned to: J. Smith                        │
│  [Reassign →]                                 │
└────────────────────────────────────────────────┘

┌── Activity / Notes ────────────────────────────┐
│  [Add note... textarea]  [Post]               │
│  ─────────────────────                        │
│  Mar 21 – J. Smith                            │
│  "Called borrower — revenue confirmed."       │
│  Mar 20 – System                              │
│  "Application submitted."                     │
└────────────────────────────────────────────────┘

```text

**Ratio color coding:**

| Ratio | Green (good) | Amber (caution) | Red (concern) |
|-------|-------------|-----------------|---------------|
| DSCR | > 1.25 | 1.0–1.25 | < 1.0 |
| Current Ratio | > 1.5 | 1.0–1.5 | < 1.0 |
| Debt-to-Equity | < 1.0 | 1.0–2.0 | > 2.0 |
| Interest Coverage | > 3.0x | 1.5–3.0x | < 1.5x |

### 10.5 Underwriter AI Assistant (Stretch)

**Implementation:** Slide-in panel from right, `w-96`, toggled by button in top bar.

```tsx
┌── Underwriter Assistant ────────────────── [×] ─┐
│  Glassmorphism: bg-white/95 backdrop-blur-md    │
│  dark:bg-slate-900/95                           │
├─────────────────────────────────────────────────┤
│  Chat history (flex-1 overflow-y-auto)          │
│                                                 │
│  [AI bubble] What would you like to know        │
│  about the Acme Corp deal?                      │
│                                                 │
│  [User bubble] What's their DSCR?               │
│                                                 │
│  [AI bubble] Acme Corp's DSCR is 1.35x,        │
│  which exceeds the 1.25x threshold...           │
│                                                 │
├─────────────────────────────────────────────────┤
│  Suggested prompts (chips, wrap):               │
│  [Summarize deal] [Risk factors] [vs. industry] │
├─────────────────────────────────────────────────┤
│  [Type a question about this deal...]   [Send]  │
└─────────────────────────────────────────────────┘

```js

AI bubble: `bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg rounded-tl-none`
User bubble: `bg-blue-700 text-white rounded-lg rounded-tr-none ml-auto`

---

## 11. State Design

### 11.1 Loading States

| Context | Pattern | Implementation |
|---------|---------|---------------|
| Page initial load | Skeleton matching layout | `loading.tsx` in Next.js App Router |
| Table data | 5 skeleton rows, pulsing | `animate-pulse bg-slate-200 dark:bg-slate-700` |
| Button async action | Spinner + disabled | Replace children with `<Spinner/>` |
| Chart | Gray placeholder rectangle | Fixed height, `animate-pulse` |
| File upload | Per-file progress bar | `<progress>` element, linear |
| KPI card | Skeleton number + label | Match exact card dimensions |

Use `<Suspense>` boundaries in Next.js. Place skeleton UIs in `loading.tsx` files collocated with routes.

### 11.2 Empty States

| Context | Icon | Heading | Body | Action |
|---------|------|---------|------|--------|
| No applications | `Inbox` | "No applications yet" | "Applications will appear here once submitted." | — |
| No search results | `SearchX` | "No results for '[query]'" | "Try different search terms or clear filters." | [Clear search] |
| No documents | `FileX` | "No documents uploaded" | "Upload financial documents to continue." | — |
| Pipeline stage empty | `Layers` | "No deals in this stage" | — | — |
| Empty notes | `MessageSquare` | "No notes yet" | "Add the first note for this deal." | — |

Layout: `flex flex-col items-center justify-center py-16 text-center`

### 11.3 Error States

| Type | Component | Behavior |
|------|-----------|---------|
| Field validation | Inline below input | `role="alert"`, red text, shown on blur |
| Form submission | Error toast + top-of-form alert | Both simultaneously |
| Data fetch failure | Error card in place of content | Icon + message + [Retry] button |
| Network offline | Sticky banner at top | "You're offline. Changes may not save." |
| 404 Not Found | Full-page centered | Back button + home link |
| 403 Forbidden | Full-page centered | "Contact your administrator" |

---

## 12. Data Visualization

**Library:** Recharts (primary). D3.js for custom visuals only if Recharts is insufficient.

### 12.1 Shared Chart Theme

```ts
// lib/chart-theme.ts
export const chartTheme = {
  colors: {
    primary:   '#1D4ED8',  // blue-700
    success:   '#10B981',  // emerald-500
    warning:   '#F59E0B',  // amber-500
    danger:    '#EF4444',  // red-500
    funded:    '#8B5CF6',  // violet-500
    neutral:   '#94A3B8',  // slate-400
  },
  grid: {
    stroke: '#E2E8F0',        // slate-200 (dark: '#1E293B')
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: '#94A3B8',        // slate-400
    fontSize: 12,
    fontFamily: 'IBM Plex Sans',
  },
  tooltip: {
    contentStyle: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      fontSize: '13px',
    },
  },
}

```html

### 12.2 Chart Inventory

| Chart | Page | Type | Config notes |
|-------|------|------|-------------|
| Monthly originations | Overview | `AreaChart` | Gradient fill 20% opacity, `stroke="#1D4ED8"` |
| Status distribution | Overview | `PieChart` (donut) | Each status = its semantic color, center shows total |
| Approval rate trend | Overview | `LineChart` | Single line, dots on data points |
| Financial ratio radar | Deal detail | `RadarChart` | 4 axes: DSCR / Current Ratio / D-E / Interest Cov |
| Loan size distribution | Reports (stretch) | `BarChart` horizontal | Sorted descending |

All charts: `<ResponsiveContainer width="100%" height={240}>` (height varies by context).

### 12.3 Chart Standards

- **Axes:** Light grid lines only (`strokeDasharray="3 3"`). No heavy axis borders.

- **Tooltips:** White bg, `rounded-lg shadow-lg`, monospace numbers.

- **Legends:** Below chart, `text-xs text-slate-600`.

- **Responsive:** Always use `ResponsiveContainer`.

- **Reduced motion:** `const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches` — pass `isAnimationActive={!prefersReducedMotion}`.

- **Accessibility:** Every chart must have a visually-hidden `<table>` data alternative with `class="sr-only"`.

---

## 13. Dark Mode

**Strategy:** Tailwind `darkMode: 'class'`. Toggle adds/removes `dark` class on `<html>`.

**Persistence:** Store in `localStorage` under key `"theme"`. Read on page load before paint (inline script in `<head>`) to avoid FOUC.

**Toggle UI:** Sun/Moon icon button in top bar. `aria-label="Toggle dark mode"`.

**Key dark overrides to always apply:**

```tsx
bg-white            → dark:bg-slate-900
bg-slate-50         → dark:bg-slate-950
border-slate-200    → dark:border-slate-800
text-slate-900      → dark:text-slate-50
text-slate-600      → dark:text-slate-400
text-slate-400      → dark:text-slate-500
border-slate-300    → dark:border-slate-700
bg-slate-100        → dark:bg-slate-800
placeholder-slate-400 → dark:placeholder-slate-500

```html

**Charts in dark mode:** Update `grid.stroke` to `'#1E293B'` and `tooltip.contentStyle.background` to `'#0F172A'`.

---

## 14. Accessibility

Minimum: **WCAG 2.1 AA**

| Requirement | Rule |
|-------------|------|
| Color contrast | 4.5:1 normal text, 3:1 large text and UI components |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` on all interactive elements |
| Skip link | First element in `<body>`: `<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded">Skip to content</a>` |
| Keyboard nav | Tab order = visual order. All interactive elements reachable via keyboard. |
| Focus trap | Modals, drawers: trap focus within while open. Esc key closes. |
| Screen reader | All SVG icons: `aria-hidden="true"` + sibling `<span class="sr-only">` OR parent `aria-label`. |
| Images | All `<img>` and `<Image>`: descriptive `alt`. Decorative: `alt=""`. |
| Form labels | Every input: `<label for="...">` linked via `id`. Never placeholder-only. |
| Error announce | `role="alert"` on field errors. `aria-live="polite"` for status updates. |
| Status badges | Never color alone — always include text label. |
| Reduced motion | Wrap all transitions: `@media (prefers-reduced-motion: reduce) { transition: none !important; animation: none !important; }` |
| Table headers | `<th scope="col">` on all column headers. `<th scope="row">` for row headers. |
| Loading states | Announce with `aria-live="polite"` or `aria-busy="true"` on the updating region. |

---

## 15. Pre-Delivery Checklist

Run through before shipping any component or page:

### Visual Quality

- [ ] No emojis as icons — Lucide React SVG only

- [ ] Consistent icon sizes (`w-4 h-4` for inline, `w-5 h-5` default, `w-6 h-6` prominent)

- [ ] Financial figures use `font-mono`

- [ ] Hover states don't shift layout (no `scale` on container elements)

### Interaction

- [ ] All clickable elements: `cursor-pointer`

- [ ] Hover: clear visual feedback with `transition-colors duration-150`

- [ ] Focus: `focus-visible:ring-2` visible on all interactive elements

- [ ] Buttons disabled and show spinner during async operations

### Light / Dark Mode

- [ ] Body text contrast >= 4.5:1 in both modes

- [ ] Borders visible in both modes (not `border-white/10` in light)

- [ ] No transparent card bg that disappears in light mode

- [ ] Manually tested at both modes

### Layout

- [ ] No content hidden behind fixed navbar (`pt-16` offset on main)

- [ ] Responsive tested: 375px, 768px, 1024px, 1440px

- [ ] Tables wrapped in `overflow-x-auto`

- [ ] No horizontal scroll on mobile (Borrower Portal)

### Accessibility

- [ ] All form inputs have associated `<label>`

- [ ] All images have `alt` text

- [ ] All icon-only buttons have `aria-label`

- [ ] Error messages use `role="alert"`

- [ ] Keyboard navigation works end-to-end for the flow

- [ ] `prefers-reduced-motion` disables animations

### Next.js / Performance

- [ ] Data fetched in Server Components (not `useEffect` on client)

- [ ] Slow data behind `<Suspense>` with skeleton fallback in `loading.tsx`

- [ ] User input sanitized — no `dangerouslySetInnerHTML` with raw user data

- [ ] Images use `next/image` with explicit `width` and `height`

- [ ] Fonts loaded via `next/font/google` with `display: 'swap'`

---

*This document is the source of truth for all frontend design decisions on the LoanApproval platform.*
*Update this spec when patterns change — do not let implementation drift from this reference.*
