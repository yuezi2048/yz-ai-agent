package com.yupi.yzaiagent.infrastructure.tenant;

import com.yupi.yzaiagent.application.tenant.port.TenantAiConfigRepository;
import com.yupi.yzaiagent.domain.tenant.model.TenantAiConfig;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 测试/无 DB 环境下的内存仓储兜底
 */
@Repository
@Profile("test")
public class InMemoryTenantAiConfigRepository implements TenantAiConfigRepository {

    private final ConcurrentHashMap<String, TenantAiConfig> loveAppConfigs = new ConcurrentHashMap<>();

    @Override
    public Optional<TenantAiConfig> findLoveAppConfig(String tenantId) {
        return Optional.ofNullable(loveAppConfigs.get(tenantId));
    }

    @Override
    public void upsertLoveAppConfig(TenantAiConfig config) {
        loveAppConfigs.put(config.tenantId().value(), config);
    }
}

