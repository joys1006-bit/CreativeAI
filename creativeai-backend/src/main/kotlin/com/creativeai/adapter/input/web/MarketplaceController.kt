package com.creativeai.adapter.input.web

import com.creativeai.common.response.ApiResponse
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/marketplace")
@CrossOrigin(origins = ["http://localhost:3000"])
class MarketplaceController {

    @GetMapping("/items")
    fun getMarketplaceItems(): Mono<ApiResponse<List<MarketplaceItem>>> {
        val items =
                listOf(
                        MarketplaceItem(1, "📦", "이모티콘 팩", 2900, 4.8, 1234),
                        MarketplaceItem(2, "🎨", "프리미엄 템플릿", 4900, 4.9, 856),
                        MarketplaceItem(3, "🎭", "아바타 세트", 3900, 4.7, 672),
                        MarketplaceItem(4, "🌟", "특별 에디션", 5900, 5.0, 423)
                )

        return Mono.just(ApiResponse(success = true, data = items, message = "마켓플레이스 아이템 조회 성공"))
    }
}

data class MarketplaceItem(
        val id: Int,
        val emoji: String,
        val title: String,
        val price: Int,
        val rating: Double,
        val downloads: Int
)
