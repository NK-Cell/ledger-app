export interface Category {
  id: number
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Record {
  id: number
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string
  note: string | null
  categoryId: number
  category: Category
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SummaryStats {
  year: number
  month: number | null
  totalIncome: number
  totalExpense: number
  balance: number
  recordCount: number
  byCategory: {
    category: { id: number; name: string; icon: string; color: string }
    total: number
    count: number
  }[]
}

export interface TrendData {
  year: number
  months: {
    month: number
    income: number
    expense: number
    count: number
  }[]
}

export interface RecordFormData {
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string
  note: string
  categoryId: number
}

export interface CategoryFormData {
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon: string
  color: string
}

export interface AISettings {
  endpoint: string
  apiKey: string
  model: string
}

export interface ParsedRecord {
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryName: string
  description: string
  date: string
}

export interface BatchCreateResult {
  records: Record[]
  count: number
}
