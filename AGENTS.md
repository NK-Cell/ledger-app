# 简易记账助手 (Ledger App)

## Tech Stack

**Backend**: Express + TypeScript + Prisma + SQLite + JWT (bcryptjs + jsonwebtoken)
**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
**CI**: GitHub Actions

## Project Structure

```
ledger/
├── start.sh                     # 一键启动脚本
├── stop.sh                      # 停止脚本
├── backend/
│   ├── .env                     # dev 环境配置（DATABASE_URL, JWT_SECRET）
│   ├── .env.prod                # prod 环境配置模板
│   ├── prisma/
│   │   ├── schema.prisma        # 数据库 schema（User, Category, Record）
│   │   ├── dev.db               # 开发数据库（不追踪）
│   │   └── prod.db              # 生产数据库（不追踪）
│   └── src/
│       ├── index.ts             # Express 入口，挂载所有路由 + auth 中间件
│       ├── seed.ts              # 种子数据（仅 dev 用）
│       ├── lib/prisma.ts        # Prisma client 单例
│       ├── middleware/
│       │   └── auth.ts          # JWT 认证中间件，注入 req.userId
│       └── routes/
│           ├── auth.ts          # 登录/注册/状态查询
│           ├── categories.ts    # CRUD 分类（按 userId 隔离）
│           ├── records.ts       # CRUD 账单 + POST /batch（按 userId 隔离）
│           └── statistics.ts    # 统计汇总/趋势（按 userId 隔离）
└── frontend/
    └── src/
        ├── App.tsx              # 路由 + Setup/Login/Protected 三态切换
        ├── main.tsx             # React 入口，挂载 AuthProvider
        ├── api/index.ts         # Axios 封装，自动带 Bearer token
        ├── types/index.ts       # 共享类型定义
        ├── context/
        │   └── AuthContext.tsx  # 认证上下文：status → setup → login → authenticated
        ├── services/llm.ts      # LLM 调用服务（OpenAI 兼容接口）
        ├── pages/
        │   ├── Setup.tsx        # 首次使用：设置账户密码
        │   ├── Login.tsx        # 登录页
        │   ├── Dashboard.tsx    # 仪表盘（统计图表）
        │   ├── Records.tsx      # 账单列表 + 筛选
        │   ├── Categories.tsx   # 分类管理
        │   ├── AIRecord.tsx     # AI 智能记账
        │   └── AISettings.tsx   # LLM 配置（URL/Key/Model）
        └── components/
            ├── Layout.tsx       # 导航布局 + 退出按钮
            ├── RecordForm.tsx   # 账单表单
            └── CategoryForm.tsx # 分类表单
```

## Code Conventions

- **路由风格**: `express.Router()` + `async (req, res)`，auth 路由 `req.userId` 来自中间件注入
- **数据库**: Prisma ORM，SQLite，批量操作放事务里，所有查询按 `userId` 过滤
- **API 返回格式**: JSON 对象，错误返回 `{ error: message }`，状态码 400/401/404/500
- **前端 API 层**: `api/index.ts` 封装所有 axios 调用，token 由 AuthContext 的 axios 拦截器自动注入，组件不直接引用 axios
- **类型定义**: 集中在 `frontend/src/types/index.ts`
- **CSS**: Tailwind CSS 类内联
- **TypeScript**: strict 模式，禁止 `as any` / `@ts-ignore`

## API Endpoints

### Auth（无需认证）
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/status | 查询是否已初始化（是否有用户） |
| POST | /api/auth/setup | 首次创建账户 + 12 个默认分类，返回 JWT |
| POST | /api/auth/login | 密码登录，返回 JWT |
| GET | /api/health | 健康检查 |

### Auth（需认证）
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/me | 当前用户信息 |

### Categories（需认证，按 userId 隔离）
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类（有记录则拒绝） |

### Records（需认证，按 userId 隔离）
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/records | 账单列表（分页/日期/分类/类型筛选） |
| POST | /api/records | 创建单条账单 |
| POST | /api/records/batch | 批量创建账单（事务） |
| PUT | /api/records/:id | 更新账单 |
| DELETE | /api/records/:id | 删除账单 |

