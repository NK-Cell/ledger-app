import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { statsApi } from '../api'
import type { SummaryStats, TrendData } from '../types'

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function Dashboard() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      statsApi.summary({ year, month }),
      statsApi.trends({ year }),
    ]).then(([s, t]) => {
      setSummary(s)
      setTrends(t)
    }).finally(() => setLoading(false))
  }, [year, month])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const expenseByCategory = summary?.byCategory.filter(c => c.total > 0) || []

  const COLORS = expenseByCategory.map(c => c.category.color)

  const formatCurrency = (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">本月收入</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">本月支出</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">本月结余</div>
          <div className={`text-xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary?.balance || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">支出分布</h2>
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="total"
                  nameKey="category.name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i] || '#CBD5E1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend
                  formatter={(value: string) => <span className="text-sm text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400">暂无数据</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">分类支出详情</h2>
          {expenseByCategory.length > 0 ? (
            <div className="space-y-3">
              {expenseByCategory.map(item => (
                <div key={item.category.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">
                      {item.category.icon} {item.category.name}
                    </span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((item.total / (summary?.totalExpense || 1)) * 100, 100)}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">年度趋势 ({year})</h2>
        {trends && trends.months.some(m => m.income > 0 || m.expense > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tickFormatter={m => `${m}月`} />
              <YAxis tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="收入" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="支出" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16 text-gray-400">暂无年度数据</div>
        )}
      </div>
    </div>
  )
}
