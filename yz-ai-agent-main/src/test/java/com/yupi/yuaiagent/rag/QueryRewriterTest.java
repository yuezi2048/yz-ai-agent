package com.yupi.yuaiagent.rag;

import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class QueryRewriterTest {

    @Resource
    private QueryRewriter queryRewriter;

    @Test
    void doQueryRewrite() {
        String reWrittenQuery = queryRewriter.doQueryRewrite("如何使用DashScope");
        Assertions.assertNotNull(reWrittenQuery);
    }
}