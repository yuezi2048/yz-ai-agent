package com.yupi.yzaiagent.application.interaction.service;

import com.yupi.yzaiagent.infrastructure.advisor.LogAdvisor;
import com.yupi.yzaiagent.infrastructure.rag.LoveAppRagCustomAdvisorFactory;
import com.yupi.yzaiagent.infrastructure.rag.QueryRewriter;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;

/**
 * RAG 增强聊天用例（application 层）
 */
public class RagChatApplicationService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final QueryRewriter queryRewriter;

    public RagChatApplicationService(ChatClient chatClient, VectorStore vectorStore, QueryRewriter queryRewriter) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.queryRewriter = queryRewriter;
    }

    public String chatWithRag(String message, String chatId) {
        if (vectorStore == null) {
            throw new IllegalStateException("loveAppVectorStore 未配置，无法使用 RAG 能力");
        }
        String rewritten = queryRewriter == null ? message : queryRewriter.doQueryRewrite(message);

        ChatResponse chatResponse = chatClient
                .prompt()
                .user(rewritten)
                .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId))
                .advisors(new LogAdvisor())
                .advisors(LoveAppRagCustomAdvisorFactory.createLoveAppRagCustomAdvisor(vectorStore, "单身"))
                .call()
                .chatResponse();
        return chatResponse.getResult().getOutput().getText();
    }
}

