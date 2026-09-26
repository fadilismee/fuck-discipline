---
name: Obsidian Slate
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c9'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9193'
  outline-variant: '#444749'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3132'
  primary-container: '#e2e2e3'
  on-primary-container: '#636466'
  inverse-primary: '#5d5e60'
  secondary: '#c6c5cf'
  on-secondary: '#2f3038'
  secondary-container: '#4a4b53'
  on-secondary-container: '#bcbbc5'
  tertiary: '#ffffff'
  on-tertiary: '#003824'
  tertiary-container: '#6ffbbe'
  on-tertiary-container: '#00734e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e3'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1d'
  on-primary-fixed-variant: '#454748'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-default:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  kbd:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.5rem
  margin-compact: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system embodies high-agency digital craftsmanship. Targeted at power users, knowledge workers, engineers, and digital minimalists, the interface acts as an invisible, high-performance medium for thought and execution.

The aesthetic fuses the disciplined utilitarianism of developer tools with the typographic refinement of premium editorial software. Visual noise is treated as a defect: every pixel, border, and millisecond of latency is tuned to sustain deep work. 

Key principles:
- **Zero Friction:** Keyboard-first interaction patterns, instant visual states, and low-cognitive-load navigation.
- **Structural Precision:** Surfaces rely on calibrated dark neutrals, hairline 1px dividers, and micro-elevation rather than heavy drop shadows.
- **Intentional Chromatic Restraint:** Rich semantic accents (emerald, amber, rose, sky, violet) appear strictly to denote urgency, progression, and state.

## Colors

The palette is engineered around pure dark slate and zinc hierarchies, establishing high contrast without harsh glare.

### Surface System
- `canvas-default`: `#09090B` — Base application foundation.
- `surface-subtle`: `#121215` — Sidebar panels, muted toolbars, and inactive track regions.
- `surface-default`: `#18181B` — Cards, floating command palettes, popovers, and table rows.
- `surface-elevated`: `#202024` — Modals, tooltips, and active popover focus tiers.

### Border & Divider System
- `border-hairline`: `#18181B` — Structural section separators and structural grid lines.
- `border-default`: `#27272A` — Standard component borders, card edges, and input boundaries.
- `border-hover`: `#3F3F46` — Interactive boundary state on pointer focus or active selection.

### Typography & Content
- `text-primary`: `#F4F4F5` — Main headlines, input text, and high-priority titles.
- `text-secondary`: `#A1A1AA` — Body text, list metadata, and secondary actions.
- `text-muted`: `#71717A` — Key shortcuts, inactive indicators, timestamps, and column headers.
- `text-faint`: `#52525B` — Ghost placeholders and disabled visual triggers.

### Semantic & Status Accents
- `emerald` (`#10B981` / background: `#064E3B` / surface: `#062E24`): Complete, active, positive drift.
- `amber` (`#F59E0B` / background: `#78350F` / surface: `#451A03`): In-flight, caution, paused.
- `rose` (`#F43F5E` / background: `#881337` / surface: `#4C0519`): Blocked, overdue, destructive danger.
- `sky` (`#0EA5E9` / background: `#0C4A6E` / surface: `#082F49`): Informational, synced, current sprint.
- `violet` (`#8B5CF6` / background: `#4C1D95` / surface: `#2E1065`): Strategic, milestone, high-priority tag.

## Typography

The type scale prioritizes scan-density and typographic cadence over large display sizes. `Geist` provides geometric neutrality and proportional rhythm for interface elements, while `JetBrains Mono` handles metadata, keybindings, timestamps, and metric readouts.

Rules for implementation:
- **Optical Tightening:** Negative letter-spacing is applied universally on all sizes above 14px to eliminate loose glyph whitespace in dark theme environments.
- **Numerical Alignment:** All tabular displays, task runtimes, counters, and statistics must use tabular lining (`tnum` feature flag enabled).
- **Hierarchy by Weight:** Structural distinction is carried through shifting weights (`400` vs `500` vs `600`) and value shifts (`text-primary` down to `text-muted`) instead of arbitrary font-size jumps.

## Layout & Spacing

