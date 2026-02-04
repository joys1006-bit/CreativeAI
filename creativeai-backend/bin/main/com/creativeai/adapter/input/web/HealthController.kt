package com.creativeai.adapter.input.web

import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * Health Check Controller
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://localhost:3000"])
class HealthController {
    
    @GetMapping("/health")
    fun healthCheck(): Mono<Map<String, String>> {
        return Mono.just(
            mapOf(
                "status" to "healthy",
                "service" to "CreativeAI Backend (Hexagonal + WebFlux)",
                "version" to "2.0.0"
            )
        )
    }
}
