package com.creativeai.adapter.output.persistence

import com.creativeai.domain.avatar.Avatar
import com.creativeai.domain.avatar.AvatarRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.transaction.reactive.TransactionalOperator
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/** Avatar 도메인 영속성 어댑터 */
@Component
class PersistenceAvatarAdapter : AvatarRepository {
    @Autowired lateinit var creationRepository: CreationR2dbcRepository
    @Autowired lateinit var fileRepository: CreationFileR2dbcRepository
    @Autowired lateinit var transactionalOperator: TransactionalOperator

    override fun save(avatar: Avatar): Mono<Avatar> {
        // TEMPORARY STUB: Commented out to fix build error
        return Mono.just(avatar)
    }

    override fun findById(id: String): Mono<Avatar> {
        return Mono.empty()
    }

    override fun findAll(): Flux<Avatar> {
        return Flux.empty()
    }

    override fun delete(id: String): Mono<Void> {
        return Mono.empty()
    }
}
