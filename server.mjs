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

// Load env from backened/.env (safe default for local dev)
dotenv.config({ path: process.env.DOTENV_PATH || path.join(__dirname, '.env') })

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

// Debug: show mounted endpoints
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

// ===== Vercel serverless handler =====
// IMPORTANT: Do not use app.listen() in serverless.
// Expose a request handler compatible with @vercel/node.

let dbInitPromise
const ensureDB = async () => {
  if (!dbInitPromise) {
    dbInitPromise = connectDB()
  }
  return dbInitPromise
}

export default async function handler(req, res) {
  try {
    await ensureDB()
    return app(req, res)
  } catch (err) {
    console.error('Serverless handler error:', err)
    // Still respond deterministically so UI doesn't show crashed function.
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// ===== Local dev fallback =====
// When running `node server.mjs` locally, start a server.
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



