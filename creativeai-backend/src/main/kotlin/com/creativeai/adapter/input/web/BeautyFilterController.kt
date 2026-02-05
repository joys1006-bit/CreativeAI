package com.creativeai.adapter.input.web

import com.creativeai.application.service.BeautyFilterService
import com.creativeai.common.response.ApiResponse
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 뷰티 필터 컨트롤러 */
@RestController
@RequestMapping("/api/beauty-filter")
@CrossOrigin(origins = ["http://localhost:3000"])
class BeautyFilterController(private val beautyFilterService: BeautyFilterService) {

    @PostMapping("/apply")
    fun applyFilter(
            @RequestBody request: BeautyFilterRequest
    ): Mono<ApiResponse<BeautyFilterResult>> {
        return beautyFilterService
                .applyBeautyFilter(request.imageData, request.filterType, request.intensity)
                .map { creation ->
                    ApiResponse(
                            success = true,
                            data =
                                    BeautyFilterResult(
                                            id = creation.id ?: 0L,
                                            status = creation.status,
                                            resultImageUrl =
                                                    "https://via.placeholder.com/300?text=Beauty+Filter+Result"
                                    ),
                            message = "뷰티 필터 적용 완료"
                    )
                }
                .onErrorResume { error ->
                    Mono.just(
                            ApiResponse(
                                    success = false,
                                    data = null,
                                    message = "필터 적용 중 오류 발생: ${error.message}"
                            )
                    )
                }
    }
}

// DTOs
data class BeautyFilterRequest(
        val imageData: String,
        val filterType: String, // smooth, brighten, slim
        val intensity: Int // 0-100
)

data class BeautyFilterResult(val id: Long, val status: String, val resultImageUrl: String)
