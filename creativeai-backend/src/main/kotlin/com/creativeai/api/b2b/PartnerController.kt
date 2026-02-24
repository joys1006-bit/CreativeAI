package com.creativeai.api.b2b

import com.creativeai.common.response.ApiResponse
import com.creativeai.domain.b2b.PartnerStatus
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/** 🏢 B2B 파트너 전용 API 컨트롤러 (Pivot: CreativeAI engine as a Service) */
@RestController
@RequestMapping("/api/b2b/partners")
class PartnerController {

    @PostMapping("/register")
    fun registerPartner(
            @RequestBody request: PartnerRegistrationRequest
    ): Mono<ApiResponse<PartnerResponse>> {
        // 비즈니스 로칙: 신규 파트너 등록 및 API 키 발급
        return Mono.just(
                ApiResponse(
                        success = true,
                        data =
                                PartnerResponse(
                                        partnerId = 1001L,
                                        apiKey = "sk_prod_live_4f8a2e1c...",
                                        status = PartnerStatus.ACTIVE
                                ),
                        message = "B2B 파트너 등록 및 API 키 발급이 완료되었습니다."
                )
        )
    }
}

data class PartnerRegistrationRequest(
        val companyName: String,
        val businessId: String,
        val adminEmail: String
)

data class PartnerResponse(val partnerId: Long, val apiKey: String, val status: PartnerStatus)
