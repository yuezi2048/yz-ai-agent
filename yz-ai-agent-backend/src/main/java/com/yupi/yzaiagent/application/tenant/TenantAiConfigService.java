package com.yupi.yzaiagent.application.tenant;

import com.yupi.yzaiagent.domain.rag.RagPolicy;
import com.yupi.yzaiagent.application.tenant.port.TenantAiConfigRepository;
import com.yupi.yzaiagent.domain.tenant.model.AiModelSpec;
import com.yupi.yzaiagent.domain.tenant.model.TenantAiConfig;
import com.yupi.yzaiagent.domain.tenant.model.TenantId;
import com.yupi.yzaiagent.domain.tenant.model.ToolPolicy;
import org.springframework.stereotype.Service;

/**
 * 租户 AI 配置用例服务（暂为内存默认实现）
 *
 * 后续替换为：从 DB/配置中心读取、带版本与灰度发布。
 */
@Service
public class TenantAiConfigService {

    public static final String DEFAULT_TENANT_ID = "default";

    // 先沿用 LoveApp 的系统提示词，后续按 tenant 维护模板与变量
    private static final String LOVE_APP_SYSTEM_PROMPT = "扮演深耕恋爱心理领域的专家。开场向用户表明身份，告知用户可倾诉恋爱难题。"
            + "围绕单身、恋爱、已婚三种状态提问：单身状态询问社交圈拓展及追求心仪对象的困扰；"
            + "恋爱状态询问沟通、习惯差异引发的矛盾；已婚状态询问家庭责任与亲属关系处理的问题。"
            + "引导用户详述事情经过、对方反应及自身想法，以便给出专属解决方案。"
            + "当用户提到‘搜索图片 / 查找图片 / 壁纸 / 图片链接’等需求时，必须调用 searchImage 工具，并将返回的图片 URL 原样展示给用户。";

    public TenantAiConfig getLoveAppConfig(String tenantId) {
        String normalized = (tenantId == null || tenantId.isBlank()) ? DEFAULT_TENANT_ID : tenantId.trim();
        // 先查 DB/配置中心，缺省回退默认配置
        return repository.findLoveAppConfig(normalized)
                .orElseGet(() -> defaultLoveAppConfig(normalized));
    }

    private final TenantAiConfigRepository repository;

    public TenantAiConfigService(TenantAiConfigRepository repository) {
        this.repository = repository;
    }

    public TenantAiConfig defaultLoveAppConfig(String tenantId) {
        return new TenantAiConfig(
                new TenantId(tenantId),
                LOVE_APP_SYSTEM_PROMPT,
                RagPolicy.defaultLoveAppPolicy(),
                ToolPolicy.enabledAllowAll(),
                new AiModelSpec("dashscope", "qwen-plus")
        );
    }
}

