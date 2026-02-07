package com.creativeai.adapter.input.web

import com.creativeai.application.service.PhotoEditorService
import com.creativeai.common.response.ApiResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 사진 편집 컨트롤러 */
@RestController
@RequestMapping("/api/photo-editor")
@CrossOrigin(origins = ["http://localhost:3000"])
class PhotoEditorController {
        @Autowired lateinit var photoEditorService: PhotoEditorService

        @PostMapping("/edit")
        fun editPhoto(@RequestBody request: PhotoEditRequest): Mono<ApiResponse<PhotoEditResult>> {
                return photoEditorService
                        .editPhoto(
                                request.imageData,
                                request.operation,
                                request.params ?: emptyMap()
                        )
                        .map { creation ->
                                ApiResponse(
                                        success = true,
                                        data =
                                                PhotoEditResult(
                                                        id = creation.id ?: 0L,
                                                        status = creation.status,
                                                        resultImageUrl =
                                                                "https://via.placeholder.com/300?text=Edited+Photo" // 임시 결과 이미지
                                                ),
                                        message = "사진 편집 완료"
                                )
                        }
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = "편집 중 오류 발생: ${error.message}"
                                        )
                                )
                        }
        }
}

// DTOs
data class PhotoEditRequest(
        val imageData: String,
        val operation: String, // crop, filter, adjust
        val params: Map<String, Any>?
)

data class PhotoEditResult(val id: Long, val status: String, val resultImageUrl: String)
