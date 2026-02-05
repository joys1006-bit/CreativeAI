package com.creativeai.application.service

import com.creativeai.application.port.output.AIModelPort
import com.creativeai.domain.emoji.Emoji
import com.creativeai.domain.emoji.EmojiRepository
import com.creativeai.domain.emoji.EmojiStyle
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class EmojiService {
    @Autowired lateinit var emojiRepository: EmojiRepository
    @Autowired lateinit var aiModelPort: AIModelPort
    @Transactional
    fun generateEmoji(imageData: String, styleId: String): Mono<Emoji> {
        return Mono.defer {
            val style = EmojiStyle.fromId(styleId)
            val newEmoji = Emoji.create(imageData, style)

            // 1. 초기 상태(PENDING)로 저장
            emojiRepository
                    .save(newEmoji)
                    .flatMap { savedEmoji ->
                        // 2. 프로세싱 시작 상태로 변경
                        savedEmoji.startProcessing()
                        emojiRepository.save(savedEmoji)
                    }
                    .flatMap { processingEmoji ->
                        // 3. AI 모델 호출 (비동기)
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
                                    processingEmoji.failGeneration(e.message ?: "Unknown error")
                                    emojiRepository.save(processingEmoji)
                                }
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
