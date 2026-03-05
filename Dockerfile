# 使用预装 Maven 和 JDK21 的镜像
FROM maven:3.9-amazoncorretto-21

WORKDIR /app

# 复制整个项目到容器中（确保父 pom 和子模块都在正确位置）
COPY . .

# 从根目录构建整个项目
# -pl yz-ai-agent-backend: 只构建 yz-ai-agent-backend 模块
# -am: 同时构建该模块依赖的所有模块（包括父 pom）
RUN mvn clean install -pl yz-ai-agent-backend -am -DskipTests

# 暴露应用端口
EXPOSE 8123

# 使用生产环境配置启动应用
CMD ["java", "-jar", "/app/yz-ai-agent-backend/target/yz-ai-agent-backend-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=prod"]
