package com.creativeai.application.service

import com.creativeai.application.port.input.*
import com.creativeai.application.port.output.AIModelPort
import com.creativeai.domain.emoji.*
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

/**
 * 애플리케이션 서비스: 이모티콘 생성 유스케이스 구현
 */
@Service
class EmojiService(
    private val emojiRepository: EmojiRepository,
    private val aiModelPort: AIModelPort
) : GenerateEmojiUseCase, GetEmojiStylesUseCase {
    
    override fun execute(command: GenerateEmojiCommand): Mono<EmojiGenerationResult> {
        // 1. 도메인 모델 생성
        val style = EmojiStyle.fromId(command.styleId)
        val emoji = Emoji.create(command.imageData, style)
        
        // 2. 처리 시작
        emoji.startProcessing()
        
        // 3. 저장
        return emojiRepository.save(emoji)
            .flatMap { savedEmoji ->
                // 4. AI 모델 호출 (비동기)
                aiModelPort.generateEmoji(command.imageData, command.styleId)
                    .flatMap { generatedData ->
                        // 5. 도메인 모델 업데이트
                        savedEmoji.completeGeneration(
                            generatedData.generatedImage,
                            generatedData.variations
                        )
                        emojiRepository.save(savedEmoji)
                    }
                    .onErrorResume { error ->
                        // 6. 실패 처리
                        savedEmoji.failGeneration(error.message ?: "Unknown error")
                        emojiRepository.save(savedEmoji)
                    }
                    .thenReturn(savedEmoji)
            }
            .map { emoji ->
                // 7. DTO 변환
                EmojiGenerationResult(
                    id = emoji.id,
                    status = emoji.status.name.lowercase(),
                    progress = if (emoji.isCompleted()) 100 else 0,
                    estimatedTime = if (emoji.isCompleted()) 0 else 3
                )
            }
    }
    
    override fun execute(): Mono<List<EmojiStyleDto>> {
        return Mono.just(
            EmojiStyle.allStyles().map { EmojiStyleDto.from(it) }
        )
    }
}
