import { useState, useEffect } from 'react'
import type { AISettings } from '../types'

const STORAGE_KEY = 'ledger_ai_settings'

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { endpoint: '', apiKey: '', model: '' }
    const parsed = JSON.parse(raw)
    return {
      endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint : '',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    }
  } catch {
    return { endpoint: '', apiKey: '', model: '' }
  }
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>(loadSettings)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [saved])

  const handleChange = (field: keyof AISettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [field]: e.target.value }))
    setTestResult(null)
  }

  const handleSave = () => {
    if (!settings.endpoint.trim() || !settings.apiKey.trim() || !settings.model.trim()) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)
  }

  const handleTest = async () => {
    if (!settings.endpoint.trim() || !settings.apiKey.trim() || !settings.model.trim()) return

    setTesting(true)
    setTestResult(null)

    try {
      const endpoint = settings.endpoint.replace(/\/+$/, '')
      const res = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        setTestResult({
          ok: false,
          message: `HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
        })
        return
      }

      setTestResult({ ok: true, message: '连接成功！' })
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || '连接失败，请检查网络或接口地址',
      })
    } finally {
      setTesting(false)
    }
  }

  const allFilled = settings.endpoint.trim() && settings.apiKey.trim() && settings.model.trim()

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-800">🤖 AI 设置</h1>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 max-w-xl">
        <div className="space-y-5">
          {/* API Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
            <input
              type="text"
              value={settings.endpoint}
              onChange={handleChange('endpoint')}
              placeholder="https://api.openai.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">OpenAI 兼容接口地址</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={handleChange('apiKey')}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">你的 API Key</p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={settings.model}
              onChange={handleChange('model')}
              placeholder="gpt-4o-mini"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">模型名称</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={!allFilled}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存设置
          </button>
          <button
            onClick={handleTest}
            disabled={!allFilled || testing}
            className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
                测试中...
              </span>
            ) : (
              '测试连接'
            )}
          </button>
        </div>

        {/* Success toast */}
        {saved && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            设置已保存
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={`mt-4 flex items-center gap-2 text-sm ${
              testResult.ok ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {testResult.ok ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
