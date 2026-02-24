package com.creativeai.adapter.input.web

import com.creativeai.application.service.AvatarService
import com.creativeai.common.response.ApiResponse
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 아바타 컨트롤러 REST API 엔드포인트 제공 */
@RestController
@RequestMapping("/api/avatar")
@CrossOrigin(origins = ["http://localhost:3000"])
class AvatarController(private val avatarService: AvatarService) {

        /** 아바타 생성 요청 API POST /api/avatar/generate */
        @PostMapping("/generate")
        fun generateAvatar(
                @RequestBody request: AvatarGenerationRequest
        ): Mono<ApiResponse<AvatarGenerationResult>> {
                if (request.imageData.isNullOrBlank()) {
                        return Mono.just(ApiResponse(false, null, "이미지 데이터가 없습니다."))
                }

                return avatarService
                        .generateAvatar(imageData = request.imageData, styleId = request.styleId)
                        .map { avatar ->
                                ApiResponse(
                                        success = true,
                                        data =
                                                AvatarGenerationResult(
                                                        id = avatar.id,
                                                        status = avatar.status.name.lowercase(),
                                                        progress =
                                                                if (avatar.isCompleted()) 100
                                                                else 0,
                                                        estimatedTime = 5,
                                                        resultImageUrl = avatar.generatedImage,
                                                        files =
                                                                if (avatar.generatedImage != null)
                                                                        listOf(
                                                                                GeneratedFileDto(
                                                                                        file_url =
                                                                                                avatar.generatedImage!!,
                                                                                        is_primary =
                                                                                                true
                                                                                )
                                                                        )
                                                                else emptyList()
                                                ),
                                        message = "아바타 생성 요청이 성공적으로 접수되었습니다."
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

        /** 스타일 목록 조회 API GET /api/avatar/styles */
        @GetMapping("/styles")
        fun getStyles(): Mono<ApiResponse<List<AvatarStyleDto>>> {
                val styles =
                        com.creativeai.domain.avatar.AvatarStyle.allStyles().map {
                                AvatarStyleDto(it.id, it.name, it.description)
                        }
                return Mono.just(
                        ApiResponse(success = true, data = styles, message = "스타일 목록 조회 성공")
                )
        }

        /** 생성 상태 조회 API GET /api/avatar/generation/{id} */
        @GetMapping("/generation/{id}")
        fun getGenerationStatus(
                @PathVariable id: String
        ): Mono<ApiResponse<AvatarGenerationResult>> {
                return avatarService
                        .getAvatarById(id)
                        .map { avatar ->
                                ApiResponse(
                                        success = true,
                                        data =
                                                AvatarGenerationResult(
                                                        id = avatar.id,
                                                        status = avatar.status.name.lowercase(),
                                                        progress =
                                                                if (avatar.isCompleted()) 100
                                                                else if (avatar.isFailed()) 0
                                                                else 50,
                                                        estimatedTime = 0,
                                                        resultImageUrl = avatar.generatedImage,
                                                        files =
                                                                if (avatar.generatedImage != null)
                                                                        listOf(
                                                                                GeneratedFileDto(
                                                                                        file_url =
                                                                                                avatar.generatedImage!!,
                                                                                        is_primary =
                                                                                                true
                                                                                )
                                                                        )
                                                                else emptyList()
                                                ),
                                        message = "조회 성공"
                                )
                        }
                        .defaultIfEmpty(ApiResponse(false, null, "존재하지 않는 ID입니다."))
        }
}

// DTOs
data class AvatarGenerationRequest(val imageData: String?, val styleId: String)

data class AvatarGenerationResult(
        val id: String,
        val status: String,
        val progress: Int,
        val estimatedTime: Int,
        val resultImageUrl: String? = null,
        val files: List<GeneratedFileDto> = emptyList()
)

data class AvatarStyleDto(val id: String, val name: String, val description: String)
