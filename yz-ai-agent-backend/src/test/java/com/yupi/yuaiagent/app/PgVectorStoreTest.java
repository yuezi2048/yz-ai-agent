package com.yupi.yuaiagent.app;

import com.yupi.yzaiagent.YzAiAgentApplication;
import com.yupi.yzaiagent.infrastructure.rag.LoveAppDocumentLoader;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

@SpringBootTest(classes = YzAiAgentApplication.class)
@Disabled("需要本地 PGVector / 数据库环境，默认跳过（integration test）")
public class PgVectorStoreTest {

    @Resource
    VectorStore pgVectorVectorStore;

    @Resource
    LoveAppDocumentLoader loveAppDocumentLoader;

    @Test
    void test() {
        List<Document> documents = loveAppDocumentLoader.loadMarkdowns();

        // Add the documents to PGVector
        // 分批处理文档，每批不超过10个
        int batchSize = 10;
        for (int i = 0; i < documents.size(); i += batchSize) {
            List<Document> batch = documents.subList(i, Math.min(i + batchSize, documents.size()));
            pgVectorVectorStore.add(batch);
        }

        // Retrieve documents similar to a query
        List<Document> results = this.pgVectorVectorStore.similaritySearch(SearchRequest.builder().query("Spring").topK(5).build());

        Assertions.assertNotNull(results);
    }

    @Test
    void test2() {
        List<Document> documents = List.of(
                new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("meta1", "meta1")),
                new Document("The World is Big and Salvation Lurks Around the Corner"),
                new Document("You walk forward facing the past and you turn back toward the future.", Map.of("meta2", "meta2")));
        // 添加文档
        pgVectorVectorStore.add(documents);
        // 相似度查询
        List<Document> results = pgVectorVectorStore.similaritySearch(SearchRequest.builder().query("Spring").topK(5).build());
        Assertions.assertNotNull(results);
    }

}
