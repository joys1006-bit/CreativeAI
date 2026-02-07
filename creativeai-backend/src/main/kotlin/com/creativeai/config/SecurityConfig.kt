package com.creativeai.config

import com.creativeai.common.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.reactive.CorsConfigurationSource
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource
import reactor.core.publisher.Mono

/**
 * ============================================ Spring Security 설정 (WebFlux 리액티브 버전)
 * ============================================
 *
 * 설정 내용:
 * - CORS 설정
 * - CSRF 비활성화 (JWT 사용으로 인해)
 * - 인증 필요 없는 경로 설정
 * - JWT 인증 필터 적용
 * - 세션 Stateless 설정
 */
@Configuration
@EnableWebFluxSecurity
class SecurityConfig(private val jwtAuthenticationFilter: JwtAuthenticationFilter) {

    /** 보안 필터 체인 설정 */
    @Bean
    fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http
                // CORS 설정 적용
                .cors { cors -> cors.configurationSource(corsConfigurationSource()) }

                // CSRF 비활성화 (JWT 사용 시 필요 없음)
                .csrf { csrf -> csrf.disable() }

                // HTTP Basic 인증 비활성화
                .httpBasic { basic -> basic.disable() }

                // Form 로그인 비활성화
                .formLogin { form -> form.disable() }

                // 세션 사용 안함 (Stateless)
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())

                // 인증 실패 핸들러
                .exceptionHandling { exceptions ->
                    exceptions.authenticationEntryPoint { exchange, _ ->
                        Mono.fromRunnable { exchange.response.statusCode = HttpStatus.UNAUTHORIZED }
                    }
                }

                // 경로별 인증 규칙
                .authorizeExchange { exchanges ->
                    exchanges
                            // ===== 공개 경로 (인증 불필요) =====

                            // 인증 관련 API
                            .pathMatchers("/api/auth/**")
                            .permitAll()

                            // OAuth2 관련 경로
                            .pathMatchers("/oauth2/**")
                            .permitAll()
                            .pathMatchers("/login/oauth2/**")
                            .permitAll()

                            // 헬스체크
                            .pathMatchers("/api/health")
                            .permitAll()
                            .pathMatchers("/actuator/**")
                            .permitAll()

                            // 스타일 목록 조회 (읽기 전용)
                            .pathMatchers(HttpMethod.GET, "/api/emoji/styles")
                            .permitAll()
                            .pathMatchers(HttpMethod.GET, "/api/avatar/styles")
                            .permitAll()

                            // 인기 창작물, 마켓플레이스 (읽기 전용)
                            .pathMatchers(HttpMethod.GET, "/api/creations/popular")
                            .permitAll()
                            .pathMatchers(HttpMethod.GET, "/api/marketplace/**")
                            .permitAll()

                            // ===== 인증 필요 경로 =====
                            .anyExchange()
                            .authenticated()
                }

                // JWT 인증 필터 추가
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .build()
    }

    /** 비밀번호 인코더 (BCrypt) */
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    /** CORS 설정 */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration =
                CorsConfiguration().apply {
                    // 허용할 Origin (프론트엔드 주소)
                    allowedOrigins =
                            listOf(
                                    "http://localhost:3000",
                                    "http://localhost:5173" // Vite 개발서버
                            )

                    // 허용할 HTTP 메서드
                    allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")

                    // 허용할 헤더
                    allowedHeaders = listOf("*")

                    // 자격증명 허용 (쿠키, Authorization 헤더 등)
                    allowCredentials = true

                    // Preflight 캐시 시간 (1시간)
                    maxAge = 3600L
                }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}
