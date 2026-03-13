package com.yupi.yzaiagent.domain.tenant.model;

import java.util.Set;

/**
 * 工具策略（值对象）
 *
 * - enabled: 是否允许启用工具调用
 * - allowedToolNames: 允许的工具名称白名单（为空表示不过滤）
 */
public record ToolPolicy(
        boolean enabled,
        Set<String> allowedToolNames
) {
    public ToolPolicy {
        // allowedToolNames 允许为 null，表示不过滤
    }

    public static ToolPolicy enabledAllowAll() {
        return new ToolPolicy(true, null);
    }

    public static ToolPolicy disabled() {
        return new ToolPolicy(false, null);
    }
}

