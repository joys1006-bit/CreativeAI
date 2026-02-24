package com.creativeai.adapter.output.persistence

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

/** R2DBC Repository: styles */
@Repository
interface R2dbcStyleRepository : ReactiveCrudRepository<StyleEntity, Long> {
    fun findByCategory(category: String): Flux<StyleEntity>
    fun findByIsActiveTrue(): Flux<StyleEntity>
}

/** R2DBC Repository: creations */
@Repository
interface R2dbcCreationRepository : ReactiveCrudRepository<CreationEntity, Long> {
    fun findByUserId(userId: Long): Flux<CreationEntity>
    fun findByUserIdAndStatus(userId: Long, status: String): Flux<CreationEntity>
}

/** R2DBC Repository: creation_files */
@Repository
interface R2dbcCreationFileRepository : ReactiveCrudRepository<CreationFileEntity, Long> {
    fun findByCreationId(creationId: Long): Flux<CreationFileEntity>
}
