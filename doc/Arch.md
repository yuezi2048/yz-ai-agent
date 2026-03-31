## yzaiagent 经过 DDD 重构后的系统架构拆解

> 说明：该包内的“DDD 化”主要体现在领域对象（值对象/策略）、应用用例编排、端口（Repository port）与基础设施适配器分离；并没有看到传统意义上的大量 Entity/聚合持久化行为（聚合更多以“配置边界”的形式存在）。

---

## 1. 架构全景图

### 1.1 分层架构（Layered Architecture）

1. 接口层（`interfaces`）
   - 角色：把外部请求转换为应用用例输入，负责路由与交付形态（同步/流式）。
   - 代表：`interfaces/web/AiController`、`interfaces/web/HealthController`、以及 `infrastructure/exception/GlobalExceptionHandler`（统一异常输出）。

2. 应用层（`application`）
   - 角色：用例编排与“选择策略”（例如多租户配置、是否允许工具、是否开启 RAG），并把调用落在基础设施能力（ChatClient/VectorStore/ToolCallbacks）之上。
   - 代表：`application/interaction/LoveApp`、`application/tenant/TenantAiConfigService`、各类 `*ApplicationService`（Chat/Rag/Tool/Mcp）。
   - 另：`application/agent/*` 负责 Agent 的多步执行循环与工具调用编排。

3. 领域层（`domain`）
   - 角色：承载业务不变量与策略表达（多租户配置、RAG 策略、工具策略、Agent 生命周期状态）。
   - 代表：`domain/tenant/model/*`、`domain/rag/RagPolicy`、`domain/agent/model/AgentState`。

4. 基础设施层（`infrastructure`）
   - 角色：实现端口、适配外部框架/供应商/存储形态（JDBC/向量库/Spring AI/ToolCallbacks）。
   - 代表：`infrastructure/tenant/*Repository`、`infrastructure/ai/ChatClientFactory`、`infrastructure/rag/*`、`infrastructure/tool/*`、`infrastructure/tool/ToolRegistration` 等。

### 1.2 核心模块划分（Bounded Context / Modules）

从包结构可推断出 4 个主要模块线（边界以“配置/策略 + 用例编排 + 技术适配”来表达）：

1. `Tenant & Governance Context`（租户治理上下文）
   - 以 `TenantAiConfig`、`ToolPolicy`、`RagPolicy`、`AiModelSpec` 为核心配置边界。
   - 用例：`TenantAiConfigService` 从 `TenantAiConfigRepository` 读取并回退默认配置。

2. `Interaction Context`（会话交互上下文）
   - 以 `LoveApp` 为应用层入口/外观，提供同步、流式、RAG、工具增强、MCP 等多种交互用例。

3. `RAG & Retrieval Context`（检索增强上下文）
   - 用例：`RagChatApplicationService` 选择是否重写查询并装配 RAG advisor。
   - 基础设施：`QueryRewriter`、`LoveAppRagCustomAdvisorFactory` 负责与向量检索/过滤策略对接。

4. `Agent Orchestration Context`（Agent 编排上下文）
   - 用例：`YzManus`/`ToolCallAgent`/`ReActAgent`/`BaseAgent` 实现多步思考-行动循环、工具调用与终止条件。

---

## 2. DDD 重构痕迹与核心变化

相对“传统三层/CRUD 架构”，当前重构的关键变化集中在“职责边界更清晰”：

1. “把规则从服务/控制器挪到领域对象”
   - `TenantAiConfig`、`ToolPolicy`、`RagPolicy`、`AiModelSpec` 都在 `domain` 中以 `record` 表达，并在构造时完成不变量校验（例如阈值范围、provider/model 非空）。
   - 结果：应用层能以不可变配置对象驱动行为选择，而不是散落在 Controller/Service 的 if/else。

2. “引入端口（Port）隔离持久化细节”
   - `application/tenant/port/TenantAiConfigRepository` 是领域不关心的抽象。
   - `infrastructure/tenant/JdbcTenantAiConfigRepository`、`InMemoryTenantAiConfigRepository` 是适配器，实现了端口。
   - 结果：应用层的“读取租户配置”不会依赖 JDBC 或内存实现细节。

3. “应用层承担用例编排，基础设施层承担框架/供应商适配”
   - `LoveApp`：聚合多个用例入口，把“多租户配置 -> 构造 ChatClient -> 调用对应 ApplicationService”的编排集中起来。
   - `ChatClientFactory`：把 Spring AI 的 ChatClient 构造细节封装起来，让应用层只面向“系统提示词 + 默认记忆 + 配置驱动”的能力边界。

4. “接口层尽量薄”
   - `AiController` 只做请求参数解析、从 `LoveApp` 取输出，并负责 SSE 的交付形态转换（`Flux` / `SseEmitter`）。

