import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', startDate, endDate, categoryId, type } = req.query
  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const take = parseInt(pageSize as string)

  const where: any = {}
  if (startDate) where.date = { ...(where.date || {}), gte: new Date(startDate as string) }
  if (endDate) where.date = { ...(where.date || {}), lte: new Date(endDate as string) }
  if (categoryId) where.categoryId = parseInt(categoryId as string)
  if (type) where.type = type as string

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.record.count({ where }),
  ])

  res.json({
    data: records,
    total,
    page: parseInt(page as string),
    pageSize: take,
    totalPages: Math.ceil(total / take),
  })
})

router.post('/', async (req: Request, res: Response) => {
  const { amount, type, date, note, categoryId } = req.body
  if (amount == null || !type || !date || !categoryId) {
    res.status(400).json({ error: 'amount, type, date, and categoryId are required' })
    return
  }
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
    return
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    res.status(400).json({ error: 'Category not found' })
    return
  }
  const record = await prisma.record.create({
    data: { amount: parseFloat(amount), type, date: new Date(date), note, categoryId },
    include: { category: true },
  })
  res.status(201).json(record)
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { amount, type, date, note, categoryId } = req.body
  const data: any = {}
  if (amount != null) data.amount = parseFloat(amount)
  if (type) {
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
      return
    }
    data.type = type
  }
  if (date) data.date = new Date(date)
  if (note !== undefined) data.note = note
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      res.status(400).json({ error: 'Category not found' })
      return
    }
    data.categoryId = categoryId
  }
  try {
    const record = await prisma.record.update({
      where: { id },
      data,
      include: { category: true },
    })
    res.json(record)
  } catch {
    res.status(404).json({ error: 'Record not found' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  try {
    await prisma.record.delete({ where: { id } })
    res.json({ success: true })
  } catch {
    res.status(404).json({ error: 'Record not found' })
  }
})

router.post('/batch', async (req: Request, res: Response) => {
  const { records } = req.body
  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: 'records array is required' })
    return
  }
  for (const r of records) {
    if (r.amount == null || !r.type || !r.date || !r.categoryId) {
      res.status(400).json({ error: 'Each record needs amount, type, date, and categoryId' })
      return
    }
    if (!['INCOME', 'EXPENSE'].includes(r.type)) {
      res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
      return
    }
  }
  const created = await prisma.$transaction(
    records.map(r =>
      prisma.record.create({
        data: {
          amount: parseFloat(r.amount),
          type: r.type,
          date: new Date(r.date),
          note: r.note || null,
          categoryId: r.categoryId,
        },
        include: { category: true },
      })
    )
  )
  res.status(201).json({ records: created, count: created.length })
})

export default router
