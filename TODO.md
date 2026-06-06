# Backend TODO - env & server fixes

- [ ] Make auth use a single JWT secret env var (JWT_SECRET / SECRET_KEY) consistently.
- [ ] Fix order route/payment to rely on correct req.id + req.user from isAuthenticated.
- [ ] Ensure JazzCash env vars exist (JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, JAZZCASH_RETURN_URL) or provide safe fallback.
- [ ] Align PM2 ecosystem PORT in ecosystem.config.cjs with desired PORT=8000.
- [ ] Ensure server uses correct dotenv path and does not crash if env missing.
- [ ] Validate server boots with: `node server.mjs` and then test `GET /test-email`.

