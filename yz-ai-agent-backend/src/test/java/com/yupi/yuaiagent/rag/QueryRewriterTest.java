package com.yupi.yuaiagent.rag;

import com.yupi.yzaiagent.infrastructure.rag.QueryRewriter;
import com.yupi.yzaiagent.YzAiAgentApplication;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("依赖外部大模型能力，默认跳过（integration test）")
class QueryRewriterTest {

    @Resource
    private QueryRewriter queryRewriter;

    @Test
    void doQueryRewrite() {
        String reWrittenQuery = queryRewriter.doQueryRewrite("如何使用DashScope");
        Assertions.assertNotNull(reWrittenQuery);
    }
}