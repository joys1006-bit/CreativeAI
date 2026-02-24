package com.creativeai.adapter.output.persistence

import com.creativeai.application.port.out.CreationRepository
import com.creativeai.domain.creation.Creation
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class CreationPersistenceAdapter(private val creationRepository: CreationR2dbcRepository) :
        CreationRepository {

    override fun findById(id: Long): Mono<Creation> {
        return creationRepository.findById(id).map { it.toDomain() }
    }

    override fun save(creation: Creation): Mono<Creation> {
        return creationRepository.save(CreationEntity.fromDomain(creation)).map { it.toDomain() }
    }
}
