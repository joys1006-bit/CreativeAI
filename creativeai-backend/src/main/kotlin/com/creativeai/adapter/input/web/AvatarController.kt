package com.creativeai.adapter.input.web

import com.creativeai.application.port.input.*
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * 아바타 컨트롤러
 */
@RestController
@RequestMapping("/api/avatar")
@CrossOrigin(origins = ["http://localhost:3000"])
class AvatarController(
    private val generateAvatarUseCase: GenerateAvatarUseCase,
    private val getAvatarStylesUseCase: GetAvatarStylesUseCase
) {
    
    @PostMapping("/generate")
    fun generateAvatar(
        @RequestBody request: AvatarGenerationRequest
    ): Mono<ApiResponse<AvatarGenerationResult>> {
        val command = GenerateAvatarCommand(
            imageData = request.imageData ?: "",
            styleId = request.styleId
        )
        
        return generateAvatarUseCase.execute(command)
            .map { result ->
                ApiResponse(
                    success = true,
                    data = result,
                    message = "아바타 생성 요청 성공"
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
    fun getStyles(): Mono<ApiResponse<List<AvatarStyleDto>>> {
        return getAvatarStylesUseCase.execute()
            .map { styles ->
                ApiResponse(
                    success = true,
                    data = styles,
                    message = "스타일 목록 조회 성공"
                )
            }
    }
    
    @GetMapping("/generation/{id}")
    fun getGenerationStatus(@PathVariable id: String): Mono<ApiResponse<AvatarGenerationResult>> {
        return Mono.just(
            ApiResponse(
                success = true,
                data = AvatarGenerationResult(
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

data class AvatarGenerationRequest(
    val imageData: String?,
    val styleId: String
)
