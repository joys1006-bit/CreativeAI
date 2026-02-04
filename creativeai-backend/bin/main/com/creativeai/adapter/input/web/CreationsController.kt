package com.creativeai.adapter.input.web

import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/creations")
@CrossOrigin(origins = ["http://localhost:3000"])
class CreationsController {
    
    @GetMapping("/popular")
    fun getPopularCreations(): Mono<ApiResponse<List<PopularCreation>>> {
        val creations = listOf(
            PopularCreation(1, "🐱", "귀여운 고양이", 1200, "user123"),
            PopularCreation(2, "🐶", "강아지 친구", 980, "creator_pro"),
            PopularCreation(3, "🦊", "여우 이모티콘", 756, "fox_lover"),
            PopularCreation(4, "🐻", "곰돌이", 654, "bear_artist"),
            PopularCreation(5, "🐰", "토끼", 543, "bunny_fan")
        )
        
        return Mono.just(
            ApiResponse(
                success = true,
                data = creations,
                message = "인기 크리에이션 조회 성공"
            )
        )
    }
}

data class PopularCreation(
    val id: Int,
    val emoji: String,
    val title: String,
    val likes: Int,
    val creator: String
)
