# Fleet Condition Monitor

A production React + TypeScript implementation of the "Fleet Condition Monitor v2"
design (see `../project/Fleet Condition Monitor v2.dc.html` and `../chats/` for the
original design prototype and the conversations behind it).

Four tabs:

- **Hull Performance Dashboard** — fleet-wide KPIs, condition/deviation/speed-reliability
  breakdowns, a searchable/sortable vessel grid, and a per-vessel detail drawer.
- **Hull Summary** — vessels triaged into Immediate action / Monitor closely / Within
  limits bands by ME excess power and its deviation, with per-band Excel export and
  "done" checklists.
- **Smart Analytics Dashboard** — engine (ME/AE/Boiler) performance per vessel, with
  sensor-vs-noon authoritative-reading highlighting (sensor for L2 vessels, noon for L1).
- **Smart Analytics Summary** — the same engine metrics triaged into priority bands per
  subsystem.

## Data

The app parses a monthly performance workbook (`.xlsx`) client-side — no backend.
A sample workbook is bundled at `public/data/` and loads by default; use the
**Upload workbook** button in the header to load a different month's file. Parsed
data, per-vessel remarks, and "done" checkboxes are cached in the browser's
`localStorage` (per-browser only, not shared across users).

The workbook must have one sheet per reporting month, each with a header row
containing an `IMO` column and a `Hull Cleaning` column (see
`src/lib/workbookParser.ts` for the full column-matching rules).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
