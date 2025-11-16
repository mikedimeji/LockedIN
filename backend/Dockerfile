FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

# Copy pom.xml first
COPY pom.xml .

# Download dependencies (this will also download Maven wrapper if needed)
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Copy source code
COPY src src

# Package the application
RUN mvn package -DskipTests

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

# Listen on Render's PORT environment variable
ENV PORT=8080

# Configure JVM for containerized environment
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

# Use PORT variable
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]