# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (better for Docker caching)
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create directories for uploads and reports
RUN mkdir -p /app/uploads /app/reports && chmod 777 /app/uploads /app/reports

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