### Statistics（需认证，按 userId 隔离）
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/statistics/summary | 按年/月统计汇总 |
| GET | /api/statistics/trends | 年度 12 月趋势 |

## Database Schema

```prisma
model User {
  id         Int        @id @default(autoincrement())
  username   String     @unique
  password   String     // bcrypt hash
  createdAt  DateTime   @default(now())
  categories Category[]
  records    Record[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String
  type      String   // INCOME | EXPENSE
  icon      String   @default("📦")
  color     String   @default("#6B7280")
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  records   Record[]
}

model Record {
  id         Int      @id @default(autoincrement())
  amount     Float
  type       String   // INCOME | EXPENSE
  date       DateTime
  note       String?
  categoryId Int
  userId     Int
  category   Category @relation(fields: [categoryId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Auth Flow

```
App mount → GET /api/auth/status
  ├── { initialized: false } → Setup 页面（设密码 → 创建用户 + 12 默认分类 → 自动登录）
  ├── { initialized: true } + 无 token → Login 页面
  └── { initialized: true } + 有 token → 验证 token → 进入仪表盘
```

- JWT 有效期 30 天，存 localStorage key `ledger_token`
- axios 拦截器自动附加 `Authorization: Bearer <token>`
- 401 响应自动清 token 并重定向到 `/login`

## Dual Database Isolation

| 环境 | 数据库 | 启动命令 | 种子数据 |
|------|--------|----------|----------|
| dev（开发/测试） | `prisma/dev.db` | `npm run dev` | `npm run db:seed`（用户: admin123） |
| prod（正式记账） | `prisma/prod.db` | `npm run dev:prod` | 前端 Setup 页面自建账户 |

## Dev Commands

```bash
# Backend
npm run dev              # tsx watch 开发（dev.db）
npm run dev:prod         # tsx watch 开发（prod.db）
npm run build            # tsc 编译
npm run db:generate      # prisma generate
npm run db:push          # 同步 schema → dev.db
npm run db:push:prod     # 同步 schema → prod.db
npm run db:seed          # 灌种子数据 → dev.db（用户 admin123）
npm run db:seed:prod     # 灌种子数据 → prod.db

# Frontend
npm run dev              # Vite dev server（默认 5173）
npm run build            # tsc -b && vite build
```

## Current State

### Done
- 基本 CRUD（分类、账单）
- JWT 认证体系（登录/注册/状态查询/中间件）
- 前端 Setup → Login → Dashboard 完整认证流
- 所有 API 按 userId 数据隔离
- dev / prod 双数据库物理隔离
- 统计仪表盘（月度汇总、年度趋势）
- AI 智能记账（LLM 解析自然语言 → 预览 → 批量保存）
- AI 可插拔配置（用户自配 OpenAI 兼容接口 URL/Key/Model）
- CI 流水线（backend tsc 检查 + frontend vite build）
- 一键启停脚本（start.sh / stop.sh）

### Known Issues
- 后端未部署（当前仅本地运行，端口 3001）
- AI 设置存在 localStorage key `ledger_ai_settings`

## Key Design Decisions

- **JWT 无用户名单密码模式**：每人一个账户，密码即身份，30 天免登
- **前端 Setup 自服务**：首次打开直接设密码，无需手动跑 CLI 或编辑 .env
- **dev/prod 双库隔离**：两个 .db 文件，`.env` 控制切换。AI 用 dev.db 测试写脏数据，不影响 prod.db
- **AI 在前端直调 LLM**：用户配置 URL+Key 存 localStorage，后端只做数据持久化
- **预览确认模式**：LLM 解析结果先展示预览，用户确认后才写入数据库
- **ENUM 大写归一化**：LLM 可能返回小写 `income`/`expense`，前端统一转大写

## Git

- Remote: `origin → git@github.com:NK-Cell/ledger-app.git`
- Branch: `master`
- `.gitignore` 保护: `.env`, `.env.prod`, `*.db`, `*.db-journal`, `node_modules/`
