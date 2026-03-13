package com.yupi.yuaiagent.demo.rag;

import com.yupi.yzaiagent.YzAiAgentApplication;
import com.yupi.yzaiagent.infrastructure.demo.rag.MultiQueryExpanderDemo;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.ai.rag.Query;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("依赖外部大模型能力，默认跳过（integration test）")
class MultiQueryExpanderDemoTest {

    @Resource
    private MultiQueryExpanderDemo multiQueryExpanderDemo;

    @Test
    void expandQuery() {
        List<Query> queries = multiQueryExpanderDemo.expandQuery("谁是程序员鱼皮啊啊啊啊啊啊？");
        Assertions.assertNotNull(queries);
    }
}