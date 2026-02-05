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
    // Spring WebFlux (비동기/논블로킹)
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Kotlin Coroutines (리액티브 지원)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

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
kotlin {
    jvmToolchain(17)
}
