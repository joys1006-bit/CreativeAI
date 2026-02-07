package com.creativeai.adapter.input.web

import com.creativeai.adapter.output.persistence.CreationR2dbcRepository
import com.creativeai.common.response.ApiResponse
import java.math.BigDecimal
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * ============================================ 마켓플레이스 컨트롤러 (DB Connected)
 * ============================================
 *
 * 엔드포인트:
 * - GET /api/marketplace : 마켓플레이스 아이템 조회
 */
@RestController
@RequestMapping("/api/marketplace")
@CrossOrigin(origins = ["http://localhost:3000", "http://localhost:5173"])
class MarketplaceController(private val creationRepository: CreationR2dbcRepository) {

        @GetMapping
        fun getMarketplaceItems(
                @RequestParam(required = false) category: String?,
                @RequestParam(defaultValue = "20") limit: Int
        ): Mono<ApiResponse<List<MarketplaceItemDto>>> {
                // DB에서 판매 중인 아이템 조회 (is_for_sale = true)
                return creationRepository
                        .findAll()
                        .filter { it.isForSale }
                        .take(limit.toLong())
                        .map { entity ->
                                MarketplaceItemDto(
                                        id = entity.id ?: 0L,
                                        // Use a deterministically random image based on ID to make
                                        // it look stable
                                        thumbnailUrl =
                                                "https://picsum.photos/seed/${entity.id}/300/300",
                                        title = entity.title ?: "Untitled",
                                        price = entity.price ?: BigDecimal.ZERO,
                                        authorName =
                                                "User ${entity.userId}", // Simplified author name
                                        category = entity.creationType
                                )
                        }
                        .collectList()
                        .map { items ->
                                ApiResponse(
                                        success = true,
                                        data = items,
                                        message = "마켓플레이스 아이템 조회 성공"
                                )
                        }
        }
}

data class MarketplaceItemDto(
        val id: Long,
        val thumbnailUrl: String,
        val title: String,
        val price: BigDecimal,
        val authorName: String,
        val category: String
)
