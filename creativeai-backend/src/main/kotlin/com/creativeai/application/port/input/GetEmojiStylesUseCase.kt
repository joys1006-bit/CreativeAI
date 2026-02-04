package com.creativeai.application.port.input

import com.creativeai.domain.emoji.EmojiStyle
import reactor.core.publisher.Mono

/**
 * 헥사고날 아키텍처: 인바운드 포트
 */
interface GetEmojiStylesUseCase {
    fun execute(): Mono<List<EmojiStyleDto>>
}

data class EmojiStyleDto(
    val id: String,
    val name: String,
    val description: String
) {
    companion object {
        fun from(style: EmojiStyle): EmojiStyleDto {
            return EmojiStyleDto(
                id = style.id,
                name = style.name,
                description = style.description
            )
        }
    }
}
