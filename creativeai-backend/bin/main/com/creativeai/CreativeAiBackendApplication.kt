package com.creativeai

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CreativeAiBackendApplication

fun main(args: Array<String>) {
    runApplication<CreativeAiBackendApplication>(*args)
}
