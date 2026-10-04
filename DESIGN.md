---
version: alpha
name: Sumi
description: Ultra-fast, distraction-free scratchpad rooted in traditional ink aesthetics and architectural minimalism.
colors:
  primary: "#111113"
  on-primary: "#FFFFFF"
  secondary: "#636366"
  secondary-dark: "#AEAEB2"
  neutral: "#FFFFFF"
  neutral-variant: "#F9FAFB"
  surface-container: "#F2F2F7"
  surface-dark: "#1C1C1E"
  surface-dark-container: "#151517"
  on-surface-dark: "#F4F4F6"
  outline: "#E5E5EA"
  outline-dark: "#2C2C30"
typography:
  headline-title:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: -0.005em
  body-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.05em
  code-inline:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  xs: 3px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 256px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 8px
  button-secondary:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 8px
  chip-code:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 4px
  input-field:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 8px
  card-note:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  card-note-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-surface-dark}"
    rounded: "{rounded.lg}"
    padding: 12px
  sidebar-panel:
    backgroundColor: "{colors.neutral-variant}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.xs}"
    padding: 12px
  sidebar-panel-dark:
    backgroundColor: "{colors.surface-dark-container}"
    textColor: "{colors.secondary-dark}"
    rounded: "{rounded.xs}"
    padding: 12px
  divider:
    backgroundColor: "{colors.outline}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xs}"
    padding: 1px
  divider-dark:
    backgroundColor: "{colors.outline-dark}"
    textColor: "{colors.on-surface-dark}"
    rounded: "{rounded.xs}"
    padding: 1px
---

## Overview

Sumi is an ultra-fast, local-first scratchpad designed with radical minimalism. The visual identity draws inspiration from Japanese ink wash painting (*sumi-e*), where pure black ink meets white paper with absolute clarity, economy, and intention.

There are no decorative gradients, skeuomorphic noise, or competing brand colors. The interface recedes completely into the background, leaving only pure thought and structured text. Every element exists to serve writing and reflection.

## Colors

The color palette is deliberately monochrome and restrained, celebrating contrast without harshness:

- **Primary (`#111113`):** Deep charcoal ink, providing profound readability without the optical fatigue of pure `#000000`.
- **On-Primary (`#FFFFFF`):** Crisp stark white for badges, keycaps, and primary interactive highlights.
- **Secondary (`#636366`):** Muted stone for metadata, timestamps, and secondary icon affordances in light mode.
- **Secondary Dark (`#AEAEB2`):** Accessible slate ensuring high-contrast readability (8.25:1) for secondary text and icons in dark mode.
- **Neutral (`#FFFFFF`):** Pristine paper canvas for daylight writing.
- **Neutral Variant (`#F9FAFB`):** Soft mist background for navigation and sidebar panels in light mode.
- **Surface Container (`#F2F2F7`):** Gentle gray for interactive chips, search inputs, and secondary button states.
- **Surface Dark (`#1C1C1E`):** Warm graphite charcoal for dark mode writing (eliminates OLED glare and harsh contrast).
- **Surface Dark Container (`#151517`):** Deeper slate sidebar in dark mode, providing calm visual depth.
- **On-Surface Dark (`#F4F4F6`):** Soft moonlight white text on dark surfaces.
- **Outline (`#E5E5EA`):** Subtle 1px structural hairpins in light mode.
- **Outline Dark (`#2C2C30`):** Subtle 1px structural hairpins in dark mode.

## Typography

Sumi relies entirely on high-grade system typography to guarantee zero font download latency, zero network overhead, and native desktop rendering fidelity.

- **Prose (San Francisco / System Sans):** Optimized for long-form reading, natural rhythm, and high legibility at 15px with a 1.65 line-height ratio.
- **Headlines:** Clean semi-bold hierarchy with tightened tracking (`-0.015em`) for compact, authoritative titling.
- **Code (Monospace):** Compact 13px system monospace (`SFMono-Regular`, `Menlo`, `Consolas`) for inline backtick chips and keyboard shortcuts.
- **Labels:** Uppercase 11px with generous tracking (`0.05em`) for category headers and badge indicators.

## Layout

The application utilizes a responsive dual-pane layout:

- **Sidebar (256px):** Collapsible navigation panel housing the note library, search, and action triggers. Collapses smoothly to zero width when focused on writing.
- **Canvas:** Fluid, distraction-free writing environment centered with comfortable horizontal margins (max 640px reading line length).
- **Spacing Grid:** A disciplined 4px/8px modular rhythm (4px, 8px, 16px, 24px, 32px) ensures structural harmony across toolbars, dialogs, and lists.

## Elevation & Depth

Sumi deliberately avoids drop shadows and floating layers in favor of crisp structural boundaries:

- **Borders & Dividers:** 1px subtle hairpins (`#E5E5EA` in light, `#2C2C30` in dark) define panels.
- **Modal Overlays:** Modal dialogs use high-contrast containment borders with a soft 20% backdrop scrim.
- **Active States:** Selection is conveyed through background fill tints (`#F2F2F7` / `#2C2C30`) rather than drop shadows or heavy glows.

## Shapes

Shapes reflect architectural clarity and subtle precision:

- **Interactive Badges:** 4px to 6px radii for buttons, pills, and keycap badges (`<kbd>`).
- **Cards & Modals:** 8px to 12px radii for note preview cards and keyboard cheatsheets.
- **Droplet Brand Mark:** Fluid, geometric ink teardrop vector representing pure ink on canvas, enclosed in an Apple-style 22.5% squircle.

## Components

- **Buttons:** Compact 28px/32px hit areas with subtle hover backgrounds (`hover:bg-ink-100`).
- **Code Chips:** Subtle rounded pills with 1px border and monospace typography.
- **Hyperlinks:** Understated baseline underline in slate (`#C7C7CC` / `#545458`) with 3px offset, deepening on hover without layout shift or harsh blue hues.
- **Task Checkboxes:** 14px rounded squares with custom animated check marks.

## Do's and Don'ts

- **Do** maintain strict monochrome discipline; avoid adding colorful accent buttons.
- **Do** preserve system font stacks to ensure sub-50ms application startup times.
- **Do** maintain WCAG AA/AAA contrast ratios for all text layers.
- **Don't** add drop shadows or multi-layer blurs to core editing surfaces.
- **Don't** display intrusive notifications or persistent saving badges during active typing.
- **Don't** introduce external font dependencies or heavy icon bundles.
