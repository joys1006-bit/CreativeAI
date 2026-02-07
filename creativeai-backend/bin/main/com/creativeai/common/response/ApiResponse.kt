package com.creativeai.common.response

/** 공통 API 응답 DTO */
data class ApiResponse<T>(val success: Boolean, val data: T?, val message: String?)
