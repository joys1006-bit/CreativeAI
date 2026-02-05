package com.creativeai.common.exception

import com.creativeai.adapter.input.web.ApiResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono

/**
 * 글로벌 에러 핸들러
 */
@RestControllerAdvice
class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFound(
        ex: ResourceNotFoundException,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<ApiResponse<Nothing>>> {
        return Mono.just(
            ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = ex.message
                    )
                )
        )
    }
    
    @ExceptionHandler(InvalidRequestException::class)
    fun handleInvalidRequest(
        ex: InvalidRequestException,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<ApiResponse<Nothing>>> {
        return Mono.just(
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = ex.message
                    )
                )
        )
    }
    
    @ExceptionHandler(DomainException::class)
    fun handleDomainException(
        ex: DomainException,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<ApiResponse<Nothing>>> {
        return Mono.just(
            ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = ex.message
                    )
                )
        )
    }
    
    @ExceptionHandler(AIServiceException::class)
    fun handleAIServiceException(
        ex: AIServiceException,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<ApiResponse<Nothing>>> {
        return Mono.just(
            ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = "AI 서비스 오류: ${ex.message}"
                    )
                )
        )
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<ApiResponse<Nothing>>> {
        return Mono.just(
            ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                    ApiResponse(
                        success = false,
                        data = null,
                        message = "서버 오류가 발생했습니다: ${ex.message}"
                    )
                )
        )
    }
}
