# Smoke Tests

Run API smoke against a running backend:

```bash
SMOKE_API_URL=http://localhost:8000 node scripts/smoke-api.mjs
```

The script creates a temporary user and verifies auth, settings, symbols, factors, strategies, trades, journal, stats, and trade deletion.
