import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'ledger-dev-secret-change-in-production'
const router = Router()

const DEFAULT_CATEGORIES = [
  { name: '餐饮', type: 'EXPENSE', icon: '🍽️', color: '#EF4444' },
  { name: '交通', type: 'EXPENSE', icon: '🚗', color: '#F97316' },
  { name: '购物', type: 'EXPENSE', icon: '🛍️', color: '#EAB308' },
  { name: '住房', type: 'EXPENSE', icon: '🏠', color: '#22C55E' },
  { name: '娱乐', type: 'EXPENSE', icon: '🎮', color: '#3B82F6' },
  { name: '医疗', type: 'EXPENSE', icon: '💊', color: '#8B5CF6' },
  { name: '教育', type: 'EXPENSE', icon: '📚', color: '#EC4899' },
  { name: '通讯', type: 'EXPENSE', icon: '📱', color: '#6366F1' },
  { name: '工资', type: 'INCOME', icon: '💰', color: '#22C55E' },
  { name: '兼职', type: 'INCOME', icon: '💼', color: '#3B82F6' },
  { name: '红包', type: 'INCOME', icon: '🧧', color: '#EF4444' },
  { name: '理财', type: 'INCOME', icon: '📈', color: '#8B5CF6' },
]

router.get('/status', async (_req: Request, res: Response) => {
  const count = await prisma.user.count()
  res.json({ initialized: count > 0 })
})

router.post('/setup', async (req: Request, res: Response) => {
  const existing = await prisma.user.count()
  if (existing > 0) {
    res.status(400).json({ error: '账户已存在，请直接登录' })
    return
  }

  const { password } = req.body
  if (!password || password.length < 4) {
    res.status(400).json({ error: '密码至少 4 位' })
    return
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { username: 'default', password: hash },
  })

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.create({ data: { ...cat, userId: user.id } })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.status(201).json({ token, username: user.username })
})

router.post('/login', async (req: Request, res: Response) => {
  const { password } = req.body
  if (!password) {
    res.status(400).json({ error: '请输入密码' })
    return
  }

  const user = await prisma.user.findFirst({ orderBy: { id: 'asc' } })
  if (!user) {
    res.status(401).json({ error: '尚未创建账户' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: '密码错误' })
    return
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, username: user.username })
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, createdAt: true },
  })
  if (!user) {
    res.status(401).json({ error: '用户不存在' })
    return
  }
  res.json(user)
})

export default router
