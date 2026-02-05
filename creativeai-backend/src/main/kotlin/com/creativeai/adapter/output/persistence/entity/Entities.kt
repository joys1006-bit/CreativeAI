package com.creativeai.adapter.output.persistence.entity

import java.time.LocalDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

/** R2DBC 엔티티: 창작물 (Creations) 테이블 */
@Table("creations")
data class CreationEntity(
        @Id val id: Long? = null,
        val userId: Long,
        val creationType: String, // emoji, avatar 등
        val styleId: Int? = null,
        val title: String? = null,
        val description: String? = null,
        val prompt: String? = null,
        val status: String, // pending, processing, completed, failed
        val progress: Int = 0,
        val creditCost: Int = 0,
        val metadata: String? = null, // JSON 문자열
        val processingStartedAt: LocalDateTime? = null,
        val processingCompletedAt: LocalDateTime? = null,
        val createdAt: LocalDateTime = LocalDateTime.now(),
        val updatedAt: LocalDateTime = LocalDateTime.now()
)

/** R2DBC 엔티티: 창작물 파일 (Creation Files) 테이블 */
@Table("creation_files")
data class CreationFileEntity(
        @Id val id: Long? = null,
        val creationId: Long,
        val fileType: String, // original_image, result_image, thumbnail, intermediate
        val variationIndex: Int? = null,
        val filePath: String,
        val fileUrl: String,
        val thumbnailUrl: String? = null,
        val fileSize: Long? = null,
        val mimeType: String? = null,
        val width: Int? = null,
        val height: Int? = null,
        val isPrimary: Boolean = false,
        val createdAt: LocalDateTime = LocalDateTime.now()
)
