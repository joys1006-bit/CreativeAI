package com.creativeai.adapter.input.web

import com.creativeai.application.service.AuthService
import com.creativeai.application.service.AuthTokenResponse
import com.creativeai.application.service.UserInfoResponse
import com.creativeai.common.response.ApiResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.server.reactive.ServerHttpRequest
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * ============================================ 인증 컨트롤러 (AuthController)
 * ============================================
 *
 * 엔드포인트:
 * - POST /api/auth/signup : 회원가입
 * - POST /api/auth/login : 로그인
 * - POST /api/auth/logout : 로그아웃
 * - POST /api/auth/refresh : 토큰 갱신
 * - GET /api/auth/me : 현재 사용자 정보
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["http://localhost:3000", "http://localhost:5173"])
class AuthController {

        @Autowired lateinit var authService: AuthService

        /**
         * 회원가입 API
         *
         * POST /api/auth/signup
         *
         * @param request 회원가입 요청 (email, password, username)
         * @return 토큰 응답
         */
        @PostMapping("/signup")
        @ResponseStatus(HttpStatus.CREATED)
        fun signup(@RequestBody request: SignupRequest): Mono<ApiResponse<AuthTokenResponse>> {
                // 입력값 검증
                if (request.email.isBlank()) {
                        return Mono.just(
                                ApiResponse(success = false, data = null, message = "이메일은 필수입니다.")
                        )
                }
                if (request.password.length < 6) {
                        return Mono.just(
                                ApiResponse(
                                        success = false,
                                        data = null,
                                        message = "비밀번호는 6자 이상이어야 합니다."
                                )
                        )
                }
                if (request.username.isBlank()) {
                        return Mono.just(
                                ApiResponse(success = false, data = null, message = "사용자명은 필수입니다.")
                        )
                }

                return authService
                        .signup(request.email, request.password, request.username)
                        .map { tokenResponse ->
                                ApiResponse(
                                        success = true,
                                        data = tokenResponse,
                                        message = "회원가입이 완료되었습니다. 환영합니다!"
                                )
                        }
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = error.message ?: "회원가입 중 오류가 발생했습니다."
                                        )
                                )
                        }
        }

        /**
         * 로그인 API
         *
         * POST /api/auth/login
         *
         * @param request 로그인 요청 (email, password)
         * @param httpRequest HTTP 요청 (IP 주소, User-Agent 추출용)
         * @return 토큰 응답
         */
        @PostMapping("/login")
        fun login(
                @RequestBody request: LoginRequest,
                httpRequest: ServerHttpRequest
        ): Mono<ApiResponse<AuthTokenResponse>> {
                // 기기 정보 추출
                val deviceInfo = httpRequest.headers.getFirst("User-Agent")
                val ipAddress = httpRequest.remoteAddress?.address?.hostAddress

                return authService
                        .login(request.email, request.password, deviceInfo, ipAddress)
                        .map { tokenResponse ->
                                ApiResponse(
                                        success = true,
                                        data = tokenResponse,
                                        message = "로그인되었습니다."
                                )
                        }
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = error.message ?: "로그인 중 오류가 발생했습니다."
                                        )
                                )
                        }
        }

        /**
         * 로그아웃 API
         *
         * POST /api/auth/logout
         *
         * @param request 로그아웃 요청 (refreshToken)
         * @return 성공 응답
         */
        @PostMapping("/logout")
        fun logout(@RequestBody request: LogoutRequest): Mono<ApiResponse<Nothing>> {
                return authService
                        .logout(request.refreshToken)
                        .then(
                                Mono.just(
                                        ApiResponse<Nothing>(
                                                success = true,
                                                data = null,
                                                message = "로그아웃되었습니다."
                                        )
                                )
                        )
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = error.message ?: "로그아웃 중 오류가 발생했습니다."
                                        )
                                )
                        }
        }

        /**
         * 토큰 갱신 API
         *
         * POST /api/auth/refresh
         *
         * @param request 갱신 요청 (refreshToken)
         * @return 새로운 토큰 응답
         */
        @PostMapping("/refresh")
        fun refreshToken(
                @RequestBody request: RefreshTokenRequest
        ): Mono<ApiResponse<AuthTokenResponse>> {
                return authService
                        .refreshTokens(request.refreshToken)
                        .map { tokenResponse ->
                                ApiResponse(
                                        success = true,
                                        data = tokenResponse,
                                        message = "토큰이 갱신되었습니다."
                                )
                        }
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = error.message ?: "토큰 갱신 중 오류가 발생했습니다."
                                        )
                                )
                        }
        }

        /**
         * 현재 사용자 정보 조회 API
         *
         * GET /api/auth/me
         *
         * @param userId 인증된 사용자 ID (JWT에서 추출)
         * @return 사용자 정보
         */
        @GetMapping("/me")
        fun getCurrentUser(
                @AuthenticationPrincipal userId: Long?
        ): Mono<ApiResponse<UserInfoResponse>> {
                if (userId == null) {
                        return Mono.just(
                                ApiResponse(success = false, data = null, message = "인증이 필요합니다.")
                        )
                }

                return authService
                        .getCurrentUser(userId)
                        .map { userInfo ->
                                ApiResponse(
                                        success = true,
                                        data = userInfo,
                                        message = "사용자 정보 조회 성공"
                                )
                        }
                        .onErrorResume { error ->
                                Mono.just(
                                        ApiResponse(
                                                success = false,
                                                data = null,
                                                message = error.message ?: "사용자 정보 조회 중 오류가 발생했습니다."
                                        )
                                )
                        }
        }

        /**
         * 이메일 중복 확인 API
         *
         * GET /api/auth/check-email?email=xxx
         *
         * @param email 확인할 이메일
         * @return 사용 가능 여부
         */
        @GetMapping("/check-email")
        fun checkEmail(@RequestParam email: String): Mono<ApiResponse<EmailCheckResponse>> {
                return authService.userRepository.existsByEmail(email.lowercase()).map { exists ->
                        ApiResponse(
                                success = true,
                                data = EmailCheckResponse(available = !exists),
                                message = if (exists) "이미 사용 중인 이메일입니다." else "사용 가능한 이메일입니다."
                        )
                }
        }
}

// ========================================
// Request/Response DTOs
// ========================================

/** 회원가입 요청 */
class SignupRequest {
        var email: String = ""
        var password: String = ""
        var username: String = ""
}

/** 로그인 요청 */
class LoginRequest {
        var email: String = ""
        var password: String = ""
}

/** 로그아웃 요청 */
data class LogoutRequest(
        val refreshToken: String // 리프레시 토큰
)

/** 토큰 갱신 요청 */
data class RefreshTokenRequest(
        val refreshToken: String // 리프레시 토큰
)

/** 이메일 확인 응답 */
data class EmailCheckResponse(
        val available: Boolean // 사용 가능 여부
)
