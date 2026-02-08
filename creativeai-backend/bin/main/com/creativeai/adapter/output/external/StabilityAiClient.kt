package com.creativeai.adapter.output.external

import java.util.Base64
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.BodyInserters
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

/** Stability AI API 연동 구현체 */
@Component
class StabilityAiClient(
        private val webClientBuilder: WebClient.Builder,
        @Value("\${ai.stability.api-key:}") private val apiKey: String
) : AiApiClient {

    private val log = LoggerFactory.getLogger(StabilityAiClient::class.java)
    private val stabilityUrl = "https://api.stability.ai/v1/generation"

    override fun removeBackground(imageBase64: String): Mono<String> {
        // Stability AI는 전용 배경 제거 API가 있으나 별도 모델 사용 필요
        // 여기서는 예시로 Img2Img 스타일로 처리하거나 에러 반환 가능
        return Mono.error(UnsupportedOperationException("배경 제거는 Remove.bg Client를 사용하세요."))
    }

    override fun enhance(imageBase64: String): Mono<String> {
        return Mono.error(UnsupportedOperationException("화질 개선 기능은 현재 인물 보존 품질 문제로 제공되지 않습니다."))
    }

    override fun upscale(imageBase64: String): Mono<String> {
        return Mono.error(UnsupportedOperationException("확대 기능은 현재 인물 보존 품질 문제로 제공되지 않습니다."))
    }

    override fun styleTransfer(imageBase64: String, styleName: String): Mono<String> {
        if (apiKey.isBlank() || apiKey.contains("YOUR_")) {
            log.warn("Stability AI 키가 설정되지 않거나 플레이스홀더 상태입니다. 시뮬레이션 모드로 작동합니다.")
            return simulateStyle(imageBase64, styleName)
        }

        // Stability AI 공식 스타일 프리셋으로 매핑
        val preset =
                when (styleName.lowercase()) {
                    "anime" -> "anime"
                    "3d-model", "3d" -> "3d-model"
                    "cinematic" -> "cinematic"
                    "pixel-art", "pixel" -> "pixel-art"
                    "comic-book", "comic" -> "comic-book"
                    "digital-art" -> "digital-art"
                    "fantasy-art" -> "fantasy-art"
                    else -> "digital-art"
                }

        // 스타일 변환 강도를 0.45로 낮추어 인물의 정체성을 보호 (0.65는 너무 과함)
        return callImg2Img(
                imageBase64,
                "professional $styleName style, high quality, masterpiece",
                0.45,
                preset
        )
    }

    private fun simulateEnhance(imageBase64: String): Mono<String> =
            Mono.just(imageBase64.substringAfter(","))
    private fun simulateUpscale(imageBase64: String): Mono<String> =
            Mono.just(imageBase64.substringAfter(","))
    private fun simulateStyle(imageBase64: String, style: String): Mono<String> =
            Mono.just(imageBase64.substringAfter(","))

    private fun callImg2Img(
            imageBase64: String,
            prompt: String,
            strength: Double,
            stylePreset: String? = null
    ): Mono<String> {
        log.info(
                "Stability AI Call - Engine: SDXL, Prompt: $prompt, Strength: $strength, Preset: $stylePreset"
        )
        val pureBase64 = imageBase64.substringAfter(",")
        var imageBytes = Base64.getDecoder().decode(pureBase64)

        // Stability AI Pixel Limit & SDXL 전용 해상도 대응을 위한 리사이징
        imageBytes = com.creativeai.common.util.ImageUtils.resizeToSDXLDimensions(imageBytes)

        val bodyBuilder = MultipartBodyBuilder()
        bodyBuilder.part("init_image", ByteArrayResource(imageBytes)).filename("image.png")
        bodyBuilder.part("text_prompts[0][text]", prompt)
        bodyBuilder.part("text_prompts[0][weight]", 1.0)
        bodyBuilder.part("image_strength", strength)
        bodyBuilder.part("cfg_scale", 7)
        bodyBuilder.part("samples", 1)
        if (stylePreset != null) {
            bodyBuilder.part("style_preset", stylePreset)
        }

        return webClientBuilder
                .build()
                .post()
                .uri("$stabilityUrl/stable-diffusion-xl-1024-v1-0/image-to-image")
                .header("Authorization", "Bearer $apiKey")
                .header("Accept", "application/json")
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .onStatus({ status -> status.isError }) { response ->
                    response.bodyToMono(String::class.java).flatMap { errorBody ->
                        log.error("Stability AI API Error: ${response.statusCode()} - $errorBody")
                        Mono.error(RuntimeException("Stability AI 에러: $errorBody"))
                    }
                }
                .bodyToMono(StabilityResponse::class.java)
                .map { it.artifacts.first().base64 }
    }

    data class StabilityResponse(val artifacts: List<Artifact>)
    data class Artifact(val base64: String, val seed: Long, val finishReason: String)
}
