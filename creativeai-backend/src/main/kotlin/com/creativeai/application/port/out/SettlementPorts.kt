package com.creativeai.application.port.out

import com.creativeai.domain.settlement.CreatorEarning
import com.creativeai.domain.settlement.MarketplaceOrder
import com.creativeai.domain.settlement.Settlement
import com.creativeai.domain.settlement.UserSubscription
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface MarketplaceOrderRepository {
    fun save(order: MarketplaceOrder): Mono<MarketplaceOrder>
    fun findById(id: Long): Mono<MarketplaceOrder>
    fun findByBuyerId(buyerId: Long): Flux<MarketplaceOrder>
}

interface CreatorEarningRepository {
    fun save(earning: CreatorEarning): Mono<CreatorEarning>
    fun findByCreatorId(creatorId: Long): Flux<CreatorEarning>
    fun findPendingEarnings(): Flux<CreatorEarning>
}

interface SettlementRepository {
    fun save(settlement: Settlement): Mono<Settlement>
    fun findSettlementsByCreatorId(creatorId: Long): Flux<Settlement>
}

interface UserSubscriptionRepository {
    fun save(subscription: UserSubscription): Mono<UserSubscription>
    fun findByUserId(userId: Long): Mono<UserSubscription>
}
