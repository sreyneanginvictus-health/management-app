# Handoff: Negroni redesign — "Ledger green" (light + dark)

## Overview
A visual redesign of the Negroni Management OS. **Only the visual design changes.** Data, roles, permissions, workflows, status words and "Configurable" settings stay exactly as described in the original `DESIGN_HANDOFF.md` §2. This handoff covers six screens in the CEO view, each for desktop (1440) and mobile (390), in light and dark themes:
Dashboard · Financial Overview · Finance (Overview tab) · Reports & KPIs (Overview tab) · Tasks (List view) · Projects (list + detail).

## About the design files
The `.dc.html` files are **design references built in HTML**. They are not production code. Recreate them inside the existing Negroni codebase, using its current components, routing, data layer and permission checks. Open any `.dc.html` in a browser to view it, with `support.js` in the same folder. The sample figures are the app's demo data.

## Fidelity
**High fidelity.** Colours, type, radii, spacing and layout are final. Implement them as **theme tokens**: replace the values in `styles.css :root` and add a `[data-theme="dark"]` override set. Don't hard-code hex values in components. The light and dark files have identical structure and differ only in token values.

## Global layout
- **Desktop:** page background `--bg`, 18px outer padding. Grid: `248px sidebar | 1fr main`, 22px gap.
- **Sidebar:** white surface card, radius 20, padding 20/14.
  - Brand mark: 38px square, radius 11, filled green.
  - Group labels: 11px uppercase, letter-spacing .06em, `--muted-2`.
  - Nav items: padding 10/12, radius 12, 14px text, weight 500.
  - Active item: filled `--brand`, white text, weight 600.
  - Count badge: lime pill.
  - Footer: "Signed in as CEO" card in `--brand`, plus a white "Account & theme" button.
- **Top bar (desktop):** search field (360px, radius 12, 1px border) · spacer · company scope pill · bell (42px circle, red count badge) · user chip (avatar, name and role).
- **Page header:** title 32px/700, letter-spacing -0.03em. Subtitle 14px muted. Primary action on the right.
- **Cards:** surface background, radius 20, padding 22, no border, no shadow. Inner tiles use `--surface-2`, radius 12–16.
- **Hero tile:** each screen has one filled `--brand` card (the most important figure), with white text.
- **Tabs:** segmented control. Track `--track`, radius 12, padding 4. Active segment is a surface fill, radius 9, weight 600.
- **Mobile:**
  - 16px side padding. Top row: menu, bell and avatar, each a 44px circle.
  - Title 26px/700.
  - Tabs become a scrolling row of pill chips. The last chip is intentionally cut off at the edge to show the row scrolls.
  - KPIs sit in a 2×2 grid.
  - Lists become stacked rows or cards.
  - Hit targets are at least 44px.

## Screens
1. **Dashboard**
   - Greeting, with New task and New request buttons.
   - KPI row: Revenue YTD as the hero tile, then Expenses YTD, Net profit YTD and Cash position. Each has an icon, a delta pill, a 40px/700 value and a footnote.
   - A **Revenue by stream** donut. It is tagged "From Finance" and needs the `finance` permission; hide it otherwise.
   - A **Progress tracking** card:
     - Project progress bar with a marker for how much of the timeline has elapsed.
     - Task pipeline, one bar per status.
     - KPIs vs target bars, coloured by Off or Near status.
   - Needs your decision (links to the Approval Center), and Risks & alerts.
   - Company performance tiles, Upcoming deadlines, and Budget used (bar with a year-elapsed marker and the Configurable tag).
2. **Financial Overview**
   - Period segmented control and the "notes waiting" banner.
   - Revenue hero tile, and a 12-month revenue vs costs bar chart.
   - Gross profit card containing the investor-note thread, with Reply and Mark done buttons.
   - Operating costs, Net profit and Cash cards, each with "+ Add note for CEO / investor".
   - Runway card: a bar with the 2-month alert marker, tagged Configurable.
3. **Finance**
   - Tab strip; the Transactions tab shows a "1 draft" badge.
   - Four year-to-date KPIs.
   - Net profit by month: bars above zero in green, below zero in coral `#E8807F`.
   - "Where the money went": horizontal bars for the top 8 expense categories.
   - Latest entries table (Entry, Description, Category, Amount, Status) with Draft, Posted, Reversal and Adjustment tags. Amounts in Geist Mono; money in is green.
4. **Reports & KPIs**
   - Period selector and Copy table as CSV.
   - Tabs, and four KPI tiles.
   - Revenue-by-company smooth area chart; October is dashed because it is month to date.
   - KPI scorecard: per KPI, a progress-to-target bar, a sparkline, the value and a status pill.
   - Department on-time rate empty state, and the work status bar.
