package com.yupi.yzaiagent.application.interaction.service;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.client.ChatClient;
import reactor.core.publisher.Flux;

/**
 * 会话聊天用例（application 层）
 */
public class ChatApplicationService {

    private final ChatClient chatClient;

    public ChatApplicationService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String chatSync(String message, String chatId) {
        ChatResponse chatResponse = chatClient
                .prompt()
                .user(message)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId))
                .call()
                .chatResponse();
        return chatResponse.getResult().getOutput().getText();
    }

    public Flux<String> chatStream(String message, String chatId) {
        return chatClient
                .prompt()
                .user(message)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId)
                        .param(ChatMemory.CONVERSATION_ID, 10))
                .stream()
                .content();
    }

    public <T> T chatEntity(String systemPrompt, String message, String chatId, Class<T> entityClass) {
        return chatClient
                .prompt()
                .system(systemPrompt)
                .user(message)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId))
                .call()
                .entity(entityClass);
    }
}

