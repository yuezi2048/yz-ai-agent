package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.infrastructure.tool.ResourceDownloadTool;
import com.yupi.yzaiagent.YzAiAgentApplication;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("需要外网访问，默认跳过（integration test）")
public class ResourceDownloadToolTest {

    @Test
    public void testDownloadResource() {
        ResourceDownloadTool tool = new ResourceDownloadTool();
        String url = "https://www.quazero.com/uploads/allimg/150806/1-150P6151H1-50.jpg";
        String fileName = "cat.png";
        String result = tool.downloadResource(url, fileName);
        assertNotNull(result);
    }
}
