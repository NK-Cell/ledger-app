#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null
tmux kill-session -t ledger-backend 2>/dev/null
tmux kill-session -t ledger-frontend 2>/dev/null
sleep 1

echo "🚀 启动 Ledger..."
tmux new-session -d -s ledger-backend "cd $PROJECT_DIR/backend && npm run dev"
echo "  后端启动中... (http://localhost:3001)"
tmux new-session -d -s ledger-frontend "cd $PROJECT_DIR/frontend && npm run dev"
echo "  前端启动中... (http://localhost:5173)"

sleep 4

tmux has-session -t ledger-backend 2>/dev/null && echo "✅ 后端运行中" || echo "❌ 后端启动失败"
tmux has-session -t ledger-frontend 2>/dev/null && echo "✅ 前端运行中" || echo "❌ 前端启动失败"

echo ""
echo "首次使用：打开浏览器 → 设置密码 → 自动创建 12 个默认分类 → 开始记账"
echo "dev 测试：npm run db:seed（密码: admin123）"
echo "停止服务：bash $PROJECT_DIR/stop.sh"
