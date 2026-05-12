# 💰 记账本

个人记账应用，支持手动录入 / AI 智能解析。前后端分离，SQLite 本地存储，密码保护。

## 特性

- **密码保护** — 首次打开设密码，JWT 30 天免登，所有数据按账户隔离
- **手动记账** — 分类管理、账单录入、编辑、删除，按日期/分类/类型筛选
- **AI 记账** — 输入自然语言（如"今天午餐 35 打车 18"），LLM 自动解析分类，预览确认后批量入库
- **统计仪表盘** — 月度收支汇总、年度 12 月趋势图
- **可插拔 AI** — 支持任意 OpenAI 兼容接口（ChatGPT / DeepSeek / 本地模型），配置存本地

## 快速开始

```bash
git clone git@github.com:NK-Cell/ledger-app.git
cd ledger-app

# 启动后端（端口 3001）
cd backend && npm install && npx prisma db push && npm run dev

# 新终端，启动前端（端口 5173）
cd frontend && npm install && npm run dev
```

打开 http://localhost:5173，首次使用会看到设置密码页面，设完直接开始记账。

### 一键启动

```bash
bash start.sh   # 启动前后端
bash stop.sh    # 停止
```

## 数据库

SQLite，两个库文件物理隔离：

| 用途 | 文件 | 密码 |
|------|------|------|
| 开发测试 | `backend/prisma/dev.db` | `npm run db:seed` → `admin123` |
| 正式记账 | `backend/prisma/prod.db` | 前端 Setup 页面自设 |

两个文件互不干扰，在 dev 库测试写脏数据不会影响你的正式账本。

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Express + TypeScript + Prisma + SQLite |
| 认证 | JWT（jsonwebtoken + bcryptjs） |
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 图表 | Recharts |
| AI | OpenAI 兼容接口（前端直调） |
| CI | GitHub Actions（tsc 检查 + vite build） |

## 截图

![仪表盘](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

## License

MIT
