package com.creativeai.application.service

import com.creativeai.adapter.output.persistence.*
import com.creativeai.domain.user.*
import java.time.LocalDateTime
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

/**
 * ============================================ 인증 서비스 (AuthService)
 * ============================================
 *
 * 역할:
 * - 회원가입 처리 (이메일/비밀번호)
 * - 로그인 처리 및 토큰 발급
 * - 로그아웃 처리 (토큰 무효화)
 * - 토큰 갱신
 * - OAuth 로그인 처리
 */
@Service
class AuthService {

        @Autowired lateinit var userRepository: UserR2dbcRepository
        @Autowired lateinit var refreshTokenRepository: RefreshTokenR2dbcRepository
        @Autowired lateinit var oauthAccountRepository: UserOAuthAccountR2dbcRepository
        @Autowired lateinit var jwtService: JwtService
        @Autowired lateinit var passwordEncoder: PasswordEncoder

        /**
         * 회원가입 (이메일/비밀번호)
         *
         * @param email 이메일
         * @param password 비밀번호 (평문)
         * @param username 사용자 이름
         * @return 토큰 응답 (액세스 토큰 + 리프레시 토큰)
         */
        fun signup(email: String, password: String, username: String): Mono<AuthTokenResponse> {
                // 이메일 중복 확인
                return userRepository
                        .existsByEmail(email.lowercase())
                        .flatMap { exists ->
                                if (exists) {
                                        Mono.error(IllegalArgumentException("이미 사용 중인 이메일입니다."))
                                } else {
                                        // 비밀번호 암호화 및 사용자 생성
                                        val encodedPassword = passwordEncoder.encode(password)
                                        val newUser =
                                                UserEntity(
                                                        email = email.lowercase().trim(),
                                                        passwordHash = encodedPassword,
                                                        username = username.trim(),
                                                        authProvider = "local",
                                                        emailVerified = false
                                                )
                                        userRepository.save(newUser)
                                }
                        }
                        .flatMap { savedUser ->
                                // 토큰 생성
                                generateTokens(savedUser)
                        }
        }

