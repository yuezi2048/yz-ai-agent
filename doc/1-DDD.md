## 1) 事件风暴：用例/场景 → 行为（命令）→ 事件 → 领域对象（实体/值对象）

你当前“AI 恋爱大师”已经覆盖了智能客服的一条最小闭环：**用户发起会话消息 →（可选）查询改写 →（可选）RAG 检索增强 →（可选）工具/外部能力调用 → 生成回复 → SSE 流式输出**（见 `AiController`、`LoveApp`）。把它改造成“凌语 Agent 智能客服（多客户）”，建议先把用例抽象成通用客服域：

### 核心用例（建议的业务语言）
- **租户接入与配置**：租户开通、配置模型与检索策略、配置可用工具、发布/回滚配置版本
- **知识库管理**：导入文档/网页、切分、向量化、索引构建、元数据标注、灰度发布、评估与回滚
- **会话与消息**：创建会话、用户发消息、客服（AI）回复、上下文记忆、会话关闭/归档
- **检索增强（RAG）**：查询改写、检索、重排、引用证据、答案生成
- **Agent 编排与工具调用**：计划/执行、多步工具调用、权限与配额控制、终止、可观测审计
- **SSE 长连接交付**：建立连接、心跳、分片推送、断线重连、背压与限流
- **稳定性与压测验证**：限流/熔断/降级、隔离、缓存、回放、压测报告

### 行为（命令）与事件（Domain Events）清单（按业务流分组）
> 下面用“命令 → 事件(过去式)”表示；事件用于审计/回放/一致性，命令用于驱动状态变化。

#### A. 租户与配置
- **CreateTenant** → TenantCreated  
- **UpdateTenantPlan / Quota** → TenantQuotaUpdated  
- **PublishTenantAiConfig** → TenantAiConfigPublished / TenantAiConfigRolledBack  
- **EnableToolForTenant / DisableToolForTenant** → TenantToolPolicyChanged  
- **RotateApiKey / CredentialUpdated** → TenantCredentialRotated

#### B. 会话与消息（你现有的 `chatId` 就是雏形）
- **StartConversation** → ConversationStarted  
- **SendUserMessage** → UserMessageReceived  
- **AppendAssistantChunk**（流式分片）→ AssistantChunkAppended  
- **FinalizeAssistantMessage** → AssistantMessageFinalized  
- **CloseConversation** → ConversationClosed  
- **RecordFeedback**（👍👎/标注是否命中知识）→ FeedbackRecorded

#### C. RAG（你现有的 QueryRewrite + VectorStore 检索增强就是雏形）
- **RewriteQuery** → QueryRewritten  
- **RetrieveDocuments** → DocumentsRetrieved  
- **RerankDocuments** → DocumentsReranked  
- **GroundAnswerWithCitations** → AnswerGrounded  
- **RagFallbackToLLMOnly**（检索为空/阈值不达标）→ RagFallbackTriggered

#### D. Agent 与工具调用（你现有的 ToolCallback/MCP + `YzManus` 多步执行是雏形）
- **PlanAgentSteps** → AgentPlanCreated  
- **ExecuteToolCall** → ToolCallStarted / ToolCallSucceeded / ToolCallFailed  
- **AbortAgentRun** → AgentRunAborted  
- **FinishAgentRun** → AgentRunCompleted

#### E. SSE 长连接与交付
- **OpenSseConnection** → SseConnectionOpened  
- **SendSseHeartbeat** → SseHeartbeatSent  
- **DropSseConnection** → SseConnectionClosed(Reason)  
- **ResumeStream** → StreamResumed

#### F. 知识库（PB 级向量库是你后续的核心域之一）
- **CreateKnowledgeBase** → KnowledgeBaseCreated  
- **IngestDocument** → DocumentIngested  
- **ChunkDocument** → DocumentChunked  
- **EmbedChunks** → EmbeddingsGenerated  
- **UpsertVectors** → VectorsUpserted  
- **BuildIndex / RebuildIndex** → VectorIndexBuilt  
- **PublishKnowledgeBaseVersion** → KnowledgeBaseVersionPublished / RolledBack  
- **DeleteDocument** → DocumentDeleted

