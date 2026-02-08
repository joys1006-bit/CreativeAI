package com.creativeai.adapter.input.web

import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/debug")
class DebugController {

    @PostMapping
    fun debug(@RequestBody body: String): Mono<String> {
        println("DEBUG BODY: $body")
        return Mono.just("Received: $body")
    }

    @PostMapping("/signup")
    fun debugSignup(
            @RequestBody request: com.creativeai.adapter.input.web.SignupRequest
    ): Mono<String> {
        return Mono.just("Received SignupRequest: ${request.email}")
    }
}
