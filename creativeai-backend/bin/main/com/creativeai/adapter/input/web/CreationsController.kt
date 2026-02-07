package com.creativeai.adapter.input.web

import com.creativeai.application.service.CreationService
import com.creativeai.common.response.ApiResponse
import java.time.format.DateTimeFormatter
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 창작물 컨트롤러 통합된 창작물 목록 조회 및 관리 API */
@RestController
@RequestMapping("/api/creations")
@CrossOrigin(origins = ["http://localhost:3000"])
class CreationsController {
        @Autowired lateinit var creationService: CreationService

        /** 인기 창작물 조회 API GET /api/creations/popular */
        @GetMapping("/popular")
        fun getPopularCreations(): Mono<ApiResponse<List<PopularCreationDto>>> {
                return creationService
                        .getPopularCreations()
                        .map { entity ->
                                PopularCreationDto(
                                        id = entity.id ?: 0L,
                                        type = entity.creationType,
                                        title = entity.title ?: "제목 없음",
                                        // Use seeded random image to look consistent
                                        imageUrl =
                                                "https://picsum.photos/seed/${entity.id}/300/300",
                                        creator = "User-${entity.userId}",
                                        likes = entity.likeCount
                                )
                        }
                        .collectList()
                        .map { creations ->
                                ApiResponse(
                                        success = true,
                                        data = creations,
                                        message = "인기 창작물 조회 성공"
                                )
                        }
        }

        /** 내 창작물 조회 API GET /api/creations/my */
        @GetMapping("/my")
        fun getMyCreations(
                @RequestParam(defaultValue = "1") userId: Long // 임시: 인증 구현 전이라 파라미터로 받음
        ): Mono<ApiResponse<List<MyCreationDto>>> {
                return creationService
                        .getUserCreations(userId)
                        .map { entity ->
                                MyCreationDto(
                                        id = entity.id ?: 0L,
                                        type = entity.creationType,
                                        status = entity.status,
                                        createdAt =
                                                entity.createdAt.format(
                                                        DateTimeFormatter.ISO_DATE_TIME
                                                )
                                )
                        }
                        .collectList()
                        .map { creations ->
                                ApiResponse(
                                        success = true,
                                        data = creations,
                                        message = "내 창작물 조회 성공"
                                )
                        }
        }
}

// DTOs
data class PopularCreationDto(
        val id: Long,
        val type: String,
        val title: String,
        val imageUrl: String,
        val creator: String,
        val likes: Int
)

data class MyCreationDto(val id: Long, val type: String, val status: String, val createdAt: String)
