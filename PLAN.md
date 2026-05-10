# Trading Journal — Development Plan

## Status legend
- [ ] not started
- [x] done
- [~] in progress

---

## Этап 1 — Бэкенд: Инфраструктура
- [x] Создать структуру папок (`backend/`, `frontend/`)
- [x] `requirements.txt` — fastapi, uvicorn, sqlalchemy, pydantic, python-dotenv, alembic
- [x] `database.py` — SQLite engine, сессия, Base
- [x] `.env` + `.env.example` с `DATABASE_URL` и `FRONTEND_URL`

## Этап 2 — Бэкенд: Модели БД
- [x] `models.py` — таблица `trades` со всеми полями, `psychology` как JSON
- [x] `models.py` — таблица `factors` (id, name)
- [x] `models.py` — junction table `trade_factors`
- [x] `Base.metadata.create_all()` при старте (или alembic migration)

## Этап 3 — Бэкенд: Схемы Pydantic
- [x] `schemas.py` — `TradeCreate` / `TradeUpdate` / `TradeOut` с enum-валидацией
- [x] `schemas.py` — `FactorCreate` / `FactorOut`
- [x] Автовычисление `pnl_pct` в `TradeCreate` (take → +risk×rr, stop → -risk, b/e → 0)

## Этап 4 — Бэкенд: CRUD-роуты
- [x] `routes/trades.py` — `POST /trades`
- [x] `routes/trades.py` — `GET /trades` с query params (symbol, direction, from, to, rating)
- [x] `routes/trades.py` — `GET /trades/{id}`, `PUT /trades/{id}`, `DELETE /trades/{id}`
- [x] `routes/factors.py` — `GET /factors`, `POST /factors`, `DELETE /factors/{id}`

## Этап 5 — Бэкенд: Stats-роуты
- [x] `GET /stats/summary` — winrate, avg pnl, max drawdown, best/worst
- [x] `GET /stats/pnl-curve` — кумулятивный P&L по дням
- [x] `GET /stats/by-symbol` — разбивка по тикеру
- [x] `GET /stats/by-psychology` — winrate по психологическому тегу
- [x] `GET /stats/by-factor` — winrate по фактору

## Этап 6 — Бэкенд: Сборка и проверка
- [x] `main.py` — подключить роутеры, настроить CORS
- [x] Проверка через Swagger UI `/docs`: создать сделки, проверить stats
- [x] Edge cases: b/e → pnl=0, пустые factors/psychology

## Этап 7 — Фронтенд: Инфраструктура
- [x] `npm create vite` — React + TypeScript
- [x] Установить зависимости: recharts, axios, react-router-dom, tailwindcss
- [x] `src/api/` — axios instance + обёртки для trades и factors
- [x] `src/types/` — типы `Trade`, `Factor`, `StatsResponse`

## Этап 8 — Фронтенд: AddTrade
- [x] Поля формы: symbol, direction, risk, rr, result, date, session
- [x] Multi-select psychology (predefined список)
- [x] Multi-select factors (загрузка с API + создание inline)
- [x] 3 URL-поля для скриншотов + inline превью
- [x] Heart picker 0–5
- [x] Авто-превью `pnl_pct` до сабмита

## Этап 9 — Фронтенд: Trades
- [x] Таблица со всеми колонками (hearts, badges)
- [x] Фильтры: symbol, direction, result, rating, date range
- [x] Сортировка по колонкам
- [x] Edit (prefill форма) / Delete (confirm)

## Этап 10 — Фронтенд: Dashboard
- [x] Summary cards: total pnl%, winrate, avg win, avg loss, max drawdown
- [x] Recharts LineChart — кумулятивная кривая P&L
- [x] Таблица последних 10 сделок

## Этап 11 — Deploy
- [ ] Backend → Render: start command, env vars
- [ ] Frontend → Vercel: `VITE_API_URL`, SPA redirect
- [ ] Проверить CORS (Vercel URL в `FRONTEND_URL`)
