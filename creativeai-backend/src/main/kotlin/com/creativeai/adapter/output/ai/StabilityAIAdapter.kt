package com.creativeai.adapter.output.ai

import com.creativeai.adapter.output.external.StabilityAiClient
import com.creativeai.application.port.output.*
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

/** 어댑터: 실제 AI 모델 연동 (Stability AI) 11인 전문가 연합의 '백엔드 아키텍트'가 설계한 실질적인 AI 연동 계층입니다. */
@Component
class StabilityAIAdapter(private val stabilityAiClient: StabilityAiClient) : AIModelPort {

    override fun generateEmoji(imageData: String, styleId: String): Mono<GeneratedEmojiData> {
        // 이미 생성된 이미지가 있다면 variations로 처리하거나, 단일 결과 반환
        return stabilityAiClient.styleTransfer(imageData, styleId).map { base64 ->
            GeneratedEmojiData(
                    generatedImage = base64,
                    variations = emptyList() // 향후 필요 시 추가
            )
        }
    }

    override fun generateAvatar(imageData: String, styleId: String): Mono<GeneratedAvatarData> {
        return stabilityAiClient.styleTransfer(imageData, styleId).map { base64 ->
            GeneratedAvatarData(generatedImage = base64, variations = emptyList())
        }
    }
}