### 由事件风暴反推领域对象（实体 + 值对象）
> “实体”有身份与生命周期；“值对象”用于表达规则/度量/不可变概念。

#### 实体（Entities）
- **Tenant（租户）**
- **TenantAiConfig（租户 AI 配置）**：模型、提示词模板、RAG 策略、工具策略、超时/重试、限流策略（通常版本化）
- **KnowledgeBase（知识库）**
- **Document（文档）**
- **Conversation（会话）**
- **Message（消息）**：UserMessage / AssistantMessage
- **AgentRun（一次 Agent 执行）**：对应一次用户请求（可含多步）
- **ToolCall（工具调用记录）**：每一步的输入/输出/耗时/错误
- **SseSession（连接会话）**：连接状态、订阅的 Conversation/AgentRun

#### 值对象（Value Objects）
- **TenantId / KnowledgeBaseId / ConversationId / MessageId / AgentRunId / ToolCallId**
- **UserId / EndUserKey**（多租户下“终端用户身份”很关键）
- **PromptTemplate / SystemPrompt**（你当前 `SYSTEM_PROMPT` 可演进为模板）
- **ModelSpec**（模型名、温度、maxTokens、topP…）
- **RagPolicy**（topK、阈值、过滤表达式、重排策略；你当前 `topK=3`、`threshold=0.5`、`status` filter 是雏形）
- **FilterExpression / Metadata**（例如 `status=单身`，未来变为多维：业务线/渠道/语言/地区/产品等）
- **EmbeddingSpec**（向量维度/模型/归一化）
- **Citation（引用证据）**：文档片段 id、分数、位置
- **Quota / RateLimitPolicy**（万级并发、千级长连接需要明确建模）
- **ToolPolicy / PermissionSet**（哪些工具可用、参数白名单/黑名单）
- **StreamChunk / StreamCursor**（流式分片与断点续传）
- **ErrorInfo / RetryPolicy / TimeoutPolicy**

---

## 2) 聚合根：梳理对象关系 → 找到能代表一致性边界的根

按“一致性 + 生命周期 + 不变量”来定聚合根（AR）：

### 建议的聚合根（Aggregate Roots）
- **Tenant（租户聚合根）**  
  - 关联：TenantAiConfig（版本集合）、ToolPolicy、Quota、Credential  
  - 不变量：租户下配置必须可追溯版本；工具策略必须与配额/权限一致
- **KnowledgeBase（知识库聚合根）**  
  - 关联：Document、Chunk、EmbeddingJob/IndexJob、KnowledgeBaseVersion  
  - 不变量：发布版本只引用已完成索引的数据；删除文档要维护版本一致性
- **Conversation（会话聚合根）**  
  - 关联：Message（窗口/摘要）、SseSubscription（可作为外部关联）、Feedback  
  - 不变量：会话归属某 Tenant；消息顺序与幂等（防重）保证；窗口记忆/摘要策略稳定
- **AgentRun（Agent 执行聚合根）**  
  - 关联：ToolCall（步骤）、Plan、RunState  
  - 不变量：最大步数、终止条件、工具调用必须受 ToolPolicy 约束（你现有 `YzManus.setMaxSteps(20)` 是雏形）
- **SseSession（连接聚合根）**（可选：也可放到交付上下文作为“技术聚合”）  
  - 关联：订阅目标（ConversationId/AgentRunId）、心跳、重连游标  
  - 不变量：单连接的流控与背压；断线原因与清理必须一致

### 聚合间关系（关键点）
- **Conversation ↔ AgentRun**：一次用户消息可能触发一个 AgentRun；但建议用 **ID 引用**而不是聚合内强引用对象，避免超大聚合。
- **Conversation ↔ KnowledgeBase**：对话时“检索哪个 KB 版本”应来自 TenantAiConfig 或会话上下文（例如渠道/业务线），同样用 ID 引用。
- **Tenant 是所有聚合的上层归属**：任何聚合都带 TenantId 作为强约束（多租户隔离的根）。

---

## 3) 聚合 → 领域服务 → 限界上下文（Bounded Context）

结合你的目标约束（万级并发/千级 SSE/ PB 级向量库/可控 Agent），建议把“恋爱大师”拆成 5~7 个上下文；每个上下文内部再按聚合落地。

