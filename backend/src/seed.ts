import prisma from './lib/prisma'

async function main() {
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
    await prisma.category.upsert({
      where: { id: 0 },
      create: cat,
      update: cat,
    }).catch(() => prisma.category.create({ data: cat }))
  }

  const allCategories = await prisma.category.findMany()
  const now = new Date()
  const sampleRecords = [
    { amount: 35, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 2), note: '午餐', categoryId: allCategories.find(c => c.name === '餐饮')!.id },
    { amount: 5, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 2), note: '公交', categoryId: allCategories.find(c => c.name === '交通')!.id },
    { amount: 15000, type: 'INCOME', date: new Date(now.getFullYear(), now.getMonth(), 1), note: '6月工资', categoryId: allCategories.find(c => c.name === '工资')!.id },
    { amount: 200, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 3), note: '电费', categoryId: allCategories.find(c => c.name === '住房')!.id },
    { amount: 89, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 4), note: '买书', categoryId: allCategories.find(c => c.name === '教育')!.id },
    { amount: 45, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 5), note: '奶茶', categoryId: allCategories.find(c => c.name === '餐饮')!.id },
    { amount: 299, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 6), note: '话费', categoryId: allCategories.find(c => c.name === '通讯')!.id },
    { amount: 500, type: 'INCOME', date: new Date(now.getFullYear(), now.getMonth(), 7), note: '红包', categoryId: allCategories.find(c => c.name === '红包')!.id },
  ]

  for (const record of sampleRecords) {
    await prisma.record.create({ data: record })
  }

  console.log('Seed data created successfully!')
  console.log(`  - ${allCategories.length} categories`)
  console.log(`  - ${sampleRecords.length} sample records`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
