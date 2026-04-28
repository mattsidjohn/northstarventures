import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import propertiesRouter from './routes/properties'
import monthlyDataRouter from './routes/monthlyData'
import scorecardsRouter from './routes/scorecards'
import portfolioRouter from './routes/portfolio'
import backupRouter from './routes/backup'
import dealsRouter from './routes/deals'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '5mb' }))

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'same-origin')
  next()
})

app.use('/api/properties', propertiesRouter)
app.use('/api/properties/:id/monthly', monthlyDataRouter)
app.use('/api/properties/:id/scorecards', scorecardsRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/backup', backupRouter)
app.use('/api/deals', dealsRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Global error handler — prevents stack traces from leaking to clients
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`North Star API running on http://localhost:${PORT}`)
})
