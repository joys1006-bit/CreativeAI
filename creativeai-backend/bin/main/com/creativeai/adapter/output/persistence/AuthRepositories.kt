package com.creativeai.adapter.output.persistence

import java.time.LocalDateTime
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * ============================================ R2DBC Repository: User 테이블 접근
 * ============================================
 */
@Repository
interface UserR2dbcRepository : ReactiveCrudRepository<UserEntity, Long> {

    /** 이메일로 사용자 조회 */
    fun findByEmail(email: String): Mono<UserEntity>

    /** 이메일 존재 여부 확인 */
    fun existsByEmail(email: String): Mono<Boolean>

    /** 상태별 사용자 조회 */
    fun findByStatus(status: String): Flux<UserEntity>
}

/**
 * ============================================ R2DBC Repository: OAuth 계정 테이블 접근
 * ============================================
 */
@Repository
interface UserOAuthAccountR2dbcRepository : ReactiveCrudRepository<UserOAuthAccountEntity, Long> {

    /** OAuth 제공자와 제공자 사용자 ID로 조회 (사용자가 이미 연동했는지 확인용) */
    fun findByProviderAndProviderUserId(
            provider: String,
            providerUserId: String
    ): Mono<UserOAuthAccountEntity>

    /** 사용자의 모든 OAuth 계정 조회 */
    fun findAllByUserId(userId: Long): Flux<UserOAuthAccountEntity>

    /** 사용자의 특정 OAuth 연동 삭제 */
    fun deleteByUserIdAndProvider(userId: Long, provider: String): Mono<Void>
}

/**
 * ============================================ R2DBC Repository: Refresh Token 테이블 접근
 * ============================================
 */
@Repository
interface RefreshTokenR2dbcRepository : ReactiveCrudRepository<RefreshTokenEntity, Long> {

    /** 토큰 해시로 조회 */
    fun findByTokenHash(tokenHash: String): Mono<RefreshTokenEntity>

    /** 사용자의 모든 토큰 조회 */
    fun findAllByUserId(userId: Long): Flux<RefreshTokenEntity>

    /** 사용자의 모든 토큰 삭제 (전체 로그아웃) */
    fun deleteAllByUserId(userId: Long): Mono<Void>

    /** 특정 토큰 삭제 */
    fun deleteByTokenHash(tokenHash: String): Mono<Void>

    /** 만료되었거나 무효화된 토큰 삭제 */
    @Query("DELETE FROM refresh_tokens WHERE expires_at < :now OR is_revoked = true")
    fun deleteExpiredTokens(now: LocalDateTime = LocalDateTime.now()): Mono<Long>
}
