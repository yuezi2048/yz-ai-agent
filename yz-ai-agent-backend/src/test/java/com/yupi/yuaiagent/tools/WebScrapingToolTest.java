package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.infrastructure.tool.WebScrapingTool;
import com.yupi.yzaiagent.YzAiAgentApplication;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("需要外网访问，默认跳过（integration test）")
public class WebScrapingToolTest {

    @Test
    public void testScrapeWebPage() {
        WebScrapingTool tool = new WebScrapingTool();
        String url = "https://www.baidu.com";
        String result = tool.scrapeWebPage(url);
        assertNotNull(result);
    }
}
