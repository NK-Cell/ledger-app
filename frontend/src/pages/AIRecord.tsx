import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryApi, recordApi } from '../api'
import { parseText } from '../services/llm'
import type { Category, AISettings, ParsedRecord } from '../types'

interface EditableRecord extends ParsedRecord {
  _key: number
  categoryId: number
}

function buildCategoryMap(categories: Category[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const cat of categories) {
    map.set(cat.name, cat.id)
  }
  return map
}

function fuzzyMatchCategory(
  name: string,
  categories: Category[],
  type: 'INCOME' | 'EXPENSE'
): Category | undefined {
  const filtered = categories.filter(c => c.type === type)
  if (filtered.length === 0) return undefined

  const exact = filtered.find(c => c.name === name)
  if (exact) return exact

  const sub = filtered.find(c => name.includes(c.name) || c.name.includes(name))
  if (sub) return sub

  return filtered[0]
}

function resolveCategoryId(
  categoryName: string,
  type: 'INCOME' | 'EXPENSE',
  categoryMap: Map<string, number>,
  categories: Category[]
): number {
  const exact = categoryMap.get(categoryName)
  if (exact !== undefined) return exact

  const fuzzy = fuzzyMatchCategory(categoryName, categories, type)
  return fuzzy?.id ?? 0
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function AIRecord() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryMap, setCategoryMap] = useState<Map<string, number>>(new Map())
  const [inputText, setInputText] = useState('')
  const [records, setRecords] = useState<EditableRecord[]>([])
  const [summary, setSummary] = useState<{ totalExpense: number; totalIncome: number; netAmount: number } | null>(null)
  const [mode, setMode] = useState<'input' | 'preview'>('input')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [settingsChecked, setSettingsChecked] = useState(false)
  const nextKeyRef = useRef(1)

  useEffect(() => {
    const raw = localStorage.getItem('ledger_ai_settings')
    if (!raw) {
      setSettingsChecked(true)
      return
    }
    try {
      const settings: AISettings = JSON.parse(raw)
      if (!settings.endpoint || !settings.apiKey || !settings.model) {
        setSettingsChecked(true)
        return
      }
    } catch {
      setSettingsChecked(true)
      return
    }
    setSettingsChecked(true)

    categoryApi.list().then(cats => {
      setCategories(cats)
      setCategoryMap(buildCategoryMap(cats))
    }).catch(err => {
      setError(err instanceof Error ? err.message : '加载分类失败')
    })
  }, [])

  const handleParse = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    const raw = localStorage.getItem('ledger_ai_settings')
    if (!raw) {
      setError('请先在 AI 设置中配置接口')
      return
    }
    let settings: AISettings
    try {
      settings = JSON.parse(raw)
      if (!settings.endpoint || !settings.apiKey || !settings.model) {
        setError('AI 设置不完整，请先在 AI 设置中配置接口')
        return
      }
    } catch {
      setError('AI 设置读取失败')
      return
    }

    setParsing(true)
    setError(null)

    try {
      const catNames = categories.map(c => ({ name: c.name, type: c.type }))
      const result = await parseText(trimmed, catNames, settings)

      if (!result.records || result.records.length === 0) {
        setError('未识别到任何账单记录')
        setParsing(false)
        return
      }

      const editable: EditableRecord[] = result.records.map(r => ({
        ...r,
        _key: nextKeyRef.current++,
        categoryId: resolveCategoryId(r.categoryName, r.type, categoryMap, categories),
      }))

      setRecords(editable)
      setSummary(result.summary)
      setMode('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }, [inputText, categories, categoryMap])

  const handleBackToInput = useCallback(() => {
    setMode('input')
    setRecords([])
    setSummary(null)
    setError(null)
  }, [])

  const handleRecordChange = useCallback((key: number, field: keyof EditableRecord, value: any) => {
    setRecords(prev => prev.map(r => {
      if (r._key !== key) return r
      const updated = { ...r, [field]: value }

      if (field === 'type' || field === 'categoryName') {
        updated.categoryId = resolveCategoryId(
          field === 'categoryName' ? value : r.categoryName,
          field === 'type' ? value : r.type,
          categoryMap,
          categories
        )
      }

      return updated
    }))
  }, [categories, categoryMap])

  const handleDeleteRecord = useCallback((key: number) => {
    setRecords(prev => {
      const next = prev.filter(r => r._key !== key)
      if (next.length === 0) {
        setMode('input')
        setSummary(null)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (records.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const payload = records.map(r => ({
        amount: r.amount,
        type: r.type,
        date: r.date,
        note: r.description || undefined,
        categoryId: r.categoryId,
      }))

      const result = await recordApi.batchCreate(payload)
      setSuccessMsg(`已保存 ${result.count} 条记录`)
      setTimeout(() => {
        navigate('/records')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }, [records, navigate])

  useEffect(() => {
    if (mode === 'preview' && records.length > 0) {
      const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0)
      const totalIncome = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0)
      setSummary({ totalExpense, totalIncome, netAmount: totalIncome - totalExpense })
    }
  }, [records, mode])

  if (!settingsChecked) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const raw = localStorage.getItem('ledger_ai_settings')
  let hasSettings = false
  if (raw) {
    try {
      const s: AISettings = JSON.parse(raw)
      hasSettings = !!(s.endpoint && s.apiKey && s.model)
    } catch { void 0 }
  }

  if (!hasSettings) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">AI 智能记账</h2>
          <p className="text-gray-400 mb-6">请先在 AI 设置中配置接口</p>
          <button
            onClick={() => navigate('/ai/settings')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            前往设置
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-800">AI 智能记账</h1>
        <p className="text-sm text-gray-500">粘贴日常收支文本，AI 自动识别</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3 font-bold">&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      {mode === 'input' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={"例如：早餐12 午餐20 晚上打车16.9\n今天发了工资15000\n买书花了89"}
              className="w-full min-h-[200px] resize-y border border-gray-200 rounded-lg p-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={parsing}
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleParse}
              disabled={parsing || !inputText.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {parsing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  解析中...
                </>
              ) : (
                '🤖 智能解析'
              )}
            </button>
          </div>
        </div>
      )}

      {mode === 'preview' && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">总支出</div>
              <div className="text-lg font-bold text-red-500">
                ¥{summary.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">总收入</div>
              <div className="text-lg font-bold text-green-500">
                ¥{summary.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">净收支</div>
              <div className={`text-lg font-bold ${summary.netAmount < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                ¥{summary.netAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {records.map(record => (
              <div
                key={record._key}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative"
              >
                <button
                  onClick={() => handleDeleteRecord(record._key)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors text-sm font-bold"
                >
                  &times;
                </button>

                <div className="flex gap-4">
                  <div className="w-28 shrink-0">
                    <label className="block text-xs text-gray-400 mb-1">金额</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={record.amount}
                      onChange={e => handleRecordChange(record._key, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          record.type === 'EXPENSE'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {record.type === 'EXPENSE' ? '支出' : '收入'}
                      </span>

                      <select
                        value={record.categoryId}
                        onChange={e => {
                          const catId = parseInt(e.target.value, 10)
                          const cat = categories.find(c => c.id === catId)
                          if (cat) {
                            handleRecordChange(record._key, 'categoryId', catId)
                            handleRecordChange(record._key, 'categoryName', cat.name)
                            handleRecordChange(record._key, 'type', cat.type)
                          }
                        }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories
                          .filter(c => c.type === record.type)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                      </select>

                      <input
                        type="date"
                        value={record.date}
                        onChange={e => handleRecordChange(record._key, 'date', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <input
                      type="text"
                      value={record.description}
                      onChange={e => handleRecordChange(record._key, 'description', e.target.value)}
                      placeholder="备注说明"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 pb-8">
            <button
              onClick={handleBackToInput}
              className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              &larr; 返回修改
            </button>
            <button
              onClick={handleSave}
              disabled={saving || records.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  保存中...
                </>
              ) : (
                '✅ 确认保存'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
