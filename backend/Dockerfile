FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

# Copy parent pom
COPY pom.xml .

# Copy backend module
COPY backend backend

# Create a dummy frontend pom to satisfy parent POM
RUN mkdir -p frontend && \
    echo '<?xml version="1.0" encoding="UTF-8"?><project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><parent><groupId>pomo</groupId><artifactId>Lockedin</artifactId><version>0.0.1-SNAPSHOT</version></parent><artifactId>frontend</artifactId><packaging>pom</packaging></project>' > frontend/pom.xml

# Install Maven and build only the backend module
RUN apk add --no-cache maven && \
    mvn clean package -pl backend -am -DskipTests

# Create a smaller runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy jar from build stage
COPY --from=build /workspace/app/backend/target/*.jar app.jar

# Set production environment
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

# Use PORT variable
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]