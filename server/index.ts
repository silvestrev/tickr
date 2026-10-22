import { WebSocket, WebSocketServer } from 'ws';

// ---------------------------------------------------------------------------
// Tickr simulated feed
//
// - Sends a full snapshot when a client connects
// - Then streams individual tick messages (one message per tick on purpose:
//   this is the "naive" feed the client will later learn to batch)
// - Prices follow a simple random walk
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 8080);
const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 100);
const TICKS_PER_INTERVAL = Number(process.env.TICKS_PER_INTERVAL ?? 20);

const SYMBOLS = [
  'PETR4',
  'VALE3',
  'ITUB4',
  'BBDC4',
  'ABEV3',
  'BBAS3',
  'B3SA3',
  'WEGE3',
  'RENT3',
  'SUZB3',
  'JBSS3',
  'GGBR4',
  'ELET3',
  'RADL3',
  'RAIL3',
  'EQTL3',
  'PRIO3',
  'CSAN3',
  'LREN3',
  'HAPV3',
  'BPAC11',
  'SBSP3',
  'VIVT3',
  'CMIG4',
  'ENEV3',
  'UGPA3',
  'CPLE6',
  'TOTS3',
  'MGLU3',
  'BRFS3',
  'KLBN11',
  'CCRO3',
  'CSNA3',
  'USIM5',
  'GOAU4',
  'CYRE3',
  'MRVE3',
  'EMBR3',
  'AZUL4',
  'COGN3',
  'NTCO3',
  'ASAI3',
  'CRFB3',
  'BEEF3',
  'MRFG3',
  'BRAP4',
  'TAEE11',
  'SANB11',
  'ALPA4',
  'YDUQ3',
];

interface Quote {
  symbol: string;
  price: number;
  open: number;
  change: number;
  changePercent: number;
  volume: number;
  ts: number;
}

type ServerMessage =
  | { type: 'snapshot'; quotes: Quote[] }
  | { type: 'tick'; quote: Quote };

const round = (n: number) => Math.round(n * 100) / 100;

const quotes = new Map<string, Quote>(
  SYMBOLS.map((symbol) => {
    const open = round(10 + Math.random() * 90);
    return [
      symbol,
      {
        symbol,
        price: open,
        open,
        change: 0,
        changePercent: 0,
        volume: Math.floor(Math.random() * 1_000_000),
        ts: Date.now(),
      },
    ];
  }),
);

function nextTick(quote: Quote): Quote {
  // random walk: roughly +-0.1% per tick
  const move = (Math.random() - 0.5) * 0.002;
  const price = Math.max(0.01, round(quote.price * (1 + move)));
  const change = round(price - quote.open);
  return {
    ...quote,
    price,
    change,
    changePercent: round((change / quote.open) * 100),
    volume: quote.volume + Math.floor(Math.random() * 500),
    ts: Date.now(),
  };
}

function send(client: WebSocket, message: ServerMessage) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (client) => {
  console.log(`client connected (${wss.clients.size} total)`);
  send(client, { type: 'snapshot', quotes: [...quotes.values()] });

  client.on('close', () => {
    console.log(`client disconnected (${wss.clients.size} total)`);
  });
});

setInterval(() => {
  if (wss.clients.size === 0) return;

  for (let i = 0; i < TICKS_PER_INTERVAL; i++) {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const current = quotes.get(symbol);
    if (!current) continue;

    const updated = nextTick(current);
    quotes.set(symbol, updated);

    for (const client of wss.clients) {
      send(client, { type: 'tick', quote: updated });
    }
  }
}, TICK_INTERVAL_MS);

console.log(
  `Tickr feed on ws://localhost:${PORT} ` +
    `(${SYMBOLS.length} symbols, ~${Math.round(
      (TICKS_PER_INTERVAL * 1000) / TICK_INTERVAL_MS,
    )} ticks/s)`,
);
