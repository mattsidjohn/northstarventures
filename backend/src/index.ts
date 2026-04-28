import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { requireAuth } from './middleware/auth'
import propertiesRouter from './routes/properties'
import monthlyDataRouter from './routes/monthlyData'
import scorecardsRouter from './routes/scorecards'
import portfolioRouter from './routes/portfolio'
import backupRouter from './routes/backup'
import dealsRouter from './routes/deals'

const app = express()
const PORT = process.env.PORT ?? 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '5mb' }))

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'same-origin')
  next()
})

// Public
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Protected — all routes require a valid Supabase JWT
app.use('/api/properties', requireAuth, propertiesRouter)
app.use('/api/properties/:id/monthly', requireAuth, monthlyDataRouter)
app.use('/api/properties/:id/scorecards', requireAuth, scorecardsRouter)
app.use('/api/portfolio', requireAuth, portfolioRouter)
app.use('/api/backup', requireAuth, backupRouter)
app.use('/api/deals', requireAuth, dealsRouter)

// Global error handler — prevents stack traces from leaking to clients
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`North Star API running on http://localhost:${PORT}`)
})
