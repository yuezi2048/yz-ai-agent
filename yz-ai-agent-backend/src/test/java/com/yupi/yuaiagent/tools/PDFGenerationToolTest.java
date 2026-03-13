package com.yupi.yuaiagent.tools;

import com.yupi.yzaiagent.infrastructure.tool.PDFGenerationTool;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class PDFGenerationToolTest {

    @Test
    public void testGeneratePDF() {
        PDFGenerationTool tool = new PDFGenerationTool();
        String fileName = "cat.pdf";
        String content = "喵喵喵";
        String result = tool.generatePDF(fileName, content);
        assertNotNull(result);
    }
}
