package com.creativeai.application.port.input

import reactor.core.publisher.Mono

/**
 * 헥사고날 아키텍처: 인바운드 포트 (Use Case)
 */
interface GenerateEmojiUseCase {
    fun execute(command: GenerateEmojiCommand): Mono<EmojiGenerationResult>
}

data class GenerateEmojiCommand(
    val imageData: String,
    val styleId: String,
    val generationType: String = "single"
)

data class EmojiGenerationResult(
    val id: String,
    val status: String,
    val progress: Int,
    val estimatedTime: Int
)
