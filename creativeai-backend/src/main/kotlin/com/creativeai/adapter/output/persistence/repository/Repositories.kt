package com.creativeai.adapter.output.persistence.repository

import com.creativeai.adapter.output.persistence.entity.CreationEntity
import com.creativeai.adapter.output.persistence.entity.CreationFileEntity
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux

interface CreationR2dbcRepository : ReactiveCrudRepository<CreationEntity, Long> {
    fun findByUserId(userId: Long): Flux<CreationEntity>
    fun findByStatus(status: String): Flux<CreationEntity>
}

interface CreationFileR2dbcRepository : ReactiveCrudRepository<CreationFileEntity, Long> {
    fun findByCreationId(creationId: Long): Flux<CreationFileEntity>
}
