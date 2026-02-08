package com.creativeai.adapter.input.web

import com.creativeai.adapter.output.persistence.CreationFileR2dbcRepository
import com.creativeai.application.service.PhotoEditorService
import com.creativeai.common.response.ApiResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 사진 편집 컨트롤러 */
@RestController
@RequestMapping("/api/photo-editor")
class PhotoEditorController {
        @Autowired lateinit var photoEditorService: PhotoEditorService
        @Autowired lateinit var creationFileRepository: CreationFileR2dbcRepository

        @PostMapping("/edit")
        fun editPhoto(@RequestBody request: PhotoEditRequest): Mono<ApiResponse<PhotoEditResult>> {
                return photoEditorService
                        .editPhoto(
                                request.imageData,
                                request.operation,
                                request.params ?: emptyMap()
                        )
                        .flatMap { creation ->
                                creationFileRepository
                                        .findByCreationId(creation.id!!)
                                        .filter { it.fileType == "result_image" }
                                        .next()
                                        .map { file ->
                                                ApiResponse(
                                                        success = true,
                                                        data =
                                                                PhotoEditResult(
                                                                        id = creation.id!!,
                                                                        status = creation.status,
                                                                        resultImageUrl =
                                                                                file.fileUrl
                                                                ),
                                                        message = "사진 편집 완료"
                                                )
                                        }
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
        val imageData: String? = null,
        val operation: String? = null,
        val params: Map<String, Any>? = null
)

data class PhotoEditResult(val id: Long, val status: String, val resultImageUrl: String)
