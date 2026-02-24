package com.creativeai.domain.creation

import java.math.BigDecimal
import java.time.LocalDateTime

data class Creation(
        val id: Long? = null,
        val userId: Long,
        val creationType: CreationType,
        val styleId: Long? = null,
        val title: String? = null,
        val description: String? = null,
        val prompt: String? = null,
        val status: CreationStatus = CreationStatus.COMPLETED,
        val progress: Int = 0,
        val creditCost: Int = 0,
        val price: BigDecimal? = null,
        val isForSale: Boolean = false,
        val likeCount: Int = 0,
        val metadata: String? = null,
        val processingStartedAt: LocalDateTime? = null,
        val processingCompletedAt: LocalDateTime? = null,
        val completedAt: LocalDateTime? = null,
        val errorMessage: String? = null,
        val inputData: String? = null,
        val createdAt: LocalDateTime = LocalDateTime.now(),
        val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class CreationType {
    EMOJI,
    AVATAR,
    PHOTO
}

enum class CreationStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}
