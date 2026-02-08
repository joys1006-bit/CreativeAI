package com.creativeai.adapter.input.web

import com.creativeai.application.service.CreationService
import com.creativeai.common.response.ApiResponse
import java.time.format.DateTimeFormatter
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.Authentication
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
                        .map { pair ->
                                val entity = pair.first
                                val imageUrl = pair.second
                                PopularCreationDto(
                                        id = entity.id ?: 0L,
                                        type = entity.creationType,
                                        title = entity.title ?: "제목 없음",
                                        imageUrl = imageUrl
                                                        ?: "https://picsum.photos/seed/${entity.id}/300/300",
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

        /** 마켓플레이스 조회 API GET /api/creations/marketplace */
        @GetMapping("/marketplace")
        fun getMarketplaceCreations(): Mono<ApiResponse<List<MarketplaceCreationDto>>> {
                return creationService
                        .getMarketplaceCreations()
                        .map { pair ->
                                val entity = pair.first
                                val imageUrl = pair.second
                                MarketplaceCreationDto(
                                        id = entity.id ?: 0L,
                                        title = entity.title ?: "아이템",
                                        price = entity.price?.toInt() ?: 0,
                                        imageUrl = imageUrl
                                                        ?: "https://picsum.photos/seed/${entity.id}/300/300",
                                        likes = entity.likeCount
                                )
                        }
                        .collectList()
                        .map { items ->
                                ApiResponse(success = true, data = items, message = "마켓플레이스 조회 성공")
                        }
        }

        /** 내 창작물 조회 API GET /api/creations/my */
        @GetMapping("/my")
        fun getMyCreations(
                authentication: Authentication?
        ): Mono<ApiResponse<List<MyCreationDto>>> {
                if (authentication == null || !authentication.isAuthenticated) {
                        return Mono.just(
                                ApiResponse(success = false, data = null, message = "인증이 필요합니다.")
                        )
                }

                val userId =
                        try {
                                authentication.principal.toString().toLong()
                        } catch (e: Exception) {
                                return Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = "인증 정보 오류"
                                        )
                                )
                        }

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
                                                ),
                                        imageUrl = "https://picsum.photos/seed/${entity.id}/300/300"
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

data class MarketplaceCreationDto(
        val id: Long,
        val title: String,
        val price: Int,
        val imageUrl: String,
        val likes: Int
)

data class MyCreationDto(
        val id: Long,
        val type: String,
        val status: String,
        val createdAt: String,
        val imageUrl: String? = null
)
