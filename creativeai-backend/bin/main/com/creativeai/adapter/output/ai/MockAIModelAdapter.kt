package com.creativeai.adapter.output.ai

import com.creativeai.application.port.output.*
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono
import java.time.Duration

/**
 * 어댑터: Mock AI Model
 * 
 * 실제 프로덕션에서는 Stable Diffusion, DALL-E API 호출
 */
@Component
class MockAIModelAdapter : AIModelPort {
    
    override fun generateEmoji(imageData: String, styleId: String): Mono<GeneratedEmojiData> {
        // 실제 AI 모델 호출 시뮬레이션 (2초 지연)
        return Mono.just(
            GeneratedEmojiData(
                generatedImage = "🎨_generated_$styleId",
                variations = listOf("🎭", "🎪", "🎬", "🎤")
            )
        ).delayElement(Duration.ofSeconds(2))
    }
    
    override fun generateAvatar(imageData: String, styleId: String): Mono<GeneratedAvatarData> {
        // 실제 AI 모델 호출 시뮬레이션 (3초 지연)
        return Mono.just(
            GeneratedAvatarData(
                generatedImage = "👤_generated_$styleId",
                variations = listOf("👨‍🎨", "👩‍🎨", "🧑‍🎨", "👤")
            )
        ).delayElement(Duration.ofSeconds(3))
    }
}
