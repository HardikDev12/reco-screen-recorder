---
name: frontend-design-pro
description: >-
  Expert guidelines for high-quality frontend design, optical alignment, spacing systems, responsive layouts, and UI polishing. Use when designing, auditing, or refactoring UI components.
---

# Frontend Design Pro & Spacing System

This skill provides design standards, optical alignment rules, and strict spacing systems for modern web and desktop interfaces.

## 1. 8-Point & 4-Point Spacing Hierarchy

Always use a strict mathematical spacing scale to maintain rhythm and optical balance:

| Token | Pixels | Use Case |
| :--- | :--- | :--- |
| `space-1` | 4px | Micro padding, icon-to-badge gaps, border offsets |
| `space-2` | 8px | Button internal vertical padding, icon-to-label spacing |
| `space-3` | 12px | Component internal padding, grouping gaps |
| `space-4` | 16px | Section padding, modal margins, container gaps |
| `space-6` | 24px | Card padding, primary layout dividers |
| `space-8` | 32px | Major container gutters and headers |

## 2. Optical Alignment Rules

1. **Explicit Heights**: Interactive toolbars and pills must use fixed explicit container heights (e.g. `h-[52px]` or `h-[56px]`) with `flex items-center` to eliminate vertical clipping and sub-pixel misalignment.
2. **Button Proportions**:
   - Primary Call to Action (REC / Done): `h-9` or `h-10` with generous horizontal padding (`px-5` / `px-6`) and `shrink-0`.
   - Secondary Icon Buttons: Square aspect (`h-9 w-9` or `h-8 w-8`) with centered icons.
   - Text & Pill Badges: `h-8` or `h-9` with `px-3` horizontal padding.
3. **Divider Alignment**: Section separators (`border-l border-white/10`) must span the optical height of the controls with matching left/right margins (`mx-1.5` or `px-2`).
4. **No Shrinking (`shrink-0`)**: All primary buttons and badges in toolbars must have `shrink-0` to prevent horizontal squishing when parent dimensions resize.

## 3. Responsive & Multi-DPI Design

- Scale window bounds according to `window.devicePixelRatio` (100%, 125%, 150%, 200%).
- Ensure text line-height (`leading-none` or `leading-tight`) matches container heights so fonts are vertically centered on all DPIs.
