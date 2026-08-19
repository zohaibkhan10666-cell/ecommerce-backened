import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './database/db.js'
import userRoutes from './routes/userRoutes.js'
import productRoutes from './routes/productRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import jazzcashRoutes from './routes/jazzcashRoutes.js'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from backened/.env ONLY for local development.
// On Vercel, env vars are provided via Vercel settings and reading .env files is not allowed.
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  dotenv.config({ path: process.env.DOTENV_PATH || path.join(__dirname, '.env') })
}

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())

// application routes
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/orders/jazzcash', jazzcashRoutes)

// Debug: show mounted endpoints (visible in server logs)
console.log('[ROUTES] /api/v1/orders mounted from backened/routes/orderRoutes.js')
console.log('[ROUTES] /api/v1/orders/jazzcash mounted from backened/routes/jazzcashRoutes.js')
console.log('[ROUTES DEBUG] Expect:')
console.log('  POST /api/v1/orders/jazzcash/initiate-jazzcash')
console.log('  POST /api/v1/orders/jazzcash/callback')

app.get('/', (req, res) => {
  res.send('Hello World! Server is running!')
})

// Catch-all 404 handler to surface the exact path being requested
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    path: req.originalUrl,
    method: req.method
  })
})

// ===== DB init helper (non-blocking) =====
let dbInitPromise
const ensureDB = async () => {
  if (!dbInitPromise) dbInitPromise = connectDB()
  return dbInitPromise
}

// Start DB init in background (non-blocking) so cold starts prime the connection
ensureDB().catch(err => {
  console.error('Startup DB init (non-blocking):', err?.message || err)
})

// ===== Export Express app directly for Vercel Node builder =====
export default app

// ===== Local dev fallback (when not on Vercel) =====
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  connectDB()
    .catch(() => {})
    .finally(() => {
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`)
        console.log(`Test at: http://localhost:${port}/test-email`)
      })
    })
}
