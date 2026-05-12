import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/summary', async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear()
  const month = req.query.month ? parseInt(req.query.month as string) : undefined

  const dateFilter: any = {}
  if (month !== undefined) {
    dateFilter.gte = new Date(year, month - 1, 1)
    dateFilter.lt = new Date(year, month, 1)
  } else {
    dateFilter.gte = new Date(year, 0, 1)
    dateFilter.lt = new Date(year + 1, 0, 1)
  }

  const records = await prisma.record.findMany({
    where: { userId: req.userId, date: dateFilter },
    include: { category: true },
  })

  const totalIncome = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0)
  const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0)
  const balance = totalIncome - totalExpense

  const byCategory: Record<string, { category: { id: number; name: string; icon: string; color: string }; total: number; count: number }> = {}
  for (const r of records) {
    const key = `${r.type}-${r.categoryId}`
    if (!byCategory[key]) {
      byCategory[key] = {
        category: { id: r.category.id, name: r.category.name, icon: r.category.icon, color: r.category.color },
        total: 0,
        count: 0,
      }
    }
    byCategory[key].total += r.amount
    byCategory[key].count++
  }

  res.json({
    year,
    month,
    totalIncome,
    totalExpense,
    balance,
    recordCount: records.length,
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
  })
})

router.get('/trends', async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear()

  const records = await prisma.record.findMany({
    where: {
      userId: req.userId,
      date: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  })

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthRecords = records.filter(
      r => r.date.getMonth() === i
    )
    return {
      month: i + 1,
      income: monthRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0),
      expense: monthRecords.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0),
      count: monthRecords.length,
    }
  })

  res.json({ year, months })
})

export default router
