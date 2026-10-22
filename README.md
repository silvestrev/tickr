# Tickr

Real-time trading dashboard with live simulated quotes over WebSocket, a sortable table and charts, focused on render performance.

**Status:** In progress

## Goals

- Stream simulated quotes for ~100 tickers at several updates per second
- Keep the UI smooth (60 FPS) under constant data flow
- Show _measurable_ performance decisions, not just a working UI

## Features

- [ ] WebSocket server that simulates price ticks (random walk)
- [ ] Live quotes table: sortable by symbol, price, change %, volume
- [ ] Flash on price change (up/down) without re-rendering the whole table
- [ ] Price chart for the selected ticker (updates in real time)
- [ ] Connection status + automatic reconnect
- [ ] Performance panel (FPS, renders per second, messages per second)

## Stack

- React + TypeScript + Vite
- Node.js + `ws` for the simulated feed
- Tailwind CSS (zero runtime cost, which matters for a render-focused project)
- shadcn/ui for non-core components only (the quotes table and charts are custom)
- Testing: React Testing Library, Playwright

## Architecture

```
server/            Node + ws: generates ticks and broadcasts them
src/
  data/            WebSocket client + external quotes store
  features/
    quotes-table/  table, sorting, row component
    price-chart/   chart for the selected ticker
    perf-panel/    FPS / renders / messages per second
  shared/          types, utils, hooks
```

Key idea: ticks do **not** go through React state one by one. They are buffered in an
external store and flushed to the UI in batches (once per animation frame), and each row
subscribes only to its own ticker.

## Performance plan

1. **Baseline first:** build the naive version (setState per message) and measure it
2. **Batch updates:** buffer messages, flush with `requestAnimationFrame`
3. **Granular subscriptions:** `useSyncExternalStore` per row, `React.memo` on rows
4. **Virtualize the table** for large lists
5. **Chart on canvas** instead of DOM/SVG nodes
6. **Compare** before vs. after with the React Profiler and the perf panel, and record the numbers here

## Results

_To be filled with before/after numbers (FPS, renders/s, CPU)._

## Running locally

```bash
npm install
npm run server   # starts the simulated feed
npm run dev      # starts the app
```

## Roadmap

- [ ] Phase 1: project setup + WebSocket server + naive table
- [ ] Phase 2: sorting + connection handling
- [ ] Phase 3: performance pass (batching, memo, subscriptions)
- [ ] Phase 4: chart + perf panel
- [ ] Phase 5: tests, polish, README with results and a short demo GIF
