# TODO - Fix Vercel API Fetch Issue

- [ ] Identify why Vercel serverless `/api/v1/*` fails (Express adapter / routing mismatch).
- [ ] Fix Vercel handler so it uses a Vercel/Node-compatible adapter for Express (no `res.setHeader is not a function`).
- [ ] Ensure Vercel routes map to the correct handler (`vercel.json`).
- [ ] Add a minimal health endpoint (optional) to confirm handler is invoked on Vercel.
- [ ] Verify locally with `npx vercel dev` once authentication + runtime works.
- [ ] Fix MongoDB buffering timeout by failing fast when DB isn’t connected (or allow fallback) so endpoints return meaningful errors.
- [ ] Commit changes on a `blackboxai/*` branch.
- [ ] Push changes to GitHub repo: https://github.com/zohaibkhan10666-cell/ecommerce-backened.git

