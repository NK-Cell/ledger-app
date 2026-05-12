import { Router, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(categories)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, type, icon, color } = req.body
  if (!name || !type) {
    res.status(400).json({ error: 'name and type are required' })
    return
  }
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
    return
  }
  const category = await prisma.category.create({
    data: { name, type, icon: icon || '📦', color: color || '#6B7280', userId: req.userId! },
  })
  res.status(201).json(category)
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { name, type, icon, color } = req.body
  if (type && !['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
    return
  }
  try {
    const existing = await prisma.category.findFirst({ where: { id, userId: req.userId } })
    if (!existing) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    const category = await prisma.category.update({
      where: { id },
      data: { ...(name && { name }), ...(type && { type }), ...(icon && { icon }), ...(color && { color }) },
    })
    res.json(category)
  } catch {
    res.status(404).json({ error: 'Category not found' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const existing = await prisma.category.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Category not found' })
    return
  }
  const recordCount = await prisma.record.count({ where: { categoryId: id } })
  if (recordCount > 0) {
    res.status(400).json({ error: 'Cannot delete category with existing records', count: recordCount })
    return
  }
  await prisma.category.delete({ where: { id } })
  res.json({ success: true })
})

export default router
