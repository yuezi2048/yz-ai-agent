package com.yupi.yuaiagent.app;

import com.yupi.yuaiagent.rag.LoveAppDocumentLoader;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

@SpringBootTest
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

}
