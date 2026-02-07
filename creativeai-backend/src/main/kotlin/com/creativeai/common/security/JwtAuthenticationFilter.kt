package com.creativeai.common.security

import com.creativeai.application.service.JwtService
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

/**
 * ============================================ JWT 인증 필터 (WebFlux 리액티브 버전)
 * ============================================
 *
 * 역할:
 * - 요청 헤더에서 JWT 토큰 추출
 * - 토큰 유효성 검증
 * - 인증 정보를 SecurityContext에 설정
 */
@Component
class JwtAuthenticationFilter(private val jwtService: JwtService) : WebFilter {

    companion object {
        // Authorization 헤더 접두사
        private const val BEARER_PREFIX = "Bearer "
    }

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        // 1. Authorization 헤더에서 토큰 추출
        val token = extractToken(exchange)

        // 토큰이 없으면 다음 필터로 진행
        if (token == null) {
            return chain.filter(exchange)
        }

        // 2. 토큰 유효성 검증
        if (!jwtService.validateToken(token)) {
            return chain.filter(exchange)
        }

        // 3. Access Token인지 확인
        if (!jwtService.isAccessToken(token)) {
            return chain.filter(exchange)
        }

        // 4. 토큰에서 사용자 정보 추출
        val userId = jwtService.getUserIdFromToken(token)
        val email = jwtService.getEmailFromToken(token)

        if (userId == null || email == null) {
            return chain.filter(exchange)
        }

        // 5. 인증 객체 생성
        val authentication =
                UsernamePasswordAuthenticationToken(
                        userId, // principal: 사용자 ID
                        null, // credentials: null (JWT 사용)
                        listOf(SimpleGrantedAuthority("ROLE_USER")) // authorities: 기본 사용자 권한
                )

        // 6. SecurityContext에 인증 정보 설정 후 다음 필터 진행
        return chain.filter(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication))
    }

    /**
     * Authorization 헤더에서 JWT 토큰 추출
     *
     * @param exchange HTTP 요청/응답 교환 객체
     * @return JWT 토큰 문자열 (없으면 null)
     */
    private fun extractToken(exchange: ServerWebExchange): String? {
        val authHeader = exchange.request.headers.getFirst(HttpHeaders.AUTHORIZATION)

        // "Bearer " 접두사로 시작하는지 확인
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length)
        }

        return null
    }
}
