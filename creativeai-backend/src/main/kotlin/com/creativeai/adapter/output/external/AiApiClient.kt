package com.creativeai.adapter.output.external

import reactor.core.publisher.Mono

/** 외부 AI 서비스 연동을 위한 공통 인터페이스 */
interface AiApiClient {
    /**
     * 배경 제거
     * @param imageBase64 원본 이미지 (Base64)
     * @return 결과 이미지 (Base64)
     */
    fun removeBackground(imageBase64: String): Mono<String>

    /**
     * 이미지 화질 개선 (Enhance/Img2Img)
     * @param imageBase64 원본 이미지 (Base64)
     * @return 결과 이미지 (Base64)
     */
    fun enhance(imageBase64: String): Mono<String>

    /**
     * 이미지 업스케일링 (Upscale)
     * @param imageBase64 원본 이미지 (Base64)
     * @return 결과 이미지 (Base64)
     */
    fun upscale(imageBase64: String): Mono<String>

    /**
     * 스타일 변환 (Style Transfer)
     * @param imageBase64 원본 이미지 (Base64)
     * @param styleName 적용할 스타일 이름
     * @return 결과 이미지 (Base64)
     */
    fun styleTransfer(imageBase64: String, styleName: String): Mono<String>
}
