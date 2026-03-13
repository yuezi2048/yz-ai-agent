package com.yupi.yzaiagent.application.interaction;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import com.yupi.yzaiagent.application.tenant.TenantAiConfigService;
import com.yupi.yzaiagent.application.interaction.service.ChatApplicationService;
import com.yupi.yzaiagent.application.interaction.service.McpChatApplicationService;
import com.yupi.yzaiagent.application.interaction.service.RagChatApplicationService;
import com.yupi.yzaiagent.application.interaction.service.ToolChatApplicationService;
import com.yupi.yzaiagent.infrastructure.ai.ChatClientFactory;
import com.yupi.yzaiagent.infrastructure.rag.QueryRewriter;

@Component
@Slf4j
public class LoveApp {

    private final ChatModel dashscopeChatModel;
    private final ChatClientFactory chatClientFactory;
    private final TenantAiConfigService tenantAiConfigService;
    private final VectorStore loveAppVectorStore;
    private final QueryRewriter queryRewriter;
    private final ToolCallback[] allTools;
    private final SyncMcpToolCallbackProvider toolCallbackProvider;

    public LoveApp(
            ChatModel dashscopeChatModel,
            ChatClientFactory chatClientFactory,
            TenantAiConfigService tenantAiConfigService,
            @Autowired(required = false) @Qualifier("loveAppVectorStore") VectorStore loveAppVectorStore,
            @Autowired(required = false) QueryRewriter queryRewriter,
            ToolCallback[] allTools,
            @Autowired(required = false) SyncMcpToolCallbackProvider toolCallbackProvider
    ) {
        this.dashscopeChatModel = dashscopeChatModel;
        this.chatClientFactory = chatClientFactory;
        this.tenantAiConfigService = tenantAiConfigService;
        this.loveAppVectorStore = loveAppVectorStore;
        this.queryRewriter = queryRewriter;
        this.allTools = allTools;
        this.toolCallbackProvider = toolCallbackProvider;
    }

    public String doChat(String message, String chatId) {
        return doChat(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    public record LoveReport(String title, List<String> suggestions) {
    }

    public Flux<String> doChatByStream(String message, String chatId) {
        return doChatByStream(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    public LoveReport doChatWithReport(String message, String chatId) {
        return doChatWithReport(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    public String doChatWithRag(String message, String chatId) {
        return doChatWithRag(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    public String doChatWithTools(String message, String chatId) {
        return doChatWithTools(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    /**
     * AI 恋爱报告功能（调用 MCP 服务）
     *
     * @param message
     * @param chatId
     * @return
     */
    public String doChatWithMcp(String message, String chatId) {
        return doChatWithMcp(message, chatId, TenantAiConfigService.DEFAULT_TENANT_ID);
    }

    // ------------------------------
    // 多租户透传版本（新接口）
    // ------------------------------

    public String doChat(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        return new ChatApplicationService(chatClient).chatSync(message, chatId);
    }

    public Flux<String> doChatByStream(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        return new ChatApplicationService(chatClient).chatStream(message, chatId);
    }

    public LoveReport doChatWithReport(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        return new ChatApplicationService(chatClient).chatEntity(
                config.systemPrompt() + "每次对话后都要生成恋爱结果，标题为{用户名}的恋爱报告，内容为建议列表",
                message,
                chatId,
                LoveReport.class
        );
    }

    public String doChatWithRag(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        return new RagChatApplicationService(chatClient, loveAppVectorStore, queryRewriter)
                .chatWithRag(message, chatId);
    }

    public String doChatWithTools(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        if (!config.toolPolicy().enabled()) {
            throw new IllegalStateException("当前租户未启用工具能力");
        }
        return new ToolChatApplicationService(chatClient, filterTools(allTools, config.toolPolicy()))
                .chatWithTools(message, chatId);
    }

    public String doChatWithMcp(String message, String chatId, String tenantId) {
        var config = tenantAiConfigService.getLoveAppConfig(tenantId);
        var chatClient = chatClientFactory.create(dashscopeChatModel, config);
        if (!config.toolPolicy().enabled()) {
            throw new IllegalStateException("当前租户未启用工具能力");
        }
        return new McpChatApplicationService(chatClient, toolCallbackProvider)
                .chatWithMcpTools(message, chatId);
    }

    private static ToolCallback[] filterTools(ToolCallback[] allTools, com.yupi.yzaiagent.domain.tenant.model.ToolPolicy toolPolicy) {
        if (allTools == null) {
            return new ToolCallback[0];
        }
        if (toolPolicy.allowedToolNames() == null || toolPolicy.allowedToolNames().isEmpty()) {
            return allTools;
        }
        return java.util.Arrays.stream(allTools)
                .filter(tc -> {
                    String name = resolveToolName(tc);
                    return name == null || toolPolicy.allowedToolNames().contains(name);
                })
                .toArray(ToolCallback[]::new);
    }

    /**
     * 兼容不同 Spring AI 版本的 ToolCallback 取名方式：优先反射 getToolDefinition().name()
     */
    private static String resolveToolName(ToolCallback toolCallback) {
        try {
            var m = toolCallback.getClass().getMethod("getToolDefinition");
            Object def = m.invoke(toolCallback);
            if (def == null) return null;
            // ToolDefinition 可能是 record / interface：尝试 name() / getName()
            try {
                var nameMethod = def.getClass().getMethod("name");
                Object name = nameMethod.invoke(def);
                return name == null ? null : name.toString();
            } catch (NoSuchMethodException ignored) {
                var nameMethod = def.getClass().getMethod("getName");
                Object name = nameMethod.invoke(def);
                return name == null ? null : name.toString();
            }
        } catch (Exception e) {
            return null;
        }
    }

}