package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.infrastructure.tool.WebSearchTool;
import com.yupi.yzaiagent.YzAiAgentApplication;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("需要联网与第三方搜索API Key，默认跳过（integration test）")
public class WebSearchToolTest {

    @Value("${search-api.api-key}")
    private String searchApiKey;

    @Test
    public void testSearchWeb() {
        WebSearchTool tool = new WebSearchTool(searchApiKey);
        String query = "百度 www.baidu.com";
        String result = tool.searchWeb(query);
        assertNotNull(result);
    }
}
