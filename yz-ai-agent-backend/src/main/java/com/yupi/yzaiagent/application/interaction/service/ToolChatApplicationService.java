package com.yupi.yzaiagent.application.interaction.service;

import com.yupi.yzaiagent.infrastructure.advisor.LogAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallback;

/**
 * 工具增强聊天用例（application 层）
 */
public class ToolChatApplicationService {

    private final ChatClient chatClient;
    private final ToolCallback[] toolCallbacks;

    public ToolChatApplicationService(ChatClient chatClient, ToolCallback[] toolCallbacks) {
        this.chatClient = chatClient;
        this.toolCallbacks = toolCallbacks;
    }

    public String chatWithTools(String message, String chatId) {
        ChatResponse response = chatClient
                .prompt()
                .user(message)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId)
                        .param(ChatMemory.CONVERSATION_ID, 10))
                .advisors(new LogAdvisor())
                .toolCallbacks(toolCallbacks)
                .call()
                .chatResponse();
        return response.getResult().getOutput().getText();
    }
}

