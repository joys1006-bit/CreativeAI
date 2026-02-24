package com.creativeai.application.service

import com.creativeai.application.port.input.EmojiGenerationResult
import com.creativeai.application.port.input.GenerateEmojiCommand
import com.creativeai.application.port.input.GenerateEmojiUseCase
import com.creativeai.application.port.output.AIModelPort
import com.creativeai.domain.emoji.Emoji
import com.creativeai.domain.emoji.EmojiRepository
import com.creativeai.domain.emoji.EmojiStyle
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class EmojiService(
        private val emojiRepository: EmojiRepository,
        private val aiModelPort: AIModelPort
) : GenerateEmojiUseCase {

    @Transactional
    override fun execute(command: GenerateEmojiCommand): Mono<EmojiGenerationResult> {
        return generateEmoji(command.imageData, command.styleId).map { emoji ->
            EmojiGenerationResult(
                    id = emoji.id,
                    status = emoji.status.name.lowercase(),
                    progress = if (emoji.isCompleted()) 100 else 0,
                    estimatedTime = 3
            )
        }
    }

    @Transactional
    fun generateEmoji(imageData: String, styleId: String): Mono<Emoji> {
        return Mono.defer {
            val style =
                    try {
                        EmojiStyle.fromId(styleId)
                    } catch (e: Exception) {
                        EmojiStyle.KAKAO // 기본값 처리
                    }
            val newEmoji = Emoji.create(imageData, style)

            // 1. 초기 상태(PENDING)로 저장
            emojiRepository
                    .save(newEmoji)
                    .flatMap { savedEmoji ->
                        // 2. 프로세싱 시작 상태로 변경
                        savedEmoji.startProcessing()
                        emojiRepository.save(savedEmoji)
                    }
                    .doOnNext { processingEmoji ->
                        // 3. AI 모델 호출 (백운드 비동기 처리 - 리액티브 체인과 분리되어 구독)
                        aiModelPort
                                .generateEmoji(imageData, styleId)
                                .flatMap { result ->
                                    // 4. 성공 시 완료 처리
                                    processingEmoji.completeGeneration(
                                            generatedImage = result.generatedImage,
                                            variations = result.variations
                                    )
                                    emojiRepository.save(processingEmoji)
                                }
                                .onErrorResume { e ->
                                    // 5. 실패 시 에러 처리
                                    processingEmoji.failGeneration(e.message ?: "AI 엔진 응답 오류")
                                    emojiRepository.save(processingEmoji)
                                }
                                .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                                .subscribe()
                    }
        }
    }

    fun getAllEmojis(): Flux<Emoji> {
        return emojiRepository.findAll()
    }

    fun getEmojiById(id: String): Mono<Emoji> {
        return emojiRepository.findById(id)
    }
}
