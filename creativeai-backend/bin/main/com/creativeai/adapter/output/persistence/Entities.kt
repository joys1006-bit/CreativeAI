package com.creativeai.adapter.output.persistence

import java.time.LocalDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

/** R2DBC Entity: styles 테이블 */
@Table("styles")
data class StyleEntity(
        @Id val id: Long? = null,
        val name: String,
        val category: String,
        val description: String? = null,
        val emoji: String? = null,
        @Column("configuration") val configuration: String? = null, // JSON
        @Column("is_active") val isActive: Boolean = true,
        @Column("sort_order") val sortOrder: Int = 0,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

/** R2DBC Entity: users 테이블 */
@Table("users")
data class UserEntity(
        @Id val id: Long? = null,
        val username: String,
        val email: String,
        @Column("password_hash") val passwordHash: String? = null,
        val credits: Int = 100,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

/** R2DBC Entity: creations 테이블 */
@Table("creations")
data class CreationEntity(
        @Id val id: Long? = null,
        @Column("user_id") val userId: Long,
        @Column("style_id") val styleId: Long,
        val type: String, // emoji, avatar, filter
        val status: String, // pending, processing, completed, failed
        @Column("input_data") val inputData: String? = null, // JSON
        val prompt: String? = null,
        @Column("error_message") val errorMessage: String? = null,
        @Column("credits_used") val creditsUsed: Int = 0,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
        @Column("completed_at") val completedAt: LocalDateTime? = null
)

/** R2DBC Entity: creation_files 테이블 */
@Table("creation_files")
data class CreationFileEntity(
        @Id val id: Long? = null,
        @Column("creation_id") val creationId: Long,
        @Column("file_url") val fileUrl: String,
        @Column("thumbnail_url") val thumbnailUrl: String? = null,
        @Column("file_type") val fileType: String = "image/png",
        @Column("file_size") val fileSize: Long = 0,
        @Column("is_primary") val isPrimary: Boolean = false,
        @Column("created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)
