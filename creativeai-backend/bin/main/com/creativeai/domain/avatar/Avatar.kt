package com.creativeai.domain.avatar

import java.time.LocalDateTime
import java.util.UUID

/**
 * DDD: Avatar Aggregate Root
 */
data class Avatar private constructor(
    val id: String,
    val imageData: String,
    val style: AvatarStyle,
    var status: GenerationStatus,
    var generatedImage: String? = null,
    var variations: List<String> = emptyList(),
    var errorMessage: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var startedAt: LocalDateTime? = null,
    var completedAt: LocalDateTime? = null
) {
    companion object {
        fun create(imageData: String, style: AvatarStyle): Avatar {
            require(imageData.isNotBlank()) { "Image data cannot be empty" }
            
            return Avatar(
                id = UUID.randomUUID().toString(),
                imageData = imageData,
                style = style,
                status = GenerationStatus.PENDING
            )
        }
    }
    
    fun startProcessing() {
        require(status == GenerationStatus.PENDING) {
            "Can only start processing from PENDING status"
        }
        status = GenerationStatus.PROCESSING
        startedAt = LocalDateTime.now()
    }
    
    fun completeGeneration(generatedImage: String, variations: List<String>) {
        require(status == GenerationStatus.PROCESSING) {
            "Can only complete from PROCESSING status"
        }
        this.status = GenerationStatus.COMPLETED
        this.generatedImage = generatedImage
        this.variations = variations
        this.completedAt = LocalDateTime.now()
    }
    
    fun failGeneration(errorMessage: String) {
        require(status == GenerationStatus.PROCESSING) {
            "Can only fail from PROCESSING status"
        }
        this.status = GenerationStatus.FAILED
        this.errorMessage = errorMessage
        this.completedAt = LocalDateTime.now()
    }
    
    fun isCompleted(): Boolean = status == GenerationStatus.COMPLETED
    fun isFailed(): Boolean = status == GenerationStatus.FAILED
}

/**
 * DDD: Value Object - 아바타 스타일
 */
data class AvatarStyle(
    val id: String,
    val name: String,
    val description: String
) {
    companion object {
        val ANIME = AvatarStyle("anime", "애니메이션", "일본 애니메이션 스타일")
        val THREE_D = AvatarStyle("3d", "3D 캐릭터", "입체감 있는 3D 모델")
        val PIXEL = AvatarStyle("pixel", "픽셀아트", "레트로 픽셀 스타일")
        val CARTOON = AvatarStyle("cartoon", "카툰", "만화 캐릭터 스타일")
        val REALISTIC = AvatarStyle("realistic", "사실적", "실제 사진 같은 스타일")
        val FANTASY = AvatarStyle("fantasy", "판타지", "판타지 세계관")
        
        private val stylesMap = mapOf(
            "anime" to ANIME,
            "3d" to THREE_D,
            "pixel" to PIXEL,
            "cartoon" to CARTOON,
            "realistic" to REALISTIC,
            "fantasy" to FANTASY
        )
        
        fun fromId(id: String): AvatarStyle {
            return stylesMap[id] ?: throw IllegalArgumentException("Unknown style id: $id")
        }
        
        fun allStyles(): List<AvatarStyle> {
            return stylesMap.values.toList()
        }
    }
}

/**
 * DDD: Value Object - 생성 상태
 */
enum class GenerationStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}
