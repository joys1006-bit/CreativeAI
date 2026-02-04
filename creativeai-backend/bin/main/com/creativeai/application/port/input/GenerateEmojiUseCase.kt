package com.creativeai.application.port.input

import reactor.core.publisher.Mono

/**
 * 헥사고날 아키텍처: 인바운드 포트 (Use Case)
 * 
 * 이모티콘 생성 유스케이스
 */
interface GenerateEmojiUseCase {
    fun execute(command: GenerateEmojiCommand): Mono<EmojiGenerationResult>
}

/**
 * Command 객체 (입력 DTO)
 */
data class GenerateEmojiCommand(
    val imageData: String,
    val styleId: String,
    val generationType: String = "single"
)

/**
 * Result 객체 (출력 DTO)
 */
data class EmojiGenerationResult(
    val id: String,
    val status: String,
    val progress: Int,
    val estimatedTime: Int
)