The layout model is anchored by an app-shell desktop paradigm featuring collapsible utility zones, a persistent command navigation rail, and a fluid document/workspace canvas.

### Layout Philosophy
- **App Shell Framework:** Fixed-position three-column architecture: Navigation Panel (220–260px), Content List / Workstream (320–380px), and Detail/Editor Canvas (fluid flex-grow, capped optionally at 840px for writing modes).
- **Micro-Cadence:** Multiples of 4px dictate all interior distances. 8px (`space-sm`) and 12px (`space-md`) represent primary inner structural padding.
- **Data-Dense Row Calibration:** List rows across task views and tables adhere to a strict 32px or 36px total height footprint, optimizing viewport informational yields.

## Elevation & Depth

Depth is established primarily through tonal boundaries and luminance shifts rather than diffused blur shadows.

- **Level 0 (Base Canvas):** Pure background (`#09090B`). Flush surface without borders or shadows.
- **Level 1 (Panels & Cards):** Flat tone (`#121215` or `#18181B`) contained by a 1px border (`#27272A`). Zero shadow.
- **Level 2 (Dropdowns & Popovers):** Raised tone (`#18181B`) with 1px border (`#27272A`) paired with a tight ambient shadow: `0 4px 12px rgba(0, 0, 0, 0.45)`.
- **Level 3 (Command Palette & Global Modals):** Backdrop mask (`rgba(0, 0, 0, 0.70)` with a 4px blur filter), container surface (`#18181B`), outer border (`#3F3F46`), and layered directional shadow: `0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05) inset`.

## Shapes

The interface embraces a low-radius, architectural geometry (`roundedness: 1`). Soft curves (4px to 6px) introduce visual ergonomics without softening the utilitarian feel.

- **Inputs, Buttons, Badges, Dropdown Items:** `0.25rem` (4px). Clean, technical, and compact.
- **Cards, Panels, Floating Modals:** `0.5rem` (8px). Delimits structural workspaces without appearing bubbly.
- **Pill Counters & Status Nodes:** Full rounded-full (`9999px`) allowed exclusively on micro-status dots and numeric notification tags smaller than 18px.

## Components

### Buttons
- **Primary:** Background `#F4F4F5`, text `#09090B`, font-weight 500. Hover: `#E4E4E7`. Active: transform scale `0.99`.
- **Secondary:** Background `#18181B`, border `1px solid #27272A`, text `#F4F4F5`. Hover: background `#202024`, border `#3F3F46`.
- **Ghost:** Transparent background, text `#A1A1AA`. Hover: background `#18181B`, text `#F4F4F5`.
- **Dimensions:** Default height 32px; Compact height 26px; Padding 0 10px.

### Status Badges & Chips
- Structure: 1px border with 10% tinted background of corresponding accent color.
- Height: 20px, font: `JetBrains Mono` 11px.
- Internal: 6px circular indicator dot (pulsing or static) accompanied by short-string status label.

### Inputs & Search Bars
- Background `#121215`, border `1px solid #27272A`, text `#F4F4F5`, placeholder `#52525B`.
- Focus state: Border color changes to `#71717A` with a crisp `0 0 0 1px #71717A` outline. No glowing colored Halos.
- Integrated keyboard hint on right side: Styled with `<kbd>` tag (`#27272A` background, `#A1A1AA` text).

### Lists & Task Items
- Clean tabular rows, height 34px, vertical border dividers removed.
- Hover behavior: Background shifts seamlessly to `#18181B` with no transition delay.
- Right accessory items (assignee avatars, date labels, tags) remain muted at 60% opacity until row hover.

### Checkboxes & Radios
- Checkbox: 14x14px square, radius 3px, border `1px solid #3F3F46`.
- Checked state: Background `#F4F4F5`, checkmark stroke `#09090B` (width: 2px).
- Selection animation: Immediate step switch (0ms duration) to reinforce raw execution speed.

### Command Menu (Palette)
- Centered overlay, width 640px.
- Integrated top search input (44px height, font size 15px, borderless within panel).
- Group headers labeled via uppercase `label-sm` font in `#71717A`.
- Selection pointer tracks with high contrast background `#27272A` and primary text `#FFFFFF`.