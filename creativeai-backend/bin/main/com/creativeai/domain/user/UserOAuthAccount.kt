package com.creativeai.domain.user

import java.time.LocalDateTime

/**
 * ============================================ DDD: UserOAuthAccount Entity (OAuth 계정 정보)
 * ============================================
 *
 * 용도:
 * - 사용자와 연결된 OAuth 계정 정보 저장
 * - 한 사용자가 여러 OAuth 제공자 연동 가능
 * - OAuth 응답 원본 데이터 백업
 */
data class UserOAuthAccount(
        val id: Long? = null, // 고유 ID
        val userId: Long, // 연결된 사용자 ID
        val provider: AuthProvider, // OAuth 제공자 (GOOGLE, APPLE 등)
        val providerUserId: String, // OAuth 제공자측 사용자 ID
        val email: String? = null, // OAuth에서 받은 이메일
        val name: String? = null, // OAuth에서 받은 이름
        val avatarUrl: String? = null, // OAuth에서 받은 프로필 이미지
        val rawData: String? = null, // OAuth 응답 원본 (JSON)
        val createdAt: LocalDateTime = LocalDateTime.now(), // 연동 일시
        val updatedAt: LocalDateTime = LocalDateTime.now() // 갱신 일시
) {
    companion object {
        /** 새 OAuth 계정 연동 생성 */
        fun create(
                userId: Long,
                provider: AuthProvider,
                providerUserId: String,
                email: String? = null,
                name: String? = null,
                avatarUrl: String? = null,
                rawData: String? = null
        ): UserOAuthAccount {
            require(provider != AuthProvider.LOCAL) { "OAuth 계정은 LOCAL 제공자를 사용할 수 없습니다" }
            require(providerUserId.isNotBlank()) { "OAuth 제공자 사용자 ID는 필수입니다" }

            return UserOAuthAccount(
                    userId = userId,
                    provider = provider,
                    providerUserId = providerUserId,
                    email = email,
                    name = name,
                    avatarUrl = avatarUrl,
                    rawData = rawData
            )
        }
    }

    /** OAuth 프로필 정보 갱신 */
    fun updateProfile(
            newName: String?,
            newAvatarUrl: String?,
            newRawData: String?
    ): UserOAuthAccount {
        return copy(
                name = newName ?: name,
                avatarUrl = newAvatarUrl ?: avatarUrl,
                rawData = newRawData ?: rawData,
                updatedAt = LocalDateTime.now()
        )
    }
}
