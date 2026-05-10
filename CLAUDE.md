# Trading Journal

## Project Overview
Personal trading journal for tracking trades, analyzing performance, and visualizing P&L.
Single user, no auth needed. Primary instruments: indices (GER40, US30, NAS100 etc.).

## Stack
- **Backend:** FastAPI + SQLAlchemy + SQLite (Python 3.11+)
- **Frontend:** Vite + React + TypeScript
- **Deploy:** Render (backend, free tier) + Vercel (frontend, free tier)

## Project Structure
```
trading-journal/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # P&L charts + summary stats
│   │   │   ├── Trades.tsx       # trades table with filters
│   │   │   └── AddTrade.tsx     # manual trade entry form
│   │   ├── components/
│   │   ├── api/                 # axios/fetch wrappers
│   │   └── types/               # shared TS types
│   └── package.json
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── routes/
│   │   ├── trades.py
│   │   └── stats.py
│   └── requirements.txt
└── CLAUDE.md
```

## Data Model

### Trade
- `id` — int, PK, autoincrement
- `symbol` — str (e.g. "GER40", "US30", "NAS100", "UK100")
- `direction` — "long" | "short"
- `risk` — float (% of account, default 1.0)
- `rr` — float (risk-to-reward ratio, e.g. 2.5)
- `result` — "take" | "stop" | "b/e"
- `pnl_pct` — float (auto-calculated, % of account)
- `date` — datetime
- `session` — "london" | "new_york" | "asian" | "overlap"
- `notes` — str, optional
- `screenshot_5m` — str, optional (TradingView URL)
- `screenshot_1h` — str, optional (TradingView URL)
- `screenshot_4h` — str, optional (TradingView URL)
- `psychology` — list[str], multi-select (stored as JSON array)
- `factors` — list[str], multi-select (stored as JSON array)
- `rating` — int, 0–5 (displayed as hearts ♥)

### PnL calculation
- result = "take": pnl_pct = +risk * rr
- result = "stop": pnl_pct = -risk
- result = "b/e":  pnl_pct = 0

### Psychology options (predefined)
- "FOMO / открылся на эмоциях"
- "Вышел раньше времени"
- "Передержал убыток"
- "Нарушил правила входа"
- "Донабор не по плану"
- "Боялся упустить прибыль"
- "Мстительная торговля"
- "Торговал усталым"
- "Игнорировал новости"
- "По системе ✅"

### Factors
User-defined setup factors, stored in a separate `factors` table (id, name).
Allows creating custom factors like "4h sweep", "liquidity grab", "FVG", "BOS", "OB retest" etc.
Many-to-many with trades via `trade_factors` junction table.

## API Endpoints

### Trades
- POST   /trades          — create trade
- GET    /trades          — list all (supports ?symbol=&direction=&from=&to=&rating=)
- GET    /trades/{id}     — get one
- PUT    /trades/{id}     — update
- DELETE /trades/{id}     — delete

### Factors
- GET    /factors         — list all available factors
- POST   /factors         — create new factor
- DELETE /factors/{id}    — delete factor

### Stats
- GET /stats/summary      — winrate, avg pnl_pct, max drawdown, best/worst trade
- GET /stats/pnl-curve    — cumulative pnl_pct by day (for chart)
- GET /stats/by-symbol    — breakdown per ticker
- GET /stats/by-psychology — winrate breakdown by psychology tag
- GET /stats/by-factor    — winrate breakdown by setup factor

## Frontend Pages

### Dashboard
- Cumulative P&L curve (Recharts LineChart)
- Summary cards: total pnl%, winrate, avg win, avg loss, max drawdown
- Recent trades table (last 10)

### Trades
- Full trades table with columns: date, symbol, direction, risk%, rr, result, pnl%, rating (hearts), psychology, factors
- Sorting + filtering by symbol / direction / date / rating / result
- Edit and delete per row

### Add Trade
- Form fields: symbol, direction, risk (%, default 1), rr, result (take/stop/b/e), date, session
- Screenshots: 3 URL input поля — 5m, 1h, 4h (TradingView ссылки). При клике открываются в новой вкладке, превью показывается инлайн через TradingView snapshot
- Psychology: multi-select dropdown with predefined options
- Factors: multi-select dropdown with user-defined factors (can create new inline)
- Rating: 0–5 heart picker (♡♡♡♡♡ → ♥♥♥♥♥)
- Trade notes textarea
- Auto-preview of calculated pnl_pct before submit

## Conventions
- Primary instrument: GER40 (also US30, NAS100, UK100)
- Risk always in % of account (default 1%)
- RR is the actual realized ratio, not planned
- pnl_pct auto-calculated from risk × rr × result
- Dates stored as UTC ISO strings
- CORS enabled for localhost:5173 (dev) and Vercel domain (prod)
- Backend runs on port 8000
- No authentication (personal use only)
- Error responses: { "detail": "message" }

## Dev Commands
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./trading.db
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000   # dev
VITE_API_URL=https://your-app.onrender.com  # prod
```
