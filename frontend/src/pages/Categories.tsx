import { useState, useEffect } from 'react'
import { categoryApi } from '../api'
import type { Category, CategoryFormData } from '../types'
import CategoryForm from '../components/CategoryForm'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null)
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

  const fetchCategories = () => {
    setLoading(true)
    categoryApi.list().then(setCategories).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  const handleCreate = async (data: CategoryFormData) => {
    await categoryApi.create(data)
    setShowForm(false)
    fetchCategories()
  }

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editingCategory || !('id' in editingCategory)) return
    await categoryApi.update((editingCategory as any).id, data)
    setEditingCategory(null)
    fetchCategories()
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.delete(id)
      fetchCategories()
    } catch (err: any) {
      alert(err.response?.data?.error || '删除失败')
    }
  }

  const startEdit = (cat: Category) => {
    setEditingCategory({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    })
    ;(editingCategory as any).id = cat.id
  }

  const filtered = categories.filter(c => c.type === activeTab)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">分类管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 添加分类
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          支出分类
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'INCOME' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          收入分类
        </button>
      </div>

      {(showForm || editingCategory) && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingCategory(null) }}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editingCategory ? '编辑分类' : '添加分类'}</h2>
            <CategoryForm
              initial={editingCategory || undefined}
              onSubmit={editingCategory ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingCategory(null) }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-2">🏷️</div>
          <div>暂无分类，点击上方按钮添加</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cat)} className="text-xs text-gray-300 hover:text-blue-500">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-xs text-gray-300 hover:text-red-500">
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-800">{cat.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-400">{cat.color}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
