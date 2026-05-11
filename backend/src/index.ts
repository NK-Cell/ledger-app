import express from 'express'
import cors from 'cors'
import categoriesRouter from './routes/categories'
import recordsRouter from './routes/records'
import statisticsRouter from './routes/statistics'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/categories', categoriesRouter)
app.use('/api/records', recordsRouter)
app.use('/api/statistics', statisticsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
