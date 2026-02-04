package com.creativeai.application.port.output

import reactor.core.publisher.Mono

/**
 * 헥사고날 아키텍처: 아웃바운드 포트
 * 
 * AI 모델 호출 포트
 */
interface AIModelPort {
    fun generateEmoji(imageData: String, styleId: String): Mono<GeneratedEmojiData>
    fun generateAvatar(imageData: String, styleId: String): Mono<GeneratedAvatarData>
}

data class GeneratedEmojiData(
    val generatedImage: String,
    val variations: List<String> = emptyList()
)

data class GeneratedAvatarData(
    val generatedImage: String,
    val variations: List<String> = emptyList()
)
