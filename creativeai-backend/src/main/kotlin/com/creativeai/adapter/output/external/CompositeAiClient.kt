package com.creativeai.adapter.output.external

import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

/** 여러 AI 클라이언트를 조합하여 사용하는 복합 클라이언트 */
@Component
@Primary
class CompositeAiClient(
        private val stabilityAiClient: StabilityAiClient,
        private val removeBgClient: RemoveBgClient
) : AiApiClient {

    override fun removeBackground(imageBase64: String): Mono<String> {
        return removeBgClient.removeBackground(imageBase64)
    }

    override fun enhance(imageBase64: String): Mono<String> {
        return stabilityAiClient.enhance(imageBase64)
    }

    override fun upscale(imageBase64: String): Mono<String> {
        return stabilityAiClient.upscale(imageBase64)
    }

    override fun styleTransfer(imageBase64: String, styleName: String): Mono<String> {
        return stabilityAiClient.styleTransfer(imageBase64, styleName)
    }
}