需要留意的“未完全 DDD 化”的点（从结构可推断）：
1. `domain` 内没有看到传统 Entity 与丰富的 Domain Service；目前更像“配置/策略领域模型”，聚合更多以 `TenantAiConfig` 这种配置边界存在。
2. `LoveApp` 在应用层中直接 `new ChatApplicationService(...)`，说明用例对象没有完全由依赖注入/工厂化管理（不影响 DDD 边界思想，但会降低可测试性/替换性）。

---

## 3. 领域模型拆解

### 3.1 聚合根（Aggregate Roots）

1. `TenantAiConfig`（`domain/tenant/model/TenantAiConfig`）
   - 职责一句话：代表“某租户的 AI 交互配置边界”，组合系统提示词、RAG 策略、工具策略与模型规格，并在构造时保证不变量成立。

> 注：严格意义上它更像“配置聚合/配置快照”，但它确实把一致性规则（非空、范围校验、策略组合）集中到了一个根对象上。

### 3.2 实体（Entities）

当前 `domain` 包中未发现传统 Entity（拥有独立生命周期与标识、且包含行为方法的类）。

### 3.3 值对象（Value Objects）

1. `TenantId`
   - 职责一句话：租户标识值对象，保证非空且可用。

2. `ToolPolicy`
   - 职责一句话：工具能力策略值对象，表达是否启用工具以及允许的工具白名单（白名单为空/为 null 表示不过滤）。

3. `AiModelSpec`
   - 职责一句话：模型定位值对象（provider + model），保证 provider/model 非空。

4. `RagPolicy`
   - 职责一句话：检索策略值对象，约束 `topK` 与相似度阈值范围，并给出默认凌语 Agent 智能问答系统策略。

5. `AgentState`（枚举）
   - 职责一句话：Agent 运行时生命周期状态（`IDLE/RUNNING/FINISHED/ERROR`），供 `application/agent` 的状态机循环使用。

---

## 4. 关键流程与方法（从入口到持久化/存储）

### 4.1 同步聊天（多租户配置持久化 -> ChatClient）

入口到持久化的完整调用链（概念调用链）：

1. 接口层：`interfaces/web/AiController#doChatWithLoveAppSync(...)`
   - 读取 header：`X-Tenant-Id`
   - 调用：`loveApp.doChat(message, chatId, tenantId)`

2. 应用层编排：`application/interaction/LoveApp#doChat(message, chatId, tenantId)`
   - 读取配置：`TenantAiConfigService#getLoveAppConfig(tenantId)`

3. 应用层用例服务：`application/tenant/TenantAiConfigService#getLoveAppConfig(tenantId)`
   - repository 读取：`TenantAiConfigRepository#findLoveAppConfig(normalizedTenantId)`
   - fallback：`defaultLoveAppConfig(normalizedTenantId)`（构造默认 `TenantAiConfig`）

4. 基础设施适配器（持久化/存储读取）：
   - `infrastructure/tenant/JdbcTenantAiConfigRepository#findLoveAppConfig(...)`：通过 `JdbcTemplate` 查询 `tenant_ai_config` 表并组装领域配置对象
   - 或 `infrastructure/tenant/InMemoryTenantAiConfigRepository#findLoveAppConfig(...)`：测试/无 DB 环境的内存回读

5. Chat 能力装配：
   - `application/interaction/LoveApp` -> `infrastructure/ai/ChatClientFactory#create(dashscopeChatModel, config)`
   - `ChatClientFactory` 把 `config.systemPrompt()` 与默认记忆 advisor 装入 ChatClient

6. 应用层用例执行：
   - `LoveApp` -> `new ChatApplicationService(chatClient).chatSync(message, chatId)`
   - `ChatApplicationService#chatSync(...)` 发起 LLM 调用（通过 Spring AI 的 ChatClient），并返回最终文本

核心逻辑落点：
1. “多租户配置读取与回退”：`application/tenant/TenantAiConfigService`
2. “用例路由/装配”：`application/interaction/LoveApp`
3. “LLM 交互流程”：`application/interaction/service/ChatApplicationService`（逻辑组织）+ `infrastructure/ai/ChatClientFactory`（能力装配与适配）
4. “不变量/策略校验”：`domain/*record` 构造校验

### 4.2 RAG 增强聊天（向量检索存储 -> RetrievalAugmentationAdvisor）

调用链（关键路径）：

1. 入口（当前 controller 映射中未直接展示 Rag 路由，但 `LoveApp` 已提供用例方法）
   - `application/interaction/LoveApp#doChatWithRag(message, chatId, tenantId)`

