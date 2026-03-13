package com.yupi.yzaiagent.application.interaction.service;

import com.yupi.yzaiagent.infrastructure.advisor.LogAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.tool.ToolCallback;

/**
 * MCP 工具增强聊天用例（application 层）
 */
public class McpChatApplicationService {

    private final ChatClient chatClient;
    private final SyncMcpToolCallbackProvider toolCallbackProvider;

    public McpChatApplicationService(ChatClient chatClient, SyncMcpToolCallbackProvider toolCallbackProvider) {
        this.chatClient = chatClient;
        this.toolCallbackProvider = toolCallbackProvider;
    }

    public String chatWithMcpTools(String message, String chatId) {
        if (toolCallbackProvider == null) {
            throw new IllegalStateException("MCP ToolCallbackProvider 未配置，无法使用 MCP 工具能力");
        }
        ToolCallback[] toolCallbacks = toolCallbackProvider.getToolCallbacks();

        ChatResponse response = chatClient
                .prompt()
                .user(message)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId))
                .advisors(new LogAdvisor())
                .toolCallbacks(toolCallbacks)
                .call()
                .chatResponse();
        return response.getResult().getOutput().getText();
    }
}

