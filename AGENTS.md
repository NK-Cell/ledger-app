# 简易记账助手 (Ledger App)

## Tech Stack

**Backend**: Express + TypeScript + Prisma + SQLite
**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
**CI**: GitHub Actions

## Project Structure

```
ledger/
├── backend/
│   ├── prisma/schema.prisma    # 数据库 schema (SQLite)
│   └── src/
│       ├── index.ts            # Express 入口，路由挂载
│       ├── seed.ts             # 种子数据
│       ├── lib/prisma.ts       # Prisma client 单例
│       └── routes/
│           ├── categories.ts   # CRUD 分类
│           ├── records.ts      # CRUD 账单 + POST /batch
│           └── statistics.ts   # 统计汇总/趋势
└── frontend/
    └── src/
        ├── App.tsx             # 路由定义 (BrowserRouter)
        ├── api/index.ts        # Axios API 请求层
        ├── types/index.ts      # 共享类型定义
        ├── services/llm.ts     # LLM 调用服务 (OpenAI 兼容)
        ├── pages/              # 页面组件
        │   ├── Dashboard.tsx   # 仪表盘 (统计图表)
        │   ├── Records.tsx     # 账单列表+筛选
        │   ├── Categories.tsx  # 分类管理
        │   ├── AIRecord.tsx    # AI 智能记账
        │   └── AISettings.tsx  # LLM 配置
        └── components/
            ├── Layout.tsx      # 导航布局
            ├── RecordForm.tsx  # 账单表单
            └── CategoryForm.tsx# 分类表单
```

## Code Conventions

- **路由风格**: `express.Router()` + `async (req, res)`，参数从 `req.query` 取 string
- **数据库**: Prisma ORM，SQLite，批量操作放事务里
- **API 返回格式**: JSON 对象，错误返回 `{ error: message }`，状态码 400/404/500
- **前端 API 层**: `api/index.ts` 封装所有 axios 调用，组件不直接引用 axios
- **类型定义**: 集中在 `frontend/src/types/index.ts`，前后端共享
- **CSS**: Tailwind CSS 类内联
- **TypeScript**: strict 模式，禁止 `as any` / `@ts-ignore`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类 |
| GET | /api/records | 账单列表 (分页/筛选) |
| POST | /api/records | 创建单条账单 |
| POST | /api/records/batch | 批量创建账单（事务） |
| PUT | /api/records/:id | 更新账单 |
| DELETE | /api/records/:id | 删除账单 |
| GET | /api/statistics/summary | 月度统计汇总 |
| GET | /api/statistics/trend | 年度趋势 |
| GET | /api/health | 健康检查 |

## Database Schema

- **Category**: id, name, type(INCOME/EXPENSE), icon, color, createdAt, updatedAt
- **Record**: id, amount(Float), type(INCOME/EXPENSE), date, note?, categoryId(FK), createdAt, updatedAt

## Dev Commands

```bash
# Backend
npm run dev            # tsx watch 开发
npm run build          # tsc 编译
npm run start          # 启动编译后代码
npm run db:generate    # prisma generate
npm run db:push        # 同步 schema 到数据库
npm run db:seed        # 灌入种子数据

# Frontend
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build
```

## Current State

### Done
- 基本 CRUD（分类、账单）
- 统计仪表盘（月度汇总、年度趋势）
- AI 智能记账（LLM 解析自然语言 → 预览 → 批量保存）
- AI 可插拔配置（用户自配 OpenAI 兼容接口 URL/Key/Model）
- 前端部署到 GitHub Pages（https://nk-cell.github.io/ledger-app/）
- CI 流水线（backend tsc 检查 + frontend vite build）
- 配置 404.html SPA 路由回退

### Todo / Known Issues
- 后端未部署（当前仅本地运行，端口 3001）
- 前端部署后无配套后端，API 调用会失败
- AI 设置存在 localStorage key `ledger_ai_settings`

## Key Design Decisions

- **AI 在前端直调 LLM**：用户配置 URL+Key 存 localStorage，后端只做数据持久化
- **预览确认模式**：LLM 解析结果先展示预览，用户确认后才写入数据库（避免 LLM 幻觉直接入库）
- **ENUM 大写归一化**：LLM 可能返回小写 `income`/`expense`，前端统一转大写后再发往后端
- **GitHub Pages 部署**：因 Vercel CLI 无登录凭据，改为 Pages；SPA 路由回退通过复制 index.html 为 404.html
- **HashRouter → BrowserRouter**：最终保留 BrowserRouter + 404.html 方案

## Git

- Remote: `origin → https://github.com/NK-Cell/ledger-app.git`
- Branch: `master`
- Git 历史已清理（移除 node_modules 等大文件后重新初始化）