2. 配置读取（同 4.1）
   - `TenantAiConfigService#getLoveAppConfig(tenantId)` -> `TenantAiConfigRepository#findLoveAppConfig(...)`
   - 得到：`TenantAiConfig.ragPolicy()`、`systemPrompt()`、`toolPolicy()`、`chatModelSpec()`

3. RAG 用例执行：
   - `application/interaction/service/RagChatApplicationService#chatWithRag(message, chatId)`
   - 查询改写：`infrastructure/rag/QueryRewriter#doQueryRewrite(...)`（用 Spring AI RewriteQueryTransformer）
   - 装配 advisor：`LoveAppRagCustomAdvisorFactory.createLoveAppRagCustomAdvisor(vectorStore, "单身")`

4. 基础设施检索执行（向量检索存储/仓库）：
   - `LoveAppRagCustomAdvisorFactory` 内部创建：
     - `VectorStoreDocumentRetriever.builder()`
     - 设置 `similarityThreshold`（来自 `RagPolicy`）、`topK`（来自 `RagPolicy`）
     - 设置过滤表达式：`status = "单身"`（当前为硬编码 status 入参）
   - 最终由 Spring AI 的 `RetrievalAugmentationAdvisor` 在 LLM 调用前执行检索并把上下文注入 prompt

核心逻辑落点：
1. “是否改写查询、是否开启 RAG、装配检索 advisor”：`application/interaction/service/RagChatApplicationService`
2. “检索参数与过滤表达式”：`infrastructure/rag/LoveAppRagCustomAdvisorFactory`
3. “策略值（topK/阈值）不变量”：`domain/rag/RagPolicy`
4. “向量检索存储”：`VectorStore`（可能是 `SimpleVectorStore` 或 `PgVectorStore`，由 profile 决定）

---

## 5. 代码结构映射表（目录路径 -> DDD 层级 -> 职责）

| 目录路径 | DDD 层级 | 职责说明 |
|---|---|---|
| `src/main/java/com/yupi/yzaiagent/interfaces/web` | 接口层 | HTTP 路由与 SSE 交付；薄 controller 调用应用用例 |
| `src/main/java/com/yupi/yzaiagent/application/interaction` | 应用层 | `LoveApp` 外观/编排入口；把 tenant 配置装配到各类用例服务 |
| `src/main/java/com/yupi/yzaiagent/application/interaction/service` | 应用层 | `ChatApplicationService`/`RagChatApplicationService`/`ToolChatApplicationService` 等：组织 LLM 调用与 advisor/tool 装配 |
| `src/main/java/com/yupi/yzaiagent/application/tenant` | 应用层 | `TenantAiConfigService`：读取租户配置、归一化 tenantId、默认回退策略 |
| `src/main/java/com/yupi/yzaiagent/application/tenant/port` | 应用层端口（Port） | `TenantAiConfigRepository`：配置读取/更新的抽象接口 |
| `src/main/java/com/yupi/yzaiagent/application/agent` | 应用层 | `BaseAgent/ReActAgent/ToolCallAgent/YzManus`：多步执行循环与工具调用编排（状态由 `AgentState` 驱动） |
| `src/main/java/com/yupi/yzaiagent/domain/tenant/model` | 领域层 | `TenantAiConfig`（配置聚合根/快照）、`TenantId`、`ToolPolicy`、`AiModelSpec`：不可变不变量 + 策略表达 |
| `src/main/java/com/yupi/yzaiagent/domain/rag` | 领域层 | `RagPolicy`：检索策略值对象（topK/阈值校验） |
| `src/main/java/com/yupi/yzaiagent/domain/agent/model` | 领域层 | `AgentState`：Agent 生命周期状态枚举 |
| `src/main/java/com/yupi/yzaiagent/infrastructure/tenant` | 基础设施层 | `TenantAiConfigRepository` 适配器：JDBC/Postgres 实现与内存兜底实现 |
| `src/main/java/com/yupi/yzaiagent/infrastructure/ai` | 基础设施层 | `ChatClientFactory`：屏蔽 Spring AI/Provider 差异，让应用层面向“配置 + 用例” |
| `src/main/java/com/yupi/yzaiagent/infrastructure/rag` | 基础设施层 | 查询改写、RAG advisor 工厂、向量库配置（`SimpleVectorStore`/`PgVectorStore`）与文档加载 |
| `src/main/java/com/yupi/yzaiagent/infrastructure/tool` | 基础设施层 | ToolCallback 具体实现与聚合注册（`ToolRegistration`） |
| `src/main/java/com/yupi/yzaiagent/infrastructure/advisor` | 基础设施层 | Spring AI Advisor 实现（如日志、重读等技术增强） |
| `src/main/java/com/yupi/yzaiagent/infrastructure/common` + `infrastructure/exception` | 基础设施层（横切） | 通用响应结构与异常处理；不属于领域规则但影响交付体验 |

