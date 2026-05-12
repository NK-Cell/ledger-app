#!/bin/bash

echo "🛑 停止 Ledger..."
lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null && echo "  ✅ 后端已停止" || echo "  ⚠️ 后端未运行"
tmux kill-session -t ledger-backend 2>/dev/null
tmux kill-session -t ledger-frontend 2>/dev/null && echo "  ✅ 前端已停止" || echo "  ⚠️ 前端未运行"
