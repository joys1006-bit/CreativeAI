package com.creativeai.adapter.output.persistence

import com.creativeai.application.port.out.*
import com.creativeai.domain.settlement.CreatorEarning
import com.creativeai.domain.settlement.MarketplaceOrder
import com.creativeai.domain.settlement.Settlement
import com.creativeai.domain.settlement.UserSubscription
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Component
class SettlementPersistenceAdapter(
        private val orderRepository: MarketplaceOrderR2dbcRepository,
        private val earningRepository: CreatorEarningR2dbcRepository,
        private val settlementRepository: SettlementR2dbcRepository,
        private val subscriptionRepository: UserSubscriptionR2dbcRepository
) :
        MarketplaceOrderRepository,
        CreatorEarningRepository,
        SettlementRepository,
        UserSubscriptionRepository {

    override fun save(order: MarketplaceOrder): Mono<MarketplaceOrder> {
        return orderRepository.save(MarketplaceOrderEntity.fromDomain(order)).map { it.toDomain() }
    }

    override fun findById(id: Long): Mono<MarketplaceOrder> {
        return orderRepository.findById(id).map { it.toDomain() }
    }

    override fun findByBuyerId(buyerId: Long): Flux<MarketplaceOrder> {
        return orderRepository.findByBuyerId(buyerId).map { it.toDomain() }
    }

    override fun save(earning: CreatorEarning): Mono<CreatorEarning> {
        return earningRepository.save(CreatorEarningEntity.fromDomain(earning)).map {
            it.toDomain()
        }
    }

    override fun findByCreatorId(creatorId: Long): Flux<CreatorEarning> {
        return earningRepository.findByCreatorId(creatorId).map { it.toDomain() }
    }

    override fun findPendingEarnings(): Flux<CreatorEarning> {
        return earningRepository.findEligibleEarnings().map { it.toDomain() }
    }

    override fun save(settlement: Settlement): Mono<Settlement> {
        // SettlementEntity 구현 필요 (추후 생략 가능)
        return Mono.empty()
    }

    override fun findSettlementsByCreatorId(creatorId: Long): Flux<Settlement> {
        return settlementRepository.findByCreatorId(creatorId).map {
            // SettlementEntity to Domain mapping 필요 -> 이제 toDomain() 사용 가능
            it.toDomain()
        }
    }

    override fun save(subscription: UserSubscription): Mono<UserSubscription> {
        // SubscriptionEntity 구현 필요
        return Mono.empty()
    }

    override fun findByUserId(userId: Long): Mono<UserSubscription> {
        return subscriptionRepository.findByUserId(userId).map {
            // SubscriptionEntity to Domain mapping 필요
            UserSubscription(
                    userId = userId,
                    startsAt = java.time.LocalDateTime.now(),
                    endsAt = java.time.LocalDateTime.now()
            )
        }
    }
}
