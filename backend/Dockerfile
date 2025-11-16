FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

# Copy maven executable and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

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

COPY --from=build /workspace/app/target/*.jar app.jar

# Set production environment
ENV SPRING_PROFILES_ACTIVE=prod

ENV PORT=8080

# Configure JVM for containerized environment
# Reduced memory for free tier (512MB max on Render free tier)
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"


ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]