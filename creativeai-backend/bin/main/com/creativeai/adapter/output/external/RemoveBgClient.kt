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

/** Remove.bg API 연동 구현체 (배경 제거 전문) */
@Component
class RemoveBgClient(
        private val webClientBuilder: WebClient.Builder,
        @Value("\${ai.removebg.api-key:}") private val apiKey: String
) {
    private val log = LoggerFactory.getLogger(RemoveBgClient::class.java)
    private val removeBgUrl = "https://api.remove.bg/v1.0/removebg"

    fun removeBackground(imageBase64: String): Mono<String> {
        if (apiKey.isBlank() || apiKey.contains("YOUR_")) {
            log.warn(
                    "Remove.bg 키가 설정되지 않거나 플레이스홀더 상태입니다. 시뮬레이션 모드로 작동합니다. (Key length: ${apiKey.length})"
            )
            // 키가 없으면 원본을 그대로 반환하거나 시뮬레이션 데이터를 반환
            return Mono.just(imageBase64.substringAfter(","))
        }

        val imageBytes =
                try {
                    Base64.getDecoder().decode(imageBase64.substringAfter(","))
                } catch (e: Exception) {
                    return Mono.error(IllegalArgumentException("잘못된 이미지 데이터 형식입니다."))
                }

        val bodyBuilder = MultipartBodyBuilder()
        bodyBuilder.part("image_file", ByteArrayResource(imageBytes)).filename("image.png")
        bodyBuilder.part("size", "auto")

        return webClientBuilder
                .build()
                .post()
                .uri(removeBgUrl)
                .header("X-Api-Key", apiKey)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .onStatus({ status -> status.isError }) { response ->
                    Mono.error(RuntimeException("Remove.bg API 에러: ${response.statusCode()}"))
                }
                .bodyToMono(ByteArray::class.java)
                .map { Base64.getEncoder().encodeToString(it) }
    }
}
