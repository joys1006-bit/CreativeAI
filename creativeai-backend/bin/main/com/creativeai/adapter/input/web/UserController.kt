package com.creativeai.adapter.input.web

import com.creativeai.application.service.AuthService
import com.creativeai.application.service.UserInfoResponse
import com.creativeai.common.response.ApiResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * ============================================ 사용자 컨트롤러 (UserController)
 * ============================================
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = ["http://localhost:3000", "http://localhost:5173"])
class UserController {

    @Autowired lateinit var authService: AuthService

    /** 내 프로필 수정 */
    @PutMapping("/me")
    fun updateMyProfile(
            @AuthenticationPrincipal userId: Long?,
            @RequestBody request: UserUpdateRequest
    ): Mono<ApiResponse<UserInfoResponse>> {
        if (userId == null) {
            return Mono.just(ApiResponse(success = false, data = null, message = "인증이 필요합니다."))
        }

        return authService
                .updateUser(userId, request.username, request.avatarUrl)
                .map { userInfo ->
                    ApiResponse(success = true, data = userInfo, message = "프로필이 업데이트되었습니다.")
                }
                .onErrorResume { error ->
                    Mono.just(
                            ApiResponse(
                                    success = false,
                                    data = null,
                                    message = error.message ?: "프로필 업데이트 중 오류가 발생했습니다."
                            )
                    )
                }
    }

    /** 특정 사용자 정보 조회 (공개용) */
    @GetMapping("/{userId}")
    fun getUserProfile(@PathVariable userId: Long): Mono<ApiResponse<UserInfoResponse>> {
        return authService
                .getCurrentUser(userId)
                .map { userInfo ->
                    // 민감 정보 마스킹 (Email, Credits 등)
                    val publicProfile =
                            userInfo.copy(email = "", credits = 0, emailVerified = false)
                    ApiResponse(success = true, data = publicProfile, message = "사용자 정보 조회 성공")
                }
                .switchIfEmpty(Mono.error(IllegalArgumentException("사용자를 찾을 수 없습니다.")))
                .onErrorResume {
                    Mono.just(
                            ApiResponse(success = false, data = null, message = "사용자를 찾을 수 없습니다.")
                    )
                }
    }
}

data class UserUpdateRequest(val username: String?, val avatarUrl: String?)
