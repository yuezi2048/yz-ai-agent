package com.yupi.yzaiagent.application.tenant.port;

import com.yupi.yzaiagent.domain.tenant.model.TenantAiConfig;

import java.util.Optional;

/**
 * 租户 AI 配置仓储（端口）
 */
public interface TenantAiConfigRepository {

    Optional<TenantAiConfig> findLoveAppConfig(String tenantId);

    void upsertLoveAppConfig(TenantAiConfig config);
}

