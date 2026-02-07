package com.creativeai.adapter.output.persistence

import com.creativeai.domain.avatar.Avatar
import com.creativeai.domain.avatar.AvatarRepository
import java.util.concurrent.ConcurrentHashMap
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/** In-Memory Avatar Repository */
// @Repository
class InMemoryAvatarRepository : AvatarRepository {

    private val storage = ConcurrentHashMap<String, Avatar>()

    override fun save(avatar: Avatar): Mono<Avatar> {
        return Mono.fromCallable {
            storage[avatar.id] = avatar
            avatar
        }
    }

    override fun findById(id: String): Mono<Avatar> {
        return Mono.justOrEmpty(storage[id])
    }

    override fun findAll(): Flux<Avatar> {
        return Flux.fromIterable(storage.values)
    }

    override fun delete(id: String): Mono<Void> {
        return Mono.fromRunnable { storage.remove(id) }
    }
}
