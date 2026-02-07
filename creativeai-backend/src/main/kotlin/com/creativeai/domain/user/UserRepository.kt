package com.creativeai.domain.user

import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * ============================================ DDD: User Repository Interface (사용자 저장소)
 * ============================================
 *
 * 도메인 계층의 Repository 인터페이스 실제 구현은 adapter/output/persistence에서 담당
 */
interface UserRepository {

    /** 사용자 저장 (생성 또는 수정) */
    fun save(user: User): Mono<User>

    /** ID로 사용자 조회 */
    fun findById(id: Long): Mono<User>

    /** 이메일로 사용자 조회 */
    fun findByEmail(email: String): Mono<User>

    /** 이메일 존재 여부 확인 */
    fun existsByEmail(email: String): Mono<Boolean>

    /** 모든 사용자 조회 */
    fun findAll(): Flux<User>

    /** 사용자 삭제 */
    fun deleteById(id: Long): Mono<Void>
}

/**
 * ============================================ DDD: RefreshToken Repository Interface
 * ============================================
 */
interface RefreshTokenRepository {

    /** 토큰 저장 */
    fun save(token: RefreshToken): Mono<RefreshToken>

    /** 토큰 해시로 조회 */
    fun findByTokenHash(tokenHash: String): Mono<RefreshToken>

    /** 사용자의 모든 토큰 조회 */
    fun findAllByUserId(userId: Long): Flux<RefreshToken>

    /** 사용자의 모든 토큰 삭제 (전체 로그아웃) */
    fun deleteAllByUserId(userId: Long): Mono<Void>

    /** 특정 토큰 삭제 */
    fun deleteByTokenHash(tokenHash: String): Mono<Void>

    /** 만료된 토큰 삭제 (정리용) */
    fun deleteExpired(): Mono<Long>
}

/**
 * ============================================ DDD: UserOAuthAccount Repository Interface
 * ============================================
 */
interface UserOAuthAccountRepository {

    /** OAuth 계정 저장 */
    fun save(account: UserOAuthAccount): Mono<UserOAuthAccount>

    /** OAuth 제공자와 제공자 사용자 ID로 조회 */
    fun findByProviderAndProviderUserId(
            provider: AuthProvider,
            providerUserId: String
    ): Mono<UserOAuthAccount>

    /** 사용자의 모든 OAuth 계정 조회 */
    fun findAllByUserId(userId: Long): Flux<UserOAuthAccount>

    /** 사용자의 특정 OAuth 계정 삭제 */
    fun deleteByUserIdAndProvider(userId: Long, provider: AuthProvider): Mono<Void>
}
