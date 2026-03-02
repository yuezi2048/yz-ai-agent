package com.yupi;

import com.yupi.tools.ImageSearchTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * @author yuezi2048
 * @version 1.0
 */
@SpringBootApplication
public class yuImageSearchMcpServer {

    private static final Logger logger = LoggerFactory.getLogger(yuImageSearchMcpServer.class);

    public static void main(String[] args) {
        SpringApplication.run(yuImageSearchMcpServer.class, args);
    }

    @Bean
    public ToolCallbackProvider imageSearchTools(ImageSearchTool imageSearchTool) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(imageSearchTool)
                .build();
    }
}
