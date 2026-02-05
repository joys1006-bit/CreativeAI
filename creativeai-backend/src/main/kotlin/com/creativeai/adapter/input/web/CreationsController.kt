package com.creativeai.adapter.input.web

import com.creativeai.application.service.CreationService
import com.creativeai.common.response.ApiResponse
import java.time.format.DateTimeFormatter
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 창작물 컨트롤러 통합된 창작물 목록 조회 및 관리 API */
@RestController
@RequestMapping("/api/creations")
@CrossOrigin(origins = ["http://localhost:3000"])
class CreationsController(private val creationService: CreationService) {

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
                                        // 메타데이터나 파일 테이블을 조회해서 실제 값을 채워야 하지만,
                                        // 현재 단계에서는 간단히 매핑
                                        imageUrl =
                                                "https://via.placeholder.com/150?text=${entity.creationType}",
                                        creator = "User-${entity.userId}",
                                        likes = (0..1000).random() // 임시 랜덤 값
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
