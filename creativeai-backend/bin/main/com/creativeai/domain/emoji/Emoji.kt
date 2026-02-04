package com.creativeai.domain.emoji

import java.time.LocalDateTime
import java.util.UUID

/**
 * DDD: Emoji Aggregate Root
 * 
 * 비즈니스 규칙:
 * - 이모티콘은 반드시 이미지 데이터와 스타일을 가져야 함
 * - 생성 상태는 PENDING -> PROCESSING -> COMPLETED/FAILED 순서로만 전환
 * - 완료된 이모티콘은 다시 처리할 수 없음
 */
data class Emoji private constructor(
    val id: String,
    val imageData: String,
    val style: EmojiStyle,
    var status: GenerationStatus,
    var generatedImage: String? = null,
    var variations: List<String> = emptyList(),
    var errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var startedAt: LocalDateTime? = null,
    var completedAt: LocalDateTime? = null
) {
    companion object {
        /**
         * Factory Method: 새로운 Emoji 생성
         */
        fun create(imageData: String, style: EmojiStyle): Emoji {
            require(imageData.isNotBlank()) { "Image data cannot be empty" }
            
            return Emoji(
                id = UUID.randomUUID().toString(),
                imageData = imageData,
                style = style,
                status = GenerationStatus.PENDING
            )
        }
    }
    
    /**
     * 도메인 로직: 처리 시작
     */
    fun startProcessing() {
        require(status == GenerationStatus.PENDING) {
            "Can only start processing from PENDING status"
        }
        status = GenerationStatus.PROCESSING
        startedAt = LocalDateTime.now()
    }
    
    /**
     * 도메인 로직: 생성 완료
     */
    fun completeGeneration(generatedImage: String, variations: List<String>) {
        require(status == GenerationStatus.PROCESSING) {
            "Can only complete from PROCESSING status"
        }
        this.status = GenerationStatus.COMPLETED
        this.generatedImage = generatedImage
        this.variations = variations
        this.completedAt = LocalDateTime.now()
    }
    
    /**
     * 도메인 로직: 생성 실패
     */
    fun failGeneration(errorMessage: String) {
        require(status == GenerationStatus.PROCESSING) {
            "Can only fail from PROCESSING status"
        }
        this.status = GenerationStatus.FAILED
        this.errorMessage = errorMessage
        this.completedAt = LocalDateTime.now()
    }
    
    /**
     * 도메인 로직: 완료 여부 확인
     */
    fun isCompleted(): Boolean = status == GenerationStatus.COMPLETED
    
    /**
     * 도메인 로직: 실패 여부 확인
     */
    fun isFailed(): Boolean = status == GenerationStatus.FAILED
}

/**
 * DDD: Value Object - 이모티콘 스타일
 * 
 * 불변 객체로 동등성은 값으로 판단
 */
data class EmojiStyle(
    val id: String,
    val name: String,
    val description: String
) {
    companion object {
        val KAKAO = EmojiStyle("kakao", "카톡 스타일", "동그란 캐릭터, 파스텔 톤")
        val LINE = EmojiStyle("line", "라인 스타일", "심플한 라인, 큰 눈")
        val CUTE = EmojiStyle("cute", "귀여움", "일본 애니메이션 스타일")
        val MINIMAL = EmojiStyle("minimal", "미니멀", "단순한 선, 모노톤")
        val THREE_D = EmojiStyle("3d", "3D", "입체감 있는 캐릭터")
        val RETRO = EmojiStyle("retro", "레트로", "90년대 픽셀 아트")
        
        private val stylesMap = mapOf(
            "kakao" to KAKAO,
            "line" to LINE,
            "cute" to CUTE,
            "minimal" to MINIMAL,
            "3d" to THREE_D,
            "retro" to RETRO
        )
        
        fun fromId(id: String): EmojiStyle {
            return stylesMap[id] ?: throw IllegalArgumentException("Unknown style id: $id")
        }
        
        fun allStyles(): List<EmojiStyle> {
            return stylesMap.values.toList()
        }
    }
}

/**
 * DDD: Value Object - 생성 상태
 */
enum class GenerationStatus {
    PENDING,     // 대기 중
    PROCESSING,  // 처리 중
    COMPLETED,   // 완료
    FAILED       // 실패
}
