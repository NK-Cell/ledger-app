import bcrypt from 'bcryptjs'
import prisma from './lib/prisma'

async function main() {
  const existing = await prisma.user.findFirst()
  if (existing) {
    console.log('Seed already run, skipping.')
    process.exit(0)
  }

  const password = process.env.SEED_PASSWORD || 'admin123'
  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { username: 'default', password: hash },
  })
  console.log(`User created: ${user.username} / ${password}`)

  const categories = [
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

  for (const cat of categories) {
    await prisma.category.create({ data: { ...cat, userId: user.id } })
  }

  console.log(`${categories.length} categories created`)
  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
