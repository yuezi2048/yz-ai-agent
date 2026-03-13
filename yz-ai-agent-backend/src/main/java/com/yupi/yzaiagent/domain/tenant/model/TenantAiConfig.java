package com.yupi.yzaiagent.domain.tenant.model;

import com.yupi.yzaiagent.domain.rag.RagPolicy;

/**
 * 租户 AI 配置（值对象，占位）
 *
 * 后续可扩展：工具策略、限流/超时、提示词模板、知识库选择等。
 */
public record TenantAiConfig(
        TenantId tenantId,
        String systemPrompt,
        RagPolicy ragPolicy,
        ToolPolicy toolPolicy,
        AiModelSpec chatModelSpec
) {
    public TenantAiConfig {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }
        if (systemPrompt == null || systemPrompt.isBlank()) {
            throw new IllegalArgumentException("systemPrompt must not be blank");
        }
        if (ragPolicy == null) {
            throw new IllegalArgumentException("ragPolicy must not be null");
        }
        if (toolPolicy == null) {
            throw new IllegalArgumentException("toolPolicy must not be null");
        }
        if (chatModelSpec == null) {
            throw new IllegalArgumentException("chatModelSpec must not be null");
        }
    }
}

