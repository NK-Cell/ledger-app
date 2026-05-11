import { useState } from 'react'
import type { CategoryFormData } from '../types'

const ICON_OPTIONS = ['🍽️', '🚗', '🛍️', '🏠', '🎮', '💊', '📚', '📱', '💰', '💼', '🧧', '📈', '🎬', '✈️', '🐱', '🎁', '🏥', '☕', '🍺', '🎵']
const COLOR_OPTIONS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#84CC16']

interface Props {
  initial?: CategoryFormData
  onSubmit: (data: CategoryFormData) => void
  onCancel: () => void
}

export default function CategoryForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CategoryFormData>(
    initial || { name: '', type: 'EXPENSE', icon: '📦', color: '#6B7280' }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="分类名称"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: 'EXPENSE' }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              form.type === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: 'INCOME' }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              form.type === 'INCOME' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            收入
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
        <div className="grid grid-cols-8 gap-1">
          {ICON_OPTIONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm(f => ({ ...f, icon }))}
              className={`p-2 rounded-lg text-lg ${
                form.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm(f => ({ ...f, color }))}
              className={`w-8 h-8 rounded-full transition-transform ${
                form.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {initial ? '保存修改' : '添加分类'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}
