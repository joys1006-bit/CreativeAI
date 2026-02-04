package com.creativeai.domain.emoji

import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * DDD: Repository Interface (Port)
 * 
 * 도메인 레이어의 인터페이스
 * 실제 구현은 어댑터 레이어에서
 */
interface EmojiRepository {
    fun save(emoji: Emoji): Mono<Emoji>
    fun findById(id: String): Mono<Emoji>
    fun findAll(): Flux<Emoji>
    fun delete(id: String): Mono<Void>
}
