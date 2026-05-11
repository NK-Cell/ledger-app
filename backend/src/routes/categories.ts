import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json(categories)
})

router.post('/', async (req: Request, res: Response) => {
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
    data: { name, type, icon: icon || '📦', color: color || '#6B7280' },
  })
  res.status(201).json(category)
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { name, type, icon, color } = req.body
  if (type && !['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ error: 'type must be INCOME or EXPENSE' })
    return
  }
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { ...(name && { name }), ...(type && { type }), ...(icon && { icon }), ...(color && { color }) },
    })
    res.json(category)
  } catch {
    res.status(404).json({ error: 'Category not found' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const recordCount = await prisma.record.count({ where: { categoryId: id } })
  if (recordCount > 0) {
    res.status(400).json({ error: 'Cannot delete category with existing records', count: recordCount })
    return
  }
  try {
    await prisma.category.delete({ where: { id } })
    res.json({ success: true })
  } catch {
    res.status(404).json({ error: 'Category not found' })
  }
})

export default router
