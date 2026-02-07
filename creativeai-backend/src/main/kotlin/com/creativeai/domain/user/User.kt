package com.creativeai.domain.user

import java.time.LocalDateTime

/**
 * ============================================ DDD: User Aggregate Root (사용자 도메인)
 * ============================================
 *
 * 비즈니스 규칙:
 * - 사용자는 이메일 또는 OAuth를 통해 가입할 수 있음
 * - 이메일은 고유해야 함
 * - OAuth 사용자는 비밀번호가 없을 수 있음
 */
data class User(
        val id: Long? = null, // 고유 ID (자동 생성)
        val email: String, // 이메일 (로그인 ID)
        val passwordHash: String? = null, // 비밀번호 해시 (OAuth 사용자는 null)
        val username: String, // 표시 이름
        val avatarUrl: String? = null, // 프로필 이미지 URL
        val totalCredits: Int = 100, // 보유 크레딧
        val emailVerified: Boolean = false, // 이메일 인증 여부
        val status: UserStatus = UserStatus.ACTIVE, // 계정 상태
        val authProvider: AuthProvider = AuthProvider.LOCAL, // 인증 제공자
        val createdAt: LocalDateTime = LocalDateTime.now(), // 가입 일시
        val updatedAt: LocalDateTime = LocalDateTime.now(), // 수정 일시
        val lastLogin: LocalDateTime? = null // 마지막 로그인 일시
) {
    companion object {
        /** 이메일/비밀번호로 새 사용자 생성 (일반 회원가입) */
        fun createWithEmail(email: String, encodedPassword: String, username: String): User {
            require(email.isNotBlank()) { "이메일은 필수입니다" }
            require(encodedPassword.isNotBlank()) { "비밀번호는 필수입니다" }
            require(username.isNotBlank()) { "사용자명은 필수입니다" }

            return User(
                    email = email.lowercase().trim(),
                    passwordHash = encodedPassword,
                    username = username.trim(),
                    authProvider = AuthProvider.LOCAL
            )
        }

        /** OAuth로 새 사용자 생성 (소셜 로그인) */
        fun createWithOAuth(
                email: String,
                username: String,
                avatarUrl: String?,
                provider: AuthProvider
        ): User {
            require(email.isNotBlank()) { "이메일은 필수입니다" }
            require(provider != AuthProvider.LOCAL) { "OAuth 제공자가 필요합니다" }

            return User(
                    email = email.lowercase().trim(),
                    username = username.trim(),
                    avatarUrl = avatarUrl,
                    emailVerified = true, // OAuth는 이메일 검증됨
                    authProvider = provider
            )
        }
    }

    /** 마지막 로그인 시간 갱신 */
    fun recordLogin(): User {
        return copy(lastLogin = LocalDateTime.now(), updatedAt = LocalDateTime.now())
    }

    /** 크레딧 차감 */
    fun useCredits(amount: Int): User {
        require(amount > 0) { "차감할 크레딧은 0보다 커야 합니다" }
        require(totalCredits >= amount) { "크레딧이 부족합니다" }

        return copy(totalCredits = totalCredits - amount, updatedAt = LocalDateTime.now())
    }

    /** 크레딧 충전 */
    fun addCredits(amount: Int): User {
        require(amount > 0) { "충전할 크레딧은 0보다 커야 합니다" }

        return copy(totalCredits = totalCredits + amount, updatedAt = LocalDateTime.now())
    }

    /** 프로필 업데이트 */
    fun updateProfile(newUsername: String?, newAvatarUrl: String?): User {
        return copy(
                username = newUsername?.trim() ?: username,
                avatarUrl = newAvatarUrl ?: avatarUrl,
                updatedAt = LocalDateTime.now()
        )
    }

    /** OAuth 사용자인지 확인 */
    fun isOAuthUser(): Boolean = authProvider != AuthProvider.LOCAL

    /** 활성 상태인지 확인 */
    fun isActive(): Boolean = status == UserStatus.ACTIVE
}

/**
 * ============================================ Value Object: 사용자 상태
 * ============================================
 */
enum class UserStatus {
    ACTIVE, // 활성 상태 (정상 사용 가능)
    INACTIVE, // 비활성 상태 (휴면 계정)
    SUSPENDED // 정지 상태 (관리자에 의해 정지됨)
}

/**
 * ============================================ Value Object: 인증 제공자
 * ============================================
 */
enum class AuthProvider {
    LOCAL, // 이메일/비밀번호 (자체 인증)
    GOOGLE, // Google OAuth
    APPLE, // Apple OAuth (향후 지원)
    KAKAO // Kakao OAuth (향후 지원)
}