## 3.1 建议的限界上下文划分（从现有实现演进）
### A) **Customer Interaction Context（客户交互上下文）**
- **聚合**：Conversation、Message、Feedback  
- **领域服务**：ConversationPolicy（记忆窗口/摘要）、IdempotencyService（消息幂等）、SessionRouting（路由到对应 Agent/RAG 配置）
- **你现有映射**：`AiController` + `LoveApp` 的 chatId/ChatMemory 是雏形

### B) **Agent Orchestration Context（Agent 编排上下文）**
- **聚合**：AgentRun、ToolCall  
- **领域服务**：Planner、Executor、GuardrailService（步数/超时/权限/参数约束）、ObservationService（审计与链路）
- **你现有映射**：`YzManus`、`ToolCallAgent`、`TerminateTool`、`ToolCallback[]`

### C) **RAG & Retrieval Context（检索增强上下文）**
- **聚合**：RagRequest（可作为轻聚合/领域模型）、RetrievalResult（值对象集合）  
- **领域服务**：QueryRewriteService（你现有 `QueryRewriter`）、Retriever、Reranker、GroundingService（引用证据）
- **你现有映射**：`LoveAppRagCustomAdvisorFactory`（filter/topK/threshold）、VectorStore、QueryRewriter

### D) **Knowledge Management Context（知识管理上下文）**
- **聚合**：KnowledgeBase、Document、KnowledgeBaseVersion、IngestionJob/IndexJob  
- **领域服务**：IngestionService、ChunkingService、EmbeddingService、IndexService、PublishService
- **你现有映射**：`LoveAppDocumentLoader`/向量配置类（你项目里已有相关类名与配置痕迹）

### E) **Tenant & Governance Context（租户与治理上下文）**
- **聚合**：Tenant、TenantAiConfig、Quota、ToolPolicy、Credential  
- **领域服务**：ConfigPublishService、QuotaEnforcement、ToolAuthorization
- **为什么单独拆**：多租户隔离、配额、权限、合规审计都在这里“定规则”，其它上下文只“执行规则”

### F) **Streaming Delivery Context（流式交付上下文）**
- **聚合**：SseSession（或 StreamSubscription）  
- **领域服务**：BackpressureService、ReconnectService、HeartbeatService
- **你现有映射**：`AiController` 里三种 SSE 方式（Flux/SSEEmitter/ServerSentEvent）是交付层雏形，但还缺领域化的连接治理

### G) **Observability & Reliability Context（可观测与稳定性上下文）**
- **聚合**：RunTrace / AuditLog（事件存储/审计实体）  
- **领域服务**：CircuitBreakerPolicy、RetryManager、DegradeStrategy、LoadTestReportService
- **说明**：这块很多是技术域，但你目标里“压测验证/稳定性工程化”需要明确边界与产物（指标、追踪、回放）

---

## 4) 把“恋爱大师”改造为“多租户客服”的关键 DDD 落点（你当前代码对应关系）
- **从单一 `LoveApp` 应用服务 → 拆为多个应用服务**：  
  - ChatApplicationService（会话/消息）  
  - RagApplicationService（检索增强）  
  - AgentApplicationService（编排/工具）  
  - StreamingApplicationService（SSE 交付）
- **把 `SYSTEM_PROMPT`（固定字符串）升级为 TenantAiConfig 的一部分**（可版本化、可回滚）
- **把 `status=单身` 这种过滤从“恋爱域字段”泛化为 “KnowledgeBase 元数据过滤表达式”**（业务线/产品/渠道/语言等维度）
- **把 `chatId` 统一建模为 ConversationId，并强制绑定 TenantId**（多客户隔离）
- **将工具调用纳入 ToolPolicy + 审计事件**（可控性：参数校验/白名单/沙箱/超时）

---

如果你愿意，我可以在不改代码的前提下，继续把上述 DDD 设计“落到你仓库的包结构/模块拆分建议”上：例如按 `interfaces / application / domain / infrastructure` 分层，并指出你当前 `LoveApp`、`YzManus`、`rag/*`、`tools/*` 分别应该迁移到哪些层与上下文。