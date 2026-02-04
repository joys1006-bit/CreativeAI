package com.creativeai.application.port.input

import com.creativeai.domain.avatar.AvatarStyle
import reactor.core.publisher.Mono

/**
 * 아바타 생성 유스케이스
 */
interface GenerateAvatarUseCase {
    fun execute(command: GenerateAvatarCommand): Mono<AvatarGenerationResult>
}

data class GenerateAvatarCommand(
    val imageData: String,
    val styleId: String
)

data class AvatarGenerationResult(
    val id: String,
    val status: String,
    val progress: Int,
    val estimatedTime: Int
)

/**
 * 아바타 스타일 조회 유스케이스
 */
interface GetAvatarStylesUseCase {
    fun execute(): Mono<List<AvatarStyleDto>>
}

data class AvatarStyleDto(
    val id: String,
    val name: String,
    val description: String
) {
    companion object {
        fun from(style: AvatarStyle): AvatarStyleDto {
            return AvatarStyleDto(
                id = style.id,
                name = style.name,
                description = style.description
            )
        }
    }
}
