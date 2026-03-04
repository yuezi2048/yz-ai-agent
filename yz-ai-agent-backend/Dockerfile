# 使用预装 Maven 和 JDK21 的镜像
FROM maven:3.9-amazoncorretto-21

WORKDIR /app

# 复制父 pom 和当前模块
COPY pom.xml .
COPY yz-ai-agent-backend/pom.xml ./yz-ai-agent-backend/
COPY yz-ai-agent-backend/src ./yz-ai-agent-backend/src

# 从根目录构建（确保依赖正确解析）
RUN mvn clean install -pl yz-ai-agent-backend -am -DskipTests

# 暴露应用端口
EXPOSE 8123

# 使用生产环境配置启动应用
CMD ["java", "-jar", "/app/yz-ai-agent-backend/target/yz-ai-agent-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=prod"]
