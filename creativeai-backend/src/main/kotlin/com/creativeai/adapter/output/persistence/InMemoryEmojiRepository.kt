package com.creativeai.adapter.output.persistence

import com.creativeai.domain.emoji.Emoji
import com.creativeai.domain.emoji.EmojiRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.util.concurrent.ConcurrentHashMap

/**
 * 어댑터: In-Memory Repository 구현
 */
@Repository
class InMemoryEmojiRepository : EmojiRepository {
    
    private val storage = ConcurrentHashMap<String, Emoji>()
    
    override fun save(emoji: Emoji): Mono<Emoji> {
        return Mono.fromCallable {
            storage[emoji.id] = emoji
            emoji
        }
    }
    
    override fun findById(id: String): Mono<Emoji> {
        return Mono.justOrEmpty(storage[id])
    }
    
    override fun findAll(): Flux<Emoji> {
        return Flux.fromIterable(storage.values)
    }
    
    override fun delete(id: String): Mono<Void> {
        return Mono.fromRunnable {
            storage.remove(id)
        }
    }
}
