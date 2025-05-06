FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

# Copy maven executable and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Build all dependencies first (cache this layer)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Package the application
RUN ./mvnw package -DskipTests

# Create a smaller runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy jar from build stage
COPY --from=build /workspace/app/target/*.jar app.jar

# Set production environment
ENV SPRING_PROFILES_ACTIVE=prod

# Configure JVM for containerized environment
ENV JAVA_OPTS="-Xms512m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

# Run as non-root user
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]