package com.creativeai.common.exception

/**
 * 커스텀 예외 클래스
 */
sealed class CreativeAIException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * 도메인 예외
 */
class DomainException(
    message: String,
    cause: Throwable? = null
) : CreativeAIException(message, cause)

/**
 * 리소스를 찾을 수 없음
 */
class ResourceNotFoundException(
    resourceType: String,
    resourceId: String
) : CreativeAIException("$resourceType with id '$resourceId' not found")

/**
 * 잘못된 요청
 */
class InvalidRequestException(
    message: String,
    cause: Throwable? = null
) : CreativeAIException(message, cause)

/**
 * AI 서비스 예외
 */
class AIServiceException(
    message: String,
    cause: Throwable? = null
) : CreativeAIException(message, cause)

/**
 * 리포지토리 예외
 */
class RepositoryException(
    message: String,
    cause: Throwable? = null
) : CreativeAIException(message, cause)
