package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.infrastructure.tool.TerminalOperationTool;
import com.yupi.yzaiagent.YzAiAgentApplication;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("会执行本地命令，存在安全风险，默认跳过（integration test）")
public class TerminalOperationToolTest {

    @Test
    public void testExecuteTerminalCommand() {
        TerminalOperationTool tool = new TerminalOperationTool();
        String command = "ls -l";
        String result = tool.executeTerminalCommand(command);
        assertNotNull(result);
    }
}
