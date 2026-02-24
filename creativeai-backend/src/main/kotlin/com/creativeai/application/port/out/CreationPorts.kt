package com.creativeai.application.port.out

import com.creativeai.domain.creation.Creation
import reactor.core.publisher.Mono

interface CreationRepository {
    fun findById(id: Long): Mono<Creation>
    fun save(creation: Creation): Mono<Creation>
}
