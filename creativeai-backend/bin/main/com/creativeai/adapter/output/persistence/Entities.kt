package com.creativeai.adapter.output.persistence

import java.time.LocalDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

/** R2DBC Entity: styles 테이블 */
@Table("styles")
data class StyleEntity(
        @Id val id: Long? = null,
        val name: String,
        val category: String,
        val description: String? = null,
        val emoji: String? = null,
        @Column("configuration") val configuration: String? = null, // JSON
        @Column("is_active") val isActive: Boolean = true,
        @Column("sort_order") val sortOrder: Int = 0,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

/**
 * ============================================ R2DBC Entity: users 테이블
 * ============================================ 사용자 정보 저장 (일반 가입 + OAuth 가입)
 */
@Table("users")
data class UserEntity(
        @Id val id: Long? = null,
        val username: String, // 표시 이름
        val email: String, // 이메일 (로그인 ID)
        @Column("password_hash") val passwordHash: String? = null, // 비밀번호 (OAuth는 null)
        @Column("avatar_url") val avatarUrl: String? = null, // 프로필 이미지
        @Column("total_credits") val totalCredits: Int = 100, // 보유 크레딧
        @Column("email_verified") val emailVerified: Boolean = false, // 이메일 인증 여부
        val status: String = "active", // 계정 상태
        @Column("auth_provider") val authProvider: String = "local", // 인증 제공자
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
        @Column("updated_at") val updatedAt: LocalDateTime = LocalDateTime.now(),
        @Column("last_login") val lastLogin: LocalDateTime? = null // 마지막 로그인
)

/**
 * ============================================ R2DBC Entity: user_oauth_accounts 테이블
 * ============================================ OAuth 소셜 로그인 계정 정보
 */
@Table("user_oauth_accounts")
data class UserOAuthAccountEntity(
        @Id val id: Long? = null,
        @Column("user_id") val userId: Long, // 연결된 사용자 ID
        val provider: String, // OAuth 제공자 (google, apple 등)
        @Column("provider_user_id") val providerUserId: String, // OAuth측 사용자 ID
        val email: String? = null, // OAuth에서 받은 이메일
        val name: String? = null, // OAuth에서 받은 이름
        @Column("avatar_url") val avatarUrl: String? = null, // OAuth에서 받은 프로필 이미지
        @Column("raw_data") val rawData: String? = null, // OAuth 응답 원본 (JSON)
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
        @Column("updated_at") val updatedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * ============================================ R2DBC Entity: refresh_tokens 테이블
 * ============================================ JWT Refresh Token 저장소
 */
@Table("refresh_tokens")
data class RefreshTokenEntity(
        @Id val id: Long? = null,
        @Column("user_id") val userId: Long, // 토큰 소유자 ID
        @Column("token_hash") val tokenHash: String, // 토큰 해시 (SHA-256)
        @Column("device_info") val deviceInfo: String? = null, // 기기 정보
        @Column("ip_address") val ipAddress: String? = null, // 접속 IP
        @Column("expires_at") val expiresAt: LocalDateTime, // 만료 일시
        @Column("is_revoked") val isRevoked: Boolean = false, // 무효화 여부
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

// CreationEntity and CreationFileEntity

/** R2DBC Entity: creations 테이블 */
@Table("creations")
data class CreationEntity(
        @Id val id: Long? = null,
        @Column("user_id") val userId: Long,
        @Column("creation_type") val creationType: String, // emoji, avatar, filter
        @Column("style_id") val styleId: Long? = null,
        val title: String? = null,
        val description: String? = null,
        val prompt: String? = null,
        val status: String, // pending, processing, completed, failed
        val progress: Int = 0,
        @Column("credit_cost") val creditCost: Int = 0,

        // Marketplace Fields
        val price: java.math.BigDecimal? = null,
        @Column("is_for_sale") val isForSale: Boolean = false,
        @Column("like_count") val likeCount: Int = 0,
        val metadata: String? = null, // JSON 문자열
        @Column("processing_started_at") val processingStartedAt: LocalDateTime? = null,
        @Column("processing_completed_at") val processingCompletedAt: LocalDateTime? = null,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
        @Column("updated_at") val updatedAt: LocalDateTime = LocalDateTime.now(),
        @Column("completed_at") val completedAt: LocalDateTime? = null,
        @Column("error_message") val errorMessage: String? = null,
        @Column("input_data") val inputData: String? = null
)

/** R2DBC Entity: creation_files 테이블 */
@Table("creation_files")
data class CreationFileEntity(
        @Id val id: Long? = null,
        @Column("creation_id") val creationId: Long,
        @Column("file_type")
        val fileType: String, // original_image, result_image, thumbnail, intermediate
        @Column("variation_index") val variationIndex: Int? = null,
        @Column("file_path") val filePath: String,
        @Column("file_url") val fileUrl: String,
        @Column("thumbnail_url") val thumbnailUrl: String? = null,
        @Column("file_size") val fileSize: Long? = null,
        @Column("mime_type") val mimeType: String? = null,
        val width: Int? = null,
        val height: Int? = null,
        @Column("is_primary") val isPrimary: Boolean = false,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)
