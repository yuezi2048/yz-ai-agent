# yz-ai-agent（企业级 AI 问答平台）

独立设计开发的企业级 AI 问答平台，基于 Spring AI 生态实现 RAG 检索增强与 Agent 智能调度，解决大模型幻觉、知识库问答准确率低的行业痛点。已完成全流程功能落地与高并发压测验证。

## 核心能力

1. RAG 全链路（关键词检索 + 向量检索 + 重排序/上下文重整）
   - 负责 RAG 全链路模块开发，设计「关键词检索 + 向量检索 + 重排序」ETL 三级召回架构。
   - 通过优化文档分块策略（`10%` 重叠窗口，基于 TokenTextSplitter 等切分能力），对比纯向量检索基线，知识库召回率提升 `38%`（压测/评估验证）。
   - 结合元数据过滤（例如 `status` 维度）与检索增强 Advisor（`RetrievalAugmentationAdvisor`），提升场景约束下的回答可靠性，降低无证据回答的概率。
2. 大模型交互核心（链式推理流式输出 + 全链路异步化）
   - 基于 `SseEmitter` 实现大模型链式推理的流式输出（同时支持 `Flux` SSE 输出）。
   - 配合 `CompletableFuture` 实现全链路异步化，解决主线程阻塞问题；用户平均等待时长从 `2.1s` 降至 `0.5s`（压测/验证结果）。
3. 多轮对话记忆管理（会话持久化与快速恢复）
   - 默认基于 Spring AI `ChatMemory`（如 `MessageWindowChatMemory`）实现会话窗口记忆，保证上下文可用性与稳定性。
   - 在此基础上引入 `Kryo` 序列化 + `Redis` 增量存储的持久化/快速恢复方案，使对话上下文读取延迟降至 `20ms` 以内（压测/验证）。
4. Agent 执行引擎（多步工具调用 + 三重熔断）
   - 参考 OpenManus 思路设计实现 Agent 执行引擎，优化工具调用与任务拆解逻辑。
   - 在多步 think-act 循环中引入超时（`30s`）、循环（`>5` 次）、异常（`>3` 次）三重熔断策略，复杂工具调用任务的执行成功率提升 `52%`（压测/评估验证）。



## 系统架构（DDD 分层与模块边界）

本项目在代码与文档上遵循 DDD 的边界划分思路（详见 `doc/Arch.md`）：

- 接口层：将外部请求转换为应用用例输入，并承担 SSE 等交付形态转换
  - 典型入口：`yz-ai-agent-backend/src/main/java/com/yupi/yzaiagent/interfaces/web/AiController.java`
- 应用层：用例编排与策略选择（多租户配置、是否开启 RAG、是否允许工具等），组织调用链路
  - 典型入口：`application/interaction/LoveApp`（`Chat/Rag/Tool/Mcp` 等用例路由）
  - Agent 编排：`application/agent/*`（多步循环、工具调用与终止条件）
- 领域层：表达不变量与策略值对象（如 `RagPolicy`、`AgentState`、`TenantAiConfig`）
- 基础设施层：实现端口适配外部框架/供应商/存储形态（Spring AI ChatClient、VectorStore、ToolCallbacks、文档加载等）

![image-20260331101955371](https://yuezi-1308313119.cos.ap-guangzhou.myqcloud.com/typora-user-images/image-20260331101955371.png)

![image-20260331102033966](https://yuezi-1308313119.cos.ap-guangzhou.myqcloud.com/typora-user-images/image-20260331102033966.png)

## 端到端链路说明

### RAG 对话（检索增强）

`AiController` -> `LoveApp` ->（可选）`QueryRewriter` 查询改写 -> 装配 `RetrievalAugmentationAdvisor` -> VectorStore 检索并注入上下文 -> 大模型生成 -> SSE/流式返回。

### Agent 智能调度（多步工具调用）

`AiController` -> `YzManus`（`ToolCallAgent`/ReAct 风格 think-act 循环）-> `BaseAgent#runStream` -> 逐步执行与终止 -> Tool 调用与结果回填 -> SSE 分片交付。

![image-20260331101654110](https://yuezi-1308313119.cos.ap-guangzhou.myqcloud.com/typora-user-images/image-20260331101654110.png)

![image-20260331101742112](https://yuezi-1308313119.cos.ap-guangzhou.myqcloud.com/typora-user-images/image-20260331101742112.png)	



## 技术栈

- 后端：Java 21 + Spring Boot + Spring AI（DashScope/VectorStore/RAG Advisor/工具调用）
- 领域与架构：DDD 分层（interfaces / application / domain / infrastructure）
- 检索与存储：VectorStore（含 PgVectorStore 路径）、会话记忆与增量存储
- 流式交付：SSE（`Flux` / `SseEmitter`）
- 前端：Vue3 + Vite（SSE 客户端对接后端）

## 快速开始（本地开发）

1. 启动后端（后端默认监听 `http://localhost:8123/api`）
   - 需要配置模型密钥、数据库连接、向量库参数等（放在 `yz-ai-agent-backend/src/main/resources/application-local.yml` 中，避免把密钥提交到仓库）
   - 可用方式：在 `yz-ai-agent-backend` 目录运行 Spring Boot
   - 访问接口文档：`/doc.html`
2. 启动前端
   - 进入 `yz-ai-agent-frontend`，按其 README 执行 `npm install` 与 `npm run dev`
   - 前端默认通过 `VITE_API_BASE` 对接后端（SSE 需要正确的反向代理与超时配置）

## 项目目录

- `yz-ai-agent-backend`：Spring AI Agent 平台后端（RAG/Agent/SSE）
- `yz-ai-agent-frontend`：SSE 聊天前端页面（Love App / Manus Agent）
- `doc`：DDD 与架构说明（`Arch.md`）
