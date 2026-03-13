package com.yupi.yzaiagent.domain.tenant.model;

/**
 * 大模型配置（值对象，占位）
 */
public record AiModelSpec(
        String provider,
        String model
) {
    public AiModelSpec {
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("provider must not be blank");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalArgumentException("model must not be blank");
        }
    }
}

