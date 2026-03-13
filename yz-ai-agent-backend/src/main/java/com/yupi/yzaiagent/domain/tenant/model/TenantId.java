package com.yupi.yzaiagent.domain.tenant.model;

/**
 * 租户标识（值对象）
 */
public record TenantId(String value) {
    public TenantId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("TenantId must not be blank");
        }
    }
}

