package com.creativeai.domain.user

import java.time.LocalDateTime

/**
 * ============================================ DDD: RefreshToken Entity (리프레시 토큰)
 * ============================================
 *
 * 용도:
 * - JWT Access Token 갱신에 사용
 * - 다중 기기 로그인 지원
 * - 로그아웃 시 토큰 무효화
 */
data class RefreshToken(
        val id: Long? = null, // 고유 ID
        val userId: Long, // 토큰 소유자 ID
        val tokenHash: String, // 토큰 해시값 (SHA-256)
        val deviceInfo: String? = null, // 기기 정보 (User-Agent)
        val ipAddress: String? = null, // 접속 IP
        val expiresAt: LocalDateTime, // 만료 일시
        val isRevoked: Boolean = false, // 무효화 여부
        val createdAt: LocalDateTime = LocalDateTime.now() // 발급 일시
) {
    companion object {
        // 리프레시 토큰 유효 기간: 7일
        private const val REFRESH_TOKEN_VALIDITY_DAYS = 7L

        /** 새 리프레시 토큰 생성 */
        fun create(
                userId: Long,
                tokenHash: String,
                deviceInfo: String? = null,
                ipAddress: String? = null
        ): RefreshToken {
            return RefreshToken(
                    userId = userId,
                    tokenHash = tokenHash,
                    deviceInfo = deviceInfo,
                    ipAddress = ipAddress,
                    expiresAt = LocalDateTime.now().plusDays(REFRESH_TOKEN_VALIDITY_DAYS)
            )
        }
    }

    /** 토큰 무효화 (로그아웃) */
    fun revoke(): RefreshToken {
        return copy(isRevoked = true)
    }

    /** 토큰이 유효한지 확인 */
    fun isValid(): Boolean {
        return !isRevoked && expiresAt.isAfter(LocalDateTime.now())
    }

    /** 토큰이 만료되었는지 확인 */
    fun isExpired(): Boolean {
        return expiresAt.isBefore(LocalDateTime.now())
    }
}
