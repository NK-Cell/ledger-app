import axios from 'axios'
import type { Category, Record, PaginatedResponse, SummaryStats, TrendData, RecordFormData, CategoryFormData, BatchCreateResult } from '../types'

const api = axios.create({ baseURL: '/api' })

export const categoryApi = {
  list: () => api.get<Category[]>('/categories').then(r => r.data),
  create: (data: CategoryFormData) => api.post<Category>('/categories', data).then(r => r.data),
  update: (id: number, data: Partial<CategoryFormData>) => api.put<Category>(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(r => r.data),
}

export const recordApi = {
  list: (params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string; categoryId?: number; type?: string }) =>
    api.get<PaginatedResponse<Record>>('/records', { params }).then(r => r.data),
  create: (data: RecordFormData) => api.post<Record>('/records', data).then(r => r.data),
  update: (id: number, data: Partial<RecordFormData>) => api.put<Record>(`/records/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/records/${id}`).then(r => r.data),
  batchCreate: (records: { amount: number; type: string; date: string; note?: string; categoryId: number }[]) =>
    api.post<BatchCreateResult>('/records/batch', { records }).then(r => r.data),
}

export const statsApi = {
  summary: (params?: { year?: number; month?: number }) =>
    api.get<SummaryStats>('/statistics/summary', { params }).then(r => r.data),
  trends: (params?: { year?: number }) =>
    api.get<TrendData>('/statistics/trends', { params }).then(r => r.data),
}
