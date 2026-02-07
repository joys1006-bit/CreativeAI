package com.creativeai.common.security

import com.creativeai.adapter.output.persistence.RefreshTokenEntity
import com.creativeai.adapter.output.persistence.RefreshTokenR2dbcRepository
import com.creativeai.adapter.output.persistence.UserEntity
import com.creativeai.adapter.output.persistence.UserOAuthAccountEntity
import com.creativeai.adapter.output.persistence.UserOAuthAccountR2dbcRepository
import com.creativeai.adapter.output.persistence.UserR2dbcRepository
import com.creativeai.application.service.JwtService
import java.net.URI
import java.time.LocalDateTime
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.server.WebFilterExchange
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class OAuth2LoginSuccessHandler(
        private val jwtService: JwtService,
        private val userRepository: UserR2dbcRepository,
        private val oauthAccountRepository: UserOAuthAccountR2dbcRepository,
        private val refreshTokenRepository: RefreshTokenR2dbcRepository
) : ServerAuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
            webFilterExchange: WebFilterExchange,
            authentication: Authentication
    ): Mono<Void> {
        val oauth2User = authentication.principal as OAuth2User
        val provider = "google" // 현재는 google만 지원

        // Google Attribute 예: sub (providerId), email, name, picture
        val providerUserId = oauth2User.attributes["sub"] as String
        val email = oauth2User.attributes["email"] as String
        val name = oauth2User.attributes["name"] as String
        val avatarUrl = oauth2User.attributes["picture"] as? String

        return oauthAccountRepository
                .findByProviderAndProviderUserId(provider, providerUserId)
                .flatMap { oauthAccount ->
                    // 이미 연동된 계정 -> 사용자 조회
                    userRepository.findById(oauthAccount.userId)
                }
                .switchIfEmpty(
                        // 연동된 계정 없음 -> 이메일로 기존 사용자 확인 또는 신규 생성
                        userRepository
                                .findByEmail(email)
                                .flatMap { existingUser ->
                                    // 기존 사용자 있음 -> 연동 계정 생성
                                    saveOAuthAccount(
                                                    existingUser.id!!,
                                                    provider,
                                                    providerUserId,
                                                    email,
                                                    name,
                                                    avatarUrl
                                            )
                                            .thenReturn(existingUser)
                                }
                                .switchIfEmpty(
                                        // 신규 사용자 생성
                                        Mono.defer {
                                            val newUser =
                                                    UserEntity(
                                                            email = email,
                                                            username = name,
                                                            avatarUrl = avatarUrl,
                                                            authProvider = provider,
                                                            emailVerified = true
                                                    )
                                            userRepository.save(newUser).flatMap { savedUser ->
                                                saveOAuthAccount(
                                                                savedUser.id!!,
                                                                provider,
                                                                providerUserId,
                                                                email,
                                                                name,
                                                                avatarUrl
                                                        )
                                                        .thenReturn(savedUser)
                                            }
                                        }
                                )
                )
                .flatMap { user ->
                    // 토큰 생성 및 리다이렉트
                    generateTokensAndRedirect(webFilterExchange, user)
                }
    }

    private fun saveOAuthAccount(
            userId: Long,
            provider: String,
            providerUserId: String,
            email: String,
            name: String,
            avatarUrl: String?
    ): Mono<UserOAuthAccountEntity> {
        val account =
                UserOAuthAccountEntity(
                        userId = userId,
                        provider = provider,
                        providerUserId = providerUserId,
                        email = email,
                        name = name,
                        avatarUrl = avatarUrl
                )
        return oauthAccountRepository.save(account)
    }

    private fun generateTokensAndRedirect(
            webFilterExchange: WebFilterExchange,
            user: UserEntity
    ): Mono<Void> {
        val accessToken = jwtService.generateAccessToken(user.id!!, user.email, user.username)
        val refreshToken = jwtService.generateRefreshToken(user.id)
        val tokenHash = jwtService.hashToken(refreshToken)

        val refreshTokenEntity =
                RefreshTokenEntity(
                        userId = user.id,
                        tokenHash = tokenHash,
                        expiresAt = LocalDateTime.now().plusDays(7)
                )

        return refreshTokenRepository.save(refreshTokenEntity).flatMap {
            // 프론트엔드로 리다이렉트 (토큰 포함)
            val redirectUrl =
                    "http://localhost:3000/login/callback?accessToken=$accessToken&refreshToken=$refreshToken"
            webFilterExchange.exchange.response.statusCode =
                    org.springframework.http.HttpStatus.FOUND
            webFilterExchange.exchange.response.headers.location = URI.create(redirectUrl)
            webFilterExchange.exchange.response.setComplete()
        }
    }
}
