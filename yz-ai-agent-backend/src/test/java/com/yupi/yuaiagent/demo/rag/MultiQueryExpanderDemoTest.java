package com.yupi.yuaiagent.demo.rag;

import com.yupi.yzaiagent.demo.rag.MultiQueryExpanderDemo;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.ai.rag.Query;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
class MultiQueryExpanderDemoTest {

    @Resource
    private MultiQueryExpanderDemo multiQueryExpanderDemo;

    @Test
    void expandQuery() {
        List<Query> queries = multiQueryExpanderDemo.expandQuery("谁是程序员鱼皮啊啊啊啊啊啊？");
        Assertions.assertNotNull(queries);
    }
}