plugins {
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.creativeai"

version = "0.0.1-SNAPSHOT"

java { sourceCompatibility = JavaVersion.VERSION_17 }

repositories { mavenCentral() }

dependencies {
    // Spring WebFlux (�񵿱�/����ŷ)
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Kotlin Coroutines (����Ƽ�� ����)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

    // R2DBC & MySQL
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("io.asyncer:r2dbc-mysql:1.0.2")

    // Jackson (JSON)
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Kotlin Reflect
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}

tasks.withType<Test> { useJUnitPlatform() }

kotlin { jvmToolchain(17) }
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")

    // Jackson (JSON)
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Kotlin Reflect
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    
    // Security Test (인증 테스트용)
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> { useJUnitPlatform() }

kotlin { jvmToolchain(17) }
