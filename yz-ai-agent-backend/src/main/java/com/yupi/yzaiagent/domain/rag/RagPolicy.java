package com.yupi.yzaiagent.domain.rag;

/**
 * RAG 检索策略（领域值对象）
 */
public record RagPolicy(
        int topK,
        double similarityThreshold
) {
    public RagPolicy {
        if (topK <= 0) {
            throw new IllegalArgumentException("topK must be positive");
        }
        if (similarityThreshold < 0 || similarityThreshold > 1) {
            throw new IllegalArgumentException("similarityThreshold must be in [0, 1]");
        }
    }

    public static RagPolicy defaultLoveAppPolicy() {
        return new RagPolicy(3, 0.5);
    }
}

