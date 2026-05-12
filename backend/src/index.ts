import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import categoriesRouter from './routes/categories'
import recordsRouter from './routes/records'
import statisticsRouter from './routes/statistics'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/categories', authMiddleware, categoriesRouter)
app.use('/api/records', authMiddleware, recordsRouter)
app.use('/api/statistics', authMiddleware, statisticsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Database: ${process.env.DATABASE_URL}`)
})

export default app
