package com.creativeai.domain.avatar

import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * DDD: Repository Interface (Port)
 */
interface AvatarRepository {
    fun save(avatar: Avatar): Mono<Avatar>
    fun findById(id: String): Mono<Avatar>
    fun findAll(): Flux<Avatar>
    fun delete(id: String): Mono<Void>
}
