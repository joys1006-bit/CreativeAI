package com.creativeai.adapter.output.persistence

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

@Repository
interface CreationFileR2dbcRepository : ReactiveCrudRepository<CreationFileEntity, Long> {
    fun findByCreationId(creationId: Long): Flux<CreationFileEntity>
}
