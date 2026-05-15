# Floatfolio — prototype

Static HTML mockups for a single-user investments dashboard (Moomoo stocks, TNG e-Mas gold, Luno crypto).

## Run

```sh
open prototype/index.html        # macOS — opens in your default browser
# or
npx serve prototype               # serves at http://localhost:3000
```

No build step. Tailwind via CDN, plain vanilla JS.

## Screens

- **index.html** — nav linking the five screens.
- **dashboard.html** — hero P/L, three asset-class cards, today's top movers, 30-day equity preview, allocation bar. Empty-state variant included as commented HTML.
- **holdings.html** — sortable table, filter chips (All / Stocks / Gold / Crypto), slide-over add-holding drawer with conditional fields per asset class, delete-confirm modal.
- **history.html** — KPI strip (best/worst day, total return, days tracked), equity curve with cost-basis overlay, GitHub-style daily P/L heatmap, contribution-to-return breakdown.
- **settings.html** — account, integrations (Luno API key/secret with show/hide and test connection), preferences (gold spread, default currency, theme), danger zone with typed-confirm wipe modal.
- **login.html** — centered magic-link card with idle + sent-confirmation states (loading state included as commented HTML).

The MYR ⇄ USD toggle in every header reformats every `[data-myr]` element live; theme + currency preferences persist via `localStorage`.
