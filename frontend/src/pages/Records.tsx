import { useState, useEffect } from 'react'
import { recordApi, categoryApi } from '../api'
import type { Record, Category, RecordFormData } from '../types'
import RecordForm from '../components/RecordForm'

export default function Records() {
  const [records, setRecords] = useState<Record[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordFormData | null>(null)
  const [filterType, setFilterType] = useState<string>('')

  const fetchRecords = () => {
    setLoading(true)
    Promise.all([
      recordApi.list({ page, pageSize, type: filterType || undefined }),
      categoryApi.list(),
    ]).then(([res, cats]) => {
      setRecords(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
      setCategories(cats)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecords()
  }, [page, filterType])

  const handleCreate = async (data: RecordFormData) => {
    await recordApi.create(data)
    setShowForm(false)
    fetchRecords()
  }

  const handleUpdate = async (data: RecordFormData) => {
    if (!editingRecord || !('id' in editingRecord)) return
    await recordApi.update((editingRecord as any).id, data)
    setEditingRecord(null)
    fetchRecords()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条记录？')) return
    await recordApi.delete(id)
    fetchRecords()
  }

  const startEdit = (record: Record) => {
    setEditingRecord({
      amount: record.amount,
      type: record.type,
      date: record.date.split('T')[0],
      note: record.note || '',
      categoryId: record.categoryId,
    })
    ;(editingRecord as any).id = record.id
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  const formatCurrency = (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">账单记录</h1>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="">全部</option>
            <option value="EXPENSE">支出</option>
            <option value="INCOME">收入</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + 添加记录
          </button>
        </div>
      </div>

      {(showForm || editingRecord) && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingRecord(null) }}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editingRecord ? '编辑记录' : '添加记录'}</h2>
            <RecordForm
              categories={categories}
              initial={editingRecord || undefined}
              onSubmit={editingRecord ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingRecord(null) }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-2">📝</div>
          <div>暂无记录，点击上方按钮添加</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {records.map(record => (
              <div key={record.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{record.category.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{record.category.name}</div>
                    <div className="text-xs text-gray-400">
                      {formatDate(record.date)}
                      {record.note && <span> · {record.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                  </span>
                  <button
                    onClick={() => startEdit(record)}
                    className="text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400">第 {page}/{totalPages} 页</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
