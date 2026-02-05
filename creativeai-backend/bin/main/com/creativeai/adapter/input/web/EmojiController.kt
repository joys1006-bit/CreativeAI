package com.creativeai.adapter.input.web

import com.creativeai.application.service.EmojiService
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 어댑터: REST API Controller (WebFlux) */
@RestController
@RequestMapping("/api/emoji")
@CrossOrigin(origins = ["http://localhost:3000"])
class EmojiController(private val emojiService: EmojiService) {

    /** 이모티콘 생성 요청 API POST /api/emoji/generate */
    @PostMapping("/generate")
    fun generateEmoji(
            @RequestBody request: EmojiGenerationRequest
    ): Mono<ApiResponse<EmojiGenerationResult>> {
        // 입력값 검증 (간단 예시)
        if (request.imageData.isNullOrBlank()) {
            return Mono.just(ApiResponse(false, null, "이미지 데이터가 없습니다."))
        }

        return emojiService
                .generateEmoji(imageData = request.imageData, styleId = request.styleId)
                .map { emoji ->
                    ApiResponse(
                            success = true,
                            data =
                                    EmojiGenerationResult(
                                            id = emoji.id,
                                            status = emoji.status.name.lowercase(),
                                            progress = if (emoji.isCompleted()) 100 else 0,
                                            estimatedTime = 3 // 예상 시간 (초)
                                    ),
                            message = "이모티콘 생성 요청이 성공적으로 접수되었습니다."
                    )
                }
                .onErrorResume { error ->
                    Mono.just(
                            ApiResponse(
                                    success = false,
                                    data = null,
                                    message = "생성 중 오류 발생: ${error.message}"
                            )
                    )
                }
    }

    /** 생성 상태 조회 API GET /api/emoji/generation/{id} */
    @GetMapping("/generation/{id}")
    fun getGenerationStatus(@PathVariable id: String): Mono<ApiResponse<EmojiGenerationResult>> {
        return emojiService
                .getEmojiById(id)
                .map { emoji ->
                    ApiResponse(
                            success = true,
                            data =
                                    EmojiGenerationResult(
                                            id = emoji.id,
                                            status = emoji.status.name.lowercase(),
                                            progress =
                                                    if (emoji.isCompleted()) 100
                                                    else if (emoji.isFailed()) 0 else 50,
                                            estimatedTime = 0,
                                            resultImageUrl = emoji.generatedImage
                                    ),
                            message = "조회 성공"
                    )
                }
                .defaultIfEmpty(ApiResponse(false, null, "존재하지 않는 ID입니다."))
    }

    /** 스타일 목록 조회 API GET /api/emoji/styles */
    @GetMapping("/styles")
    fun getStyles(): Mono<ApiResponse<List<EmojiStyleDto>>> {
        val styles =
                com.creativeai.domain.emoji.EmojiStyle.allStyles().map {
                    EmojiStyleDto(it.id, it.name, it.description)
                }
        return Mono.just(ApiResponse(success = true, data = styles, message = "스타일 목록 조회 성공"))
    }
}

// DTO
data class EmojiGenerationRequest(
        val imageData: String?,
        val prompt: String?,
        val styleId: String,
        val generationType: String
)

data class EmojiGenerationResult(
        val id: String,
        val status: String,
        val progress: Int,
        val estimatedTime: Int,
        val resultImageUrl: String? = null
)

data class EmojiStyleDto(val id: String, val name: String, val description: String)

data class ApiResponse<T>(val success: Boolean, val data: T?, val message: String?)