5. **Tasks**
   - Workflow strip with 6 numbered steps.
   - Four count tiles.
   - List/Board toggle and filters.
   - Table: key chip, title and project, assignee avatar, priority pill, status pill, due date with relative time, and a progress bar.
   - On mobile each task is a card.
6. **Projects**
   - Status tabs with counts, and a Cards/Table toggle.
   - Selected project card on the left: hero green with a lime ring and a lime progress bar.
   - Detail panel on the right:
     - 4 stat tiles.
     - Tasks, documents, and risks/activity empty states.
     - About text and team list.

## Charts
- Bars have fully rounded ends.
- Revenue bars use `--brand`; expense and cost bars use `--chart-2`.
- Gridlines are 1px `--surface-3`. Y-axis labels are in Geist Mono, 11.5px.
- **October (the month in progress):** 40% opacity in bar charts, a dashed segment in line charts. Always add a note in the caption that it is month to date.
- The donut has 26px stroke and 3px gaps between segments.

## Delta pills
Colour follows **good vs bad**, not up vs down: costs going up are red, and revenue going up is lime.
- Good: lime `#D4F57A` background, `#1F3A10` text.
- Bad: `#D13A40` background, white text.

## Design tokens

| Token | Light | Dark |
|---|---|---|
| --bg | #F3F4F1 | #0E1411 |
| --page (outside app) | #E6E8E3 | #070B09 |
| --surface | #FFFFFF | #18211C |
| --surface-2 | #F6F7F4 | #1F2923 |
| --surface-3 / gridline | #F1F2EE | #232D27 |
| --track (tab bg) | #E9EBE6 | #121915 |
| --border | #E7E9E4 | #28322C |
| --border-strong | #DDE0DA | #323D36 |
| --ink | #121A15 | #E8EEE9 |
| --ink-2 | #3A423C | #C3CCC5 |
| --ink-3 | #4B544D | #B7C1B9 |
| --muted | #6E766F | #94A097 |
| --muted-2 | #7A827C | #8A968D |
| --brand (hero, active, primary) | #0F4D35 | #1B6E4A |
| --brand-link | #0F4D35 | #8FD9AE |
| --brand-2 | #2E8C5F | #2E8C5F |
| --chart-2 (expenses) | #A6E3B8 | #A6E3B8 |
| --lime (good pill) | #D4F57A / ink #1F3A10 | same |
| --danger (bad pill, badges) | #D13A40 | #D13A40 |
| --loss bar | #E8807F | #E8807F |
| amber pill bg / ink | #FCEFD6 / #8A5200 | #3A2C12 / #F2C46B |
| green pill bg / ink | #E3F3EA / #1C6B47 | #143826 / #7FD6A4 |
| blue pill bg / ink | #E6EEFD / #2559B8 | #17284A / #8DB3F5 |
| red soft bg / ink | #FBE4E3 / #B32A30 | #3D1A1A / #F28C8C |
| note banner bg / border | #FCF3DE / #F3E2B8 | #2A2214 / #4A3A1A |

- **Type:** Geist 400/500/600/700, with Geist Mono for codes, IDs, amounts in tables and axis labels.

  | Style | Size | Weight | Letter-spacing |
  |---|---|---|---|
  | Page title | 32px (mobile 26) | 700 | -0.03em |
  | KPI value | 36–40px (mobile 22–24) | 700 | -0.035em |
  | Card title | 16px | 600 | — |
  | Body | 13.5–14px | 400 | — |
  | Caption | 12–12.5px | 400 | — |
  | Pill | 12px | 600 | — |

- **Radius:** pill 99 · card 20 · tile 14–16 · control 12 · tab segment 9 · key chip 6.
- **Spacing:** 4 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 24. Gap between cards is 16px.
- **Shadow:** none inside the app. The artboard drop shadow is presentation only.

## Interactions (unchanged from current app)
All navigation, approvals, the task workflow, the posted-entry lock (corrections use reversal or adjustment entries), period filters, scope switching and investor notes behave as they do today. Add the theme toggle under **Account & theme**: save the choice per user, and default to the OS setting.

## Assets
The mockups use Material Symbols Rounded as a stand-in for icons. **Use the app's existing inline SVG icon set** and map each icon by meaning. There are no images.

## Files
- `Negroni Ledger CEO.dc.html`: all six screens, light.
- `Negroni Ledger CEO Dark.dc.html`: all six screens, dark.
- `Ledger Sidebar.dc.html` / `Ledger Sidebar Dark.dc.html`: shared sidebar.
- `support.js`: preview runtime (only needed to open the files).
