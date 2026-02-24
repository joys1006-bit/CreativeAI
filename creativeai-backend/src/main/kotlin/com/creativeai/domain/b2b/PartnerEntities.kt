package com.creativeai.domain.b2b

import java.time.LocalDateTime
import java.util.UUID

/** 🏢 B2B 파트너 엔티티 크리에이티브 AI 엔진을 API로 사용하는 외부 기업 고객 */
data class Partner(
        val id: Long? = null,
        val userId: Long, // 관리자 계정 ID
        val companyName: String,
        val businessRegistrationNumber: String,
        val status: PartnerStatus,
        val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class PartnerStatus {
    PENDING,
    ACTIVE,
    SUSPENDED
}

/** 🔑 API 키 관리 엔티티 */
data class ApiKey(
        val id: Long? = null,
        val partnerId: Long,
        val keyString: String = "sk_" + UUID.randomUUID().toString().replace("-", ""),
        val name: String, // 키 이름 (예: Production, Staging)
        val isActive: Boolean = true,
        val expiresAt: LocalDateTime? = null,
        val createdAt: LocalDateTime = LocalDateTime.now()
)
