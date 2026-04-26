import express from 'express'
import cors from 'cors'
import propertiesRouter from './routes/properties'
import monthlyDataRouter from './routes/monthlyData'
import scorecardsRouter from './routes/scorecards'
import portfolioRouter from './routes/portfolio'
import backupRouter from './routes/backup'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))

app.use('/api/properties', propertiesRouter)
app.use('/api/properties/:id/monthly', monthlyDataRouter)
app.use('/api/properties/:id/scorecards', scorecardsRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/backup', backupRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`North Star API running on http://localhost:${PORT}`)
})