        /**
         * 로그인 (이메일/비밀번호)
         *
         * @param email 이메일
         * @param password 비밀번호 (평문)
         * @param deviceInfo 기기 정보 (옵션)
         * @param ipAddress 접속 IP (옵션)
         * @return 토큰 응답
         */
        fun login(
                email: String,
                password: String,
                deviceInfo: String? = null,
                ipAddress: String? = null
        ): Mono<AuthTokenResponse> {
                return userRepository
                        .findByEmail(email.lowercase())
                        .switchIfEmpty(
                                Mono.error(IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."))
                        )
                        .flatMap { user ->
                                // 비밀번호 확인
                                if (user.passwordHash == null ||
                                                !passwordEncoder.matches(
                                                        password,
                                                        user.passwordHash
                                                )
                                ) {
                                        Mono.error(
                                                IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")
                                        )
                                } else if (user.status != "active") {
                                        Mono.error(IllegalArgumentException("비활성화된 계정입니다."))
                                } else {
                                        // 마지막 로그인 시간 갱신
                                        val updatedUser =
                                                user.copy(
                                                        lastLogin = LocalDateTime.now(),
                                                        updatedAt = LocalDateTime.now()
                                                )
                                        userRepository.save(updatedUser)
                                }
                        }
                        .flatMap { user ->
                                // 토큰 생성
                                generateTokens(user, deviceInfo, ipAddress)
                        }
        }

        /**
         * 로그아웃 (현재 토큰 무효화)
         *
         * @param refreshToken 리프레시 토큰
         */
        fun logout(refreshToken: String): Mono<Void> {
                val tokenHash = jwtService.hashToken(refreshToken)
                return refreshTokenRepository.deleteByTokenHash(tokenHash)
        }

        /**
         * 전체 로그아웃 (모든 기기에서 로그아웃)
         *
         * @param userId 사용자 ID
         */
        fun logoutAll(userId: Long): Mono<Void> {
                return refreshTokenRepository.deleteAllByUserId(userId)
        }

        /**
         * 토큰 갱신
         *
         * @param refreshToken 리프레시 토큰
         * @return 새로운 토큰 응답
         */
        fun refreshTokens(refreshToken: String): Mono<AuthTokenResponse> {
                // 1. 토큰 유효성 검증
                if (!jwtService.validateToken(refreshToken) ||
                                !jwtService.isRefreshToken(refreshToken)
                ) {
                        return Mono.error(IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."))
                }

                val tokenHash = jwtService.hashToken(refreshToken)

                // 2. DB에서 토큰 확인
                return refreshTokenRepository
                        .findByTokenHash(tokenHash)
                        .switchIfEmpty(Mono.error(IllegalArgumentException("리프레시 토큰을 찾을 수 없습니다.")))
                        .flatMap { storedToken ->
                                if (storedToken.isRevoked ||
                                                storedToken.expiresAt.isBefore(LocalDateTime.now())
                                ) {
                                        Mono.error(IllegalArgumentException("만료되었거나 무효화된 토큰입니다."))
                                } else {
                                        // 기존 토큰 삭제
                                        refreshTokenRepository
                                                .deleteByTokenHash(tokenHash)
                                                .then(Mono.just(storedToken.userId))
                                }
                        }
                        .flatMap { userId ->
                                // 사용자 조회
                                userRepository
                                        .findById(userId)
                                        .switchIfEmpty(
                                                Mono.error(
                                                        IllegalArgumentException("사용자를 찾을 수 없습니다.")
                                                )
                                        )
                        }
                        .flatMap { user ->
                                // 새 토큰 생성
                                generateTokens(user)
                        }
        }

        /**
         * OAuth 로그인/회원가입 처리
         *
         * @param provider OAuth 제공자 (google 등)
         * @param providerUserId OAuth 제공자측 사용자 ID
         * @param email 이메일
         * @param name 이름
         * @param avatarUrl 프로필 이미지 URL
         * @return 토큰 응답
         */
        fun handleOAuthLogin(
                provider: String,
                providerUserId: String,
                email: String,
                name: String,
                avatarUrl: String?
        ): Mono<AuthTokenResponse> {
                // 1. 기존 OAuth 계정 확인
                return oauthAccountRepository
                        .findByProviderAndProviderUserId(provider, providerUserId)
                        .flatMap { oauthAccount ->
                                // 기존 사용자 조회 및 토큰 발급
                                userRepository
                                        .findById(oauthAccount.userId)
                                        .flatMap { user ->
                                                val updatedUser =
                                                        user.copy(
                                                                lastLogin = LocalDateTime.now(),
                                                                updatedAt = LocalDateTime.now()
                                                        )
                                                userRepository.save(updatedUser)
                                        }
                                        .flatMap { user -> generateTokens(user) }
                        }
                        .switchIfEmpty(
                                // 2. 새 사용자 생성
                                userRepository
                                        .findByEmail(email.lowercase())
                                        .flatMap { existingUser ->
                                                // 이메일이 이미 존재하면 OAuth 계정 연동
                                                saveOAuthAccount(
                                                                existingUser.id!!,
                                                                provider,
                                                                providerUserId,
                                                                email,
                                                                name,
                                                                avatarUrl
                                                        )
                                                        .flatMap {
                                                                userRepository.findById(
                                                                        existingUser.id
                                                                )
                                                        }
                                                        .flatMap { user -> generateTokens(user!!) }
                                        }
                                        .switchIfEmpty(
                                                // 3. 완전히 새로운 사용자 생성
                                                Mono.defer {
                                                        val newUser =
                                                                UserEntity(
                                                                        email =
                                                                                email.lowercase()
                                                                                        .trim(),
                                                                        username = name.trim(),
                                                                        avatarUrl = avatarUrl,
                                                                        authProvider = provider,
                                                                        emailVerified =
                                                                                true // OAuth는 이메일
                                                                        // 검증됨
                                                                        )
                                                        userRepository.save(newUser).flatMap {
                                                                savedUser ->
                                                                saveOAuthAccount(
                                                                                savedUser.id!!,
                                                                                provider,
                                                                                providerUserId,
                                                                                email,
                                                                                name,
                                                                                avatarUrl
                                                                        )
                                                                        .flatMap {
                                                                                generateTokens(
                                                                                        savedUser
                                                                                )
                                                                        }
                                                        }
                                                }
                                        )
                        )
        }

        /**
         * 현재 사용자 정보 조회
         *
         * @param userId 사용자 ID
         * @return 사용자 정보
         */
        fun getCurrentUser(userId: Long): Mono<UserInfoResponse> {
                return userRepository.findById(userId).map { user ->
                        UserInfoResponse(
                                id = user.id!!,
                                email = user.email,
                                username = user.username,
                                avatarUrl = user.avatarUrl,
                                credits = user.totalCredits,
                                authProvider = user.authProvider,
                                emailVerified = user.emailVerified
                        )
                }
        }

        // ========================================
        // 사용자 관리 메서드
        // ========================================

        /** 사용자 프로필 업데이트 */
        fun updateUser(
                userId: Long,
                username: String?,
                avatarUrl: String?
        ): Mono<UserInfoResponse> {
                return userRepository
                        .findById(userId)
                        .switchIfEmpty(Mono.error(IllegalArgumentException("사용자를 찾을 수 없습니다.")))
                        .flatMap { user ->
                                val updatedUser =
                                        user.copy(
                                                username = username?.trim() ?: user.username,
                                                avatarUrl = avatarUrl ?: user.avatarUrl,
                                                updatedAt = LocalDateTime.now()
                                                // other fields are preserved
                                                )
                                userRepository.save(updatedUser)
                        }
                        .map { user ->
                                UserInfoResponse(
                                        id = user.id!!,
                                        email = user.email,
                                        username = user.username,
                                        avatarUrl = user.avatarUrl,
                                        credits = user.totalCredits,
                                        authProvider = user.authProvider,
                                        emailVerified = user.emailVerified
                                )
                        }
        }

        // ========================================
        // Private 메서드
        // ========================================

        /** 토큰 생성 및 저장 */
        private fun generateTokens(
                user: UserEntity,
                deviceInfo: String? = null,
                ipAddress: String? = null
        ): Mono<AuthTokenResponse> {
                val accessToken =
                        jwtService.generateAccessToken(user.id!!, user.email, user.username)
                val refreshToken = jwtService.generateRefreshToken(user.id)
                val tokenHash = jwtService.hashToken(refreshToken)

                // 리프레시 토큰 저장
                val refreshTokenEntity =
                        RefreshTokenEntity(
                                userId = user.id,
                                tokenHash = tokenHash,
                                deviceInfo = deviceInfo,
                                ipAddress = ipAddress,
                                expiresAt = LocalDateTime.now().plusDays(7)
                        )

                return refreshTokenRepository.save(refreshTokenEntity).map {
                        AuthTokenResponse(
                                accessToken = accessToken,
                                refreshToken = refreshToken,
                                expiresIn = 900, // 15분 (초)
                                user =
                                        UserInfoResponse(
                                                id = user.id,
                                                email = user.email,
                                                username = user.username,
                                                avatarUrl = user.avatarUrl,
                                                credits = user.totalCredits,
                                                authProvider = user.authProvider,
                                                emailVerified = user.emailVerified
                                        )
                        )
                }
        }

        /** OAuth 계정 저장 */
        private fun saveOAuthAccount(
                userId: Long,
                provider: String,
                providerUserId: String,
                email: String,
                name: String,
                avatarUrl: String?
        ): Mono<UserOAuthAccountEntity> {
                val oauthAccount =
                        UserOAuthAccountEntity(
                                userId = userId,
                                provider = provider,
                                providerUserId = providerUserId,
                                email = email,
                                name = name,
                                avatarUrl = avatarUrl
                        )
                return oauthAccountRepository.save(oauthAccount)
        }
}

// ========================================
// Response DTOs
// ========================================

/** 인증 토큰 응답 */
data class AuthTokenResponse(
        val accessToken: String, // JWT Access Token
        val refreshToken: String, // JWT Refresh Token
        val expiresIn: Long, // Access Token 만료 시간 (초)
        val user: UserInfoResponse // 사용자 정보
)

/** 사용자 정보 응답 */
data class UserInfoResponse(
        val id: Long, // 사용자 ID
        val email: String, // 이메일
        val username: String, // 사용자명
        val avatarUrl: String?, // 프로필 이미지 URL
        val credits: Int, // 보유 크레딧
        val authProvider: String, // 인증 제공자
        val emailVerified: Boolean // 이메일 인증 여부
)
