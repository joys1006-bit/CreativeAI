package com.creativeai.application.service

import com.creativeai.application.port.input.*
import com.creativeai.application.port.output.AIModelPort
import com.creativeai.domain.avatar.*
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

/**
 * 아바타 서비스
 */
@Service
class AvatarService(
    private val avatarRepository: AvatarRepository,
    private val aiModelPort: AIModelPort
) : GenerateAvatarUseCase, GetAvatarStylesUseCase {
    
    override fun execute(command: GenerateAvatarCommand): Mono<AvatarGenerationResult> {
        val style = AvatarStyle.fromId(command.styleId)
        val avatar = Avatar.create(command.imageData, style)
        
        avatar.startProcessing()
        
        return avatarRepository.save(avatar)
            .flatMap { savedAvatar ->
                aiModelPort.generateAvatar(command.imageData, command.styleId)
                    .flatMap { generatedData ->
                        savedAvatar.completeGeneration(
                            generatedData.generatedImage,
                            generatedData.variations
                        )
                        avatarRepository.save(savedAvatar)
                    }
                    .onErrorResume { error ->
                        savedAvatar.failGeneration(error.message ?: "Unknown error")
                        avatarRepository.save(savedAvatar)
                    }
                    .thenReturn(savedAvatar)
            }
            .map { avatar ->
                AvatarGenerationResult(
                    id = avatar.id,
                    status = avatar.status.name.lowercase(),
                    progress = if (avatar.isCompleted()) 100 else 0,
                    estimatedTime = if (avatar.isCompleted()) 0 else 5
                )
            }
    }
    
    override fun execute(): Mono<List<AvatarStyleDto>> {
        return Mono.just(
            AvatarStyle.allStyles().map { AvatarStyleDto.from(it) }
        )
    }
}
