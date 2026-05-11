import { useState, useEffect } from 'react'
import type { Category, RecordFormData } from '../types'

interface Props {
  categories: Category[]
  initial?: RecordFormData
  onSubmit: (data: RecordFormData) => void
  onCancel: () => void
}

export default function RecordForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<RecordFormData>(
    initial || {
      amount: 0,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      note: '',
      categoryId: 0,
    }
  )

  const filteredCategories = categories.filter(c => c.type === form.type)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (form.categoryId === 0 && filteredCategories.length > 0) {
      setForm(prev => ({ ...prev, categoryId: filteredCategories[0].id }))
    }
  }, [form.type])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.amount || form.amount <= 0) errs.amount = '请输入有效金额'
    if (!form.date) errs.date = '请选择日期'
    if (!form.categoryId) errs.categoryId = '请选择分类'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: 'EXPENSE', categoryId: 0 }))}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              form.type === 'EXPENSE'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: 'INCOME', categoryId: 0 }))}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              form.type === 'INCOME'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            收入
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.amount || ''}
          onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          className={`w-full px-3 py-2 border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <div className="grid grid-cols-4 gap-2">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, categoryId: cat.id }))}
              className={`p-2 rounded-lg text-center transition-colors ${
                form.categoryId === cat.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <div className="text-xs text-gray-600 truncate">{cat.name}</div>
            </button>
          ))}
        </div>
        {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <input
          type="text"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="可选"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {initial ? '保存修改' : '添加记录'}
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
