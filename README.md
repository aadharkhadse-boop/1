# Fleet Condition Monitor

A production React + TypeScript implementation of the "Fleet Condition Monitor v2"
design (see `../project/Fleet Condition Monitor v2.dc.html` and `../chats/` for the
original design prototype and the conversations behind it).

Five tabs:

- **Hull Performance Dashboard** — fleet-wide KPIs, condition/deviation/speed-reliability
  breakdowns, a searchable/sortable vessel grid, and a per-vessel detail drawer.
- **Hull Summary** — vessels triaged into High / Medium / Low priority bands by ME excess
  power and its deviation, plus a separate Action Required section, with per-band Excel
  export and "done" checklists.
- **Smart Analytics Dashboard** — engine (ME/AE/Boiler) performance per vessel, with
  sensor-vs-noon authoritative-reading highlighting (sensor for L2 vessels, noon for L1).
- **Smart Analytics Summary** — the same engine metrics triaged into priority bands per
  subsystem.
- **CII Dashboard** — Carbon Intensity Indicator rating (A–E) and EU ETS exposure per vessel.

## Data — adding a new month

Reporting data lives in **`src/data/monthly/`**, one `.xlsx` file per reporting month,
named `YYYY-MM.xlsx` (e.g. `2026-07.xlsx` for July 2026). Every file in that folder is
picked up automatically at build time (via Vite's `import.meta.glob`) and sorted
chronologically by filename — there's no manifest to maintain.

**To add a new month:** export that month's report as its own workbook (same column
layout as the existing files — a `Report` sheet with `IMO`/`Hull Cleaning` columns, and
optionally a `CII` sheet), name it `YYYY-MM.xlsx`, and drop it into `src/data/monthly/`
alongside the existing files. **Never delete or overwrite prior months' files** — the
app rebuilds all the trend charts and month-over-month deviation figures from however
many files are present. Commit and push; if Netlify is connected to the repo, it
auto-rebuilds and the new month appears for every visitor.

Month labels shown throughout the app (chart axes, the header's reporting-month pill,
"changed in ⟨month⟩" badges, etc.) are derived from each file's `YYYY-MM` name — there's
no hardcoded month list, so this keeps working correctly no matter how many months
accumulate or which calendar months they span.

There's intentionally no in-app upload control and no persisted cache of parsed data —
every page load re-fetches and re-parses whatever files are currently in
`src/data/monthly/`, so a newly added month is guaranteed to show up on next visit
rather than being masked by stale cached data.

Per-vessel remarks and Hull/Smart-Analytics-Summary "done" checkboxes are the only
things still cached, in the browser's `localStorage` (per-browser only, not shared
across users, and unaffected by workbook updates).

See `src/lib/workbookParser.ts` for the full column-matching rules (the exact header
text each field is detected by), and `src/lib/ciiParser.ts` for the CII sheet's rules.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
