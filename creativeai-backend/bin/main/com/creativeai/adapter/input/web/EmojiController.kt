package com.creativeai.adapter.input.web

import com.creativeai.application.port.input.*
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * 어댑터: REST API Controller (WebFlux)
 * 
 * 인바운드 어댑터 - HTTP 요청을 유스케이스로 변환
 */
@RestController
@RequestMapping("/api/emoji")
@CrossOrigin(origins = ["http://localhost:3000"])
class EmojiController(
    private val generateEmojiUseCase: GenerateEmojiUseCase,
    private val getEmojiStylesUseCase: GetEmojiStylesUseCase
) {
    
    @PostMapping("/generate")
    fun generateEmoji(
        @RequestBody request: EmojiGenerationRequest
    ): Mono<ApiResponse<EmojiGenerationResult>> {
        val command = GenerateEmojiCommand(
            imageData = request.imageData ?: "",
            styleId = request.styleId,
            generationType = request.generationType
        )
        
        return generateEmojiUseCase.execute(command)
            .map { result ->
                ApiResponse(
                    success = true,
                    data = result,
                    message = "이모티콘 생성 요청 성공"
                )
            }
            .onErrorResume { error ->
                Mono.just(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = "생성 실패: ${error.message}"
                    )
                )
            }
    }
    
    @GetMapping("/styles")
    fun getStyles(): Mono<ApiResponse<List<EmojiStyleDto>>> {
        return getEmojiStylesUseCase.execute()
            .map { styles ->
                ApiResponse(
                    success = true,
                    data = styles,
                    message = "스타일 목록 조회 성공"
                )
            }
    }
    
    @GetMapping("/generation/{id}")
    fun getGenerationStatus(@PathVariable id: String): Mono<ApiResponse<EmojiGenerationResult>> {
        // 간단한 목업 응답
        return Mono.just(
            ApiResponse(
                success = true,
                data = EmojiGenerationResult(
                    id = id,
                    status = "completed",
                    progress = 100,
                    estimatedTime = 0
                ),
                message = "생성 상태 조회 성공"
            )
        )
    }
}

// DTO
data class EmojiGenerationRequest(
    val imageData: String?,
    val prompt: String?,
    val styleId: String,
    val generationType: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?
)
