package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.tools.ResourceDownloadTool;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
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
