package com.yupi.yzaiagent.infrastructure.ai;

import com.yupi.yzaiagent.domain.tenant.model.TenantAiConfig;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Component;

/**
 * ChatClient 工厂（基础设施层）
 *
 * 目标：屏蔽 Spring AI / Provider 的差异，让 application 层只面向“配置 + 用例”编排。
 */
@Component
public class ChatClientFactory {

    /**
     * 构建带默认对话记忆的 ChatClient。
     */
    public ChatClient create(ChatModel chatModel, TenantAiConfig config) {
        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(10)
                .build();

        return ChatClient.builder(chatModel)
                .defaultSystem(config.systemPrompt())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }
}

