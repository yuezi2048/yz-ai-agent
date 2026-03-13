package com.yupi.yzaiagent.infrastructure.tenant;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yupi.yzaiagent.application.tenant.port.TenantAiConfigRepository;
import com.yupi.yzaiagent.domain.rag.RagPolicy;
import com.yupi.yzaiagent.domain.tenant.model.AiModelSpec;
import com.yupi.yzaiagent.domain.tenant.model.TenantAiConfig;
import com.yupi.yzaiagent.domain.tenant.model.TenantId;
import com.yupi.yzaiagent.domain.tenant.model.ToolPolicy;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

/**
 * 基于 Postgres 的租户 AI 配置仓储实现（infrastructure 适配器）
 *
 * 表结构采用“单表 JSON + 少量常用列”方式，方便后续演进配置项。
 */
@Repository
@Profile("!test")
public class JdbcTenantAiConfigRepository implements TenantAiConfigRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public JdbcTenantAiConfigRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        initSchema();
    }

    private void initSchema() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS tenant_ai_config (
                    tenant_id TEXT PRIMARY KEY,
                    app_key TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    rag_top_k INT NOT NULL,
                    rag_similarity_threshold DOUBLE PRECISION NOT NULL,
                    tool_enabled BOOLEAN NOT NULL,
                    tool_allowed_names_json TEXT NULL,
                    chat_provider TEXT NOT NULL,
                    chat_model TEXT NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_tenant_ai_config_app_key
                ON tenant_ai_config(app_key);
                """);
    }

    @Override
    public Optional<TenantAiConfig> findLoveAppConfig(String tenantId) {
        String sql = """
                SELECT tenant_id, system_prompt, rag_top_k, rag_similarity_threshold,
                       tool_enabled, tool_allowed_names_json, chat_provider, chat_model
                FROM tenant_ai_config
                WHERE tenant_id = ? AND app_key = 'love_app'
                """;
        return jdbcTemplate.query(sql, rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            String tid = rs.getString("tenant_id");
            String systemPrompt = rs.getString("system_prompt");
            int topK = rs.getInt("rag_top_k");
            double threshold = rs.getDouble("rag_similarity_threshold");
            boolean toolEnabled = rs.getBoolean("tool_enabled");
            String allowedJson = rs.getString("tool_allowed_names_json");
            String provider = rs.getString("chat_provider");
            String model = rs.getString("chat_model");

            Set<String> allowedNames = null;
            if (allowedJson != null && !allowedJson.isBlank()) {
                try {
                    allowedNames = objectMapper.readValue(allowedJson, new TypeReference<Set<String>>() {});
                } catch (Exception e) {
                    // 解析失败则视为不过滤，避免线上配置导致不可用
                    allowedNames = null;
                }
            }

            TenantAiConfig config = new TenantAiConfig(
                    new TenantId(tid),
                    systemPrompt,
                    new RagPolicy(topK, threshold),
                    new ToolPolicy(toolEnabled, allowedNames),
                    new AiModelSpec(provider, model)
            );
            return Optional.of(config);
        }, tenantId);
    }

    @Override
    public void upsertLoveAppConfig(TenantAiConfig config) {
        String allowedJson = null;
        try {
            if (config.toolPolicy().allowedToolNames() != null) {
                allowedJson = objectMapper.writeValueAsString(config.toolPolicy().allowedToolNames());
            }
        } catch (Exception e) {
            allowedJson = null;
        }

        String sql = """
                INSERT INTO tenant_ai_config(
                    tenant_id, app_key, system_prompt, rag_top_k, rag_similarity_threshold,
                    tool_enabled, tool_allowed_names_json, chat_provider, chat_model
                )
                VALUES (?, 'love_app', ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (tenant_id)
                DO UPDATE SET
                    system_prompt = EXCLUDED.system_prompt,
                    rag_top_k = EXCLUDED.rag_top_k,
                    rag_similarity_threshold = EXCLUDED.rag_similarity_threshold,
                    tool_enabled = EXCLUDED.tool_enabled,
                    tool_allowed_names_json = EXCLUDED.tool_allowed_names_json,
                    chat_provider = EXCLUDED.chat_provider,
                    chat_model = EXCLUDED.chat_model,
                    updated_at = NOW()
                """;

        jdbcTemplate.update(
                sql,
                config.tenantId().value(),
                config.systemPrompt(),
                config.ragPolicy().topK(),
                config.ragPolicy().similarityThreshold(),
                config.toolPolicy().enabled(),
                allowedJson,
                config.chatModelSpec().provider(),
                config.chatModelSpec().model()
        );
    }
}

