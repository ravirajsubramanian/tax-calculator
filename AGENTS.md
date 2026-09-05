# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project Overview

Static Advance Tax calculator for Indian citizens. No framework, no build step, no dependencies, no backend.

- `index.html` — markup + all CSS (inline `<style>`) + page structure. Two views: Home (`page-home`) and Calculator (`page-calc`).
- `script.js` — all client-side logic: tab switching, dynamic rows, tax calculation engine, localStorage persistence.
- `README.md` — user-facing description.
- `LICENSE` — GNU GPLv3.

## How to Run / Preview

No build or install. Open `index.html` directly in a browser, or serve statically:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no automated tests or linters configured. Verify changes manually in a browser (check both Home and Calculator pages, desktop and mobile widths).

## Tax Logic (do not change rates without explicit request)

Defined in `calculateTax()` in `script.js`:

- Slab-taxed income: bank interest + dividends + gold STCG + debt gains, taxed at user-selected slab rate (`slab-rate`, default 30%).
- Equity STCG: flat 20%.
- Equity LTCG: 12.5% on amount over ₹1,25,000 exemption.
- Gold LTCG: flat 12.5%.
- Debt gains (short + long): taxed at slab rate.

Due-date schedule shown on Home page (FY 2026-27): Jun 15 → 15%, Sep 15 → 45%, Dec 15 → 75%, Mar 15 → 100%. Update the FY label when rolling to a new financial year.

## Code Conventions

- Vanilla JS only. Do not add frameworks, bundlers, or npm dependencies without explicit user approval.
- Keep the single-file structure: styles stay inline in `index.html`, logic stays in `script.js`.
- IDs are the contract between HTML and JS: `slab-rate`, `bank-container`, `dividend-container`, `bank_account_N`, `dividend_account_N`, `equity-stcg`, `equity-ltcg`, `gold-stcg`, `gold-ltcg`, `debt-gains`, `installment`, `advance-paid`, `lbl-slab-income`, `lbl-slab-tax`, `lbl-cg-tax`, `lbl-total-tax`, `lbl-installment-desc`, `lbl-installment-due`, `lbl-advance-paid`, `lbl-amount-due`. Rename only if updating both files.
- Event wiring: static inputs are wired in `window.onload`; dynamic rows use inline `oninput="calculateTax()"` / `onclick` plus a JS-added `input` listener in `addDynamicRow()`. Preserve this pattern when adding new fields.
- `calculateTax` is debounced at 500ms — keep the debounce.
- Input validation: `validateInput()` coerces empty to `0` and rejects negatives/NaN. New numeric inputs must follow the same pattern and persist to `localStorage` under their element id.
- localStorage keys: `slab-rate`, `installment`, `bank_account_*`, `dividend_account_*`, plus one key per static input id. `resetAllValues()` zeroes values but keeps keys, and resets `slab-rate` to 30 and `installment` to 100. Do not call `localStorage.clear()`.
- Currency formatting: `toLocaleString('en-IN')` with `₹` prefix. Reuse for new money labels.
- Responsive breakpoints already in use: `768px` (grid-2), `992px` (calculator-layout). Follow them for new layouts.
- Commented-out dead code at the bottom of `script.js` (`addNewAccount`, `removeAcccount`) — do not resurrect; delete only if touching that area and the user agrees.

## Making Changes

- Prefer minimal diffs. This is a small public-facing tool; avoid refactors.
- When adding a new income category: add a `form-section` in `index.html`, wire persistence + validation in `window.onload` in `script.js`, include it in the correct tax bucket in `calculateTax()`, and update the Tax Summary sidebar if a new total is needed.
- When adding dynamic (repeatable) rows: reuse `addDynamicRow(containerId, placeholderText)` and the `bank_account_` / `dividend_account_` naming pattern; extend `loadFromLocalStorage()` accordingly.
- Confirm dialogs (`resetAllValues`) use native `confirm()` — keep it simple, no modal library.

## License

GPLv3. Keep the license file intact. New source files should carry the GPL header notice described at the end of `LICENSE`.
