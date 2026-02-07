package com.creativeai.adapter.output.persistence

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

@Repository
interface CreationR2dbcRepository : ReactiveCrudRepository<CreationEntity, Long> {
    fun findByUserId(userId: Long): Flux<CreationEntity>
    fun findByStatus(status: String): Flux<CreationEntity>
}
