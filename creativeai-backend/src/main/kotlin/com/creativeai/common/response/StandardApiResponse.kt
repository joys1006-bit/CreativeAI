package com.creativeai.common.response

/**
 * 표준화된 API 응답
 */
data class StandardApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val error: ErrorDetail? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    companion object {
        fun <T> success(data: T, message: String = "요청 성공"): StandardApiResponse<T> {
            return StandardApiResponse(
                success = true,
                data = data,
                message = message
            )
        }
        
        fun <T> error(message: String, errorCode: String? = null): StandardApiResponse<T> {
            return StandardApiResponse(
                success = false,
                message = message,
                error = ErrorDetail(errorCode, message)
            )
        }
    }
}

data class ErrorDetail(
    val code: String?,
    val message: String
)
