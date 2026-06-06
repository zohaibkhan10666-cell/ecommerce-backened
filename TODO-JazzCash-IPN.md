# JazzCash IPN Integration TODO (completed/remaining)

## Implemented
- [x] Added webhook endpoint: `POST /api/v1/orders/jazzcash/callback`
  - Files: `backened/routes/jazzcashRoutes.js`, `backened/database/controllers/jazzcashController.js`
- [x] Registered route in: `backened/server.mjs`
- [x] Updated `initiateJazzcashPayment` to create order as `pending` and finalize only after IPN
- [x] Kept test mode token `test123` working (demo success)

## Remaining (verify with real JazzCash)
- [ ] Ensure `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT` are set in `backened/.env`
- [ ] Confirm JazzCash callback payload field names for real IPN
- [ ] Validate hash verification against actual JazzCash callback spec (if `pp_SecureHash` is present)
- [ ] Optionally add more robust idempotency using gateway txn ref + order txn ref

