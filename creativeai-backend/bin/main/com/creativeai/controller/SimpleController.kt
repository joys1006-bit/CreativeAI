package com.creativeai.controller

import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://localhost:3000"])
class SimpleController {
    
    @GetMapping("/health")
    fun health(): Map<String, String> {
        return mapOf(
            "status" to "healthy",
            "service" to "CreativeAI Backend",
            "version" to "2.0.0"
        )
    }
    
    @GetMapping("/emoji/styles")
    fun getStyles(): ApiResponse<List<EmojiStyle>> {
        val styles = listOf(
            EmojiStyle("kakao", "카톡 스타일", "동그란 캐릭터, 파스텔 톤"),
            EmojiStyle("line", "라인 스타일", "심플한 라인, 큰 눈"),
            EmojiStyle("cute", "귀여움", "일본 애니메이션 스타일"),
            EmojiStyle("minimal", "미니멀", "단순한 선, 모노톤"),
            EmojiStyle("3d", "3D", "입체감 있는 캐릭터"),
            EmojiStyle("retro", "레트로", "90년대 픽셀 아트")
        )
        return ApiResponse(true, styles, "스타일 목록 조회 성공")
    }
    
    @PostMapping("/emoji/generate")
    fun generate(@RequestBody request: GenerateRequest): ApiResponse<GenerateResponse> {
        val id = java.util.UUID.randomUUID().toString()
        return ApiResponse(
            true,
            GenerateResponse(id, "processing", 0, 3),
            "생성 요청 성공"
        )
    }
    
    @GetMapping("/emoji/generation/{id}")
    fun getStatus(@PathVariable id: String): ApiResponse<GenerateResponse> {
        return ApiResponse(
            true,
            GenerateResponse(id, "completed", 100, 0),
            "생성 완료"
        )
    }
    
    @GetMapping("/creations/popular")
    fun getPopular(): ApiResponse<List<PopularCreation>> {
        val creations = listOf(
            PopularCreation(1, "🐱", "귀여운 고양이", 1200, "user123"),
            PopularCreation(2, "🐶", "강아지 친구", 980, "creator_pro"),
            PopularCreation(3, "🦊", "여우 이모티콘", 756, "fox_lover")
        )
        return ApiResponse(true, creations, "인기 크리에이션 조회 성공")
    }
    
    @GetMapping("/marketplace/items")
    fun getMarketplace(): ApiResponse<List<MarketplaceItem>> {
        val items = listOf(
            MarketplaceItem(1, "📦", "이모티콘 팩", 2900, 4.8, 1234),
            MarketplaceItem(2, "🎨", "프리미엄 템플릿", 4900, 4.9, 856)
        )
        return ApiResponse(true, items, "마켓플레이스 조회 성공")
    }
}

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?
)

data class EmojiStyle(
    val id: String,
    val name: String,
    val description: String
)

data class GenerateRequest(
    val imageData: String?,
    val prompt: String?,
    val styleId: String,
    val generationType: String
)

data class GenerateResponse(
    val id: String,
    val status: String,
    val progress: Int,
    val estimatedTime: Int
)

data class PopularCreation(
    val id: Int,
    val emoji: String,
    val title: String,
    val likes: Int,
    val creator: String
)

data class MarketplaceItem(
    val id: Int,
    val emoji: String,
    val title: String,
    val price: Int,
    val rating: Double,
    val downloads: Int
)
