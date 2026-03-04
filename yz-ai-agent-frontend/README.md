# YU AI Agent Frontend（Vue3 + Vite）

基于 Vue3 + Vite 的前端项目，用于对接后端的 AI 恋爱大师与 AI 超级智能体两个 SSE 流式对话接口。

## 功能概览

- **主页**：在 AI 恋爱大师 / AI 超级智能体之间切换。
- **AI 恋爱大师页面**：调用 `GET /ai/love_app/chat/sse`，进入页面自动生成 `chatId`，使用 SSE 流式展示对话（打字机效果）。
- **AI 超级智能体页面**：调用 `GET /ai/manus/chat`，同样使用 SSE 流式展示对话。
- **统一聊天体验组件**：气泡式聊天 UI，用户在右侧，AI 在左侧，支持会话重置、停止生成、滚动到底部等。

## 本地启动

前置要求：

- Node.js 18+（建议使用 LTS）
- 后端服务已在本机 `http://localhost:8123` 运行，并提供 `/api/ai/...` 接口

在 PowerShell / CMD 中执行：

```bash
cd D:\github_repository\yz-ai-agent\yz-ai-agent-frontend

npm install

# 可选：如需自定义后端地址，在项目根目录创建 .env
echo VITE_API_BASE=http://localhost:8123/api > .env

npm run dev
```

浏览器打开终端输出的地址（默认 `http://localhost:4173/`），即可访问主页和两个聊天页面。

## 关键目录结构

- `src/main.ts`：应用入口，挂载 Vue 应用。
- `src/router/index.ts`：路由配置（主页 + 两个应用页面）。
- `src/components/ChatExperience.vue`：通用聊天体验组件。
- `src/composables/useChatStream.ts`：SSE 流式对话逻辑与打字机效果。
- `src/pages/HomePage.vue`：应用选择主页。
- `src/pages/LoveMasterPage.vue`：AI 恋爱大师页面。
- `src/pages/SuperManusPage.vue`：AI 超级智能体页面。

## 构建与预览

```bash
npm run build
npm run preview
```

## 备注

默认 API 前缀为 `http://localhost:8123/api`，可通过环境变量 `VITE_API_BASE` 覆盖。请在部署时确保反向代理对 SSE 连接（`text/event-stream`）做了正确的长连接与超时配置。
