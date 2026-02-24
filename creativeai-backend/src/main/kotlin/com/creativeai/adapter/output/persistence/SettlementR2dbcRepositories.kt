package com.creativeai.adapter.output.persistence

import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface MarketplaceOrderR2dbcRepository : ReactiveCrudRepository<MarketplaceOrderEntity, Long> {
    fun findByBuyerId(buyerId: Long): Flux<MarketplaceOrderEntity>
}

interface CreatorEarningR2dbcRepository : ReactiveCrudRepository<CreatorEarningEntity, Long> {
    fun findByCreatorId(creatorId: Long): Flux<CreatorEarningEntity>

    @Query("SELECT * FROM creator_earnings WHERE status = 'ELIGIBLE'")
    fun findEligibleEarnings(): Flux<CreatorEarningEntity>
}

interface SettlementR2dbcRepository : ReactiveCrudRepository<SettlementEntity, Long> {
    fun findByCreatorId(creatorId: Long): Flux<SettlementEntity>
}

interface UserSubscriptionR2dbcRepository : ReactiveCrudRepository<UserSubscriptionEntity, Long> {
    fun findByUserId(userId: Long): Mono<UserSubscriptionEntity>
}
