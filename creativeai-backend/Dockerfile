FROM gradle:8.5.0-jdk17-alpine AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle build -x test --no-daemon

FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
COPY --from=builder /app/build/libs/*.jar app.jar
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
