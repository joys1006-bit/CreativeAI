package com.creativeai.application.service

import com.creativeai.application.port.input.OrderUseCase
import com.creativeai.application.port.input.SettlementUseCase
import com.creativeai.application.port.out.*
import com.creativeai.domain.settlement.*
import java.math.BigDecimal
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
class SettlementService(
        private val orderRepository: MarketplaceOrderRepository,
        private val earningRepository: CreatorEarningRepository,
        private val settlementRepository: SettlementRepository,
        private val subscriptionRepository: UserSubscriptionRepository,
        private val creationRepository: CreationRepository // 기존 작품 정보 조회를 위해 필요
) : OrderUseCase, SettlementUseCase {

        private val domainService = SettlementDomainService()

        @Transactional
        override fun placeOrder(
                buyerId: Long,
                creationId: Long,
                amount: BigDecimal
        ): Mono<MarketplaceOrder> {
                val order =
                        MarketplaceOrder(
                                buyerId = buyerId,
                                creationId = creationId,
                                amount = amount,
                                status = OrderStatus.COMPLETED // 단순화하여 바로 완료 처리
                        )

                return orderRepository.save(order).flatMap { savedOrder ->
                        // 작품 소유자(크리에이터) 정보 조회 및 수익 생성
                        creationRepository
                                .findById(creationId)
                                .flatMap { creation ->
                                        subscriptionRepository
                                                .findByUserId(creation.userId)
                                                .map { it as UserSubscription? }
                                                .defaultIfEmpty(null)
                                                .flatMap { subscription ->
                                                        val earning =
                                                                domainService
                                                                        .createEarningFromOrder(
                                                                                savedOrder,
                                                                                creation.userId,
                                                                                subscription
                                                                        )
                                                        earningRepository.save(earning)
                                                }
                                }
                                .thenReturn(savedOrder)
                }
        }

        override fun getCreatorEarnings(creatorId: Long): Flux<CreatorEarning> {
                return earningRepository.findByCreatorId(creatorId)
        }

        @Transactional
        override fun requestSettlement(creatorId: Long, bankInfo: String): Mono<Settlement> {
                return earningRepository
                        .findByCreatorId(creatorId)
                        .filter { it.status == EarningStatus.ELIGIBLE }
                        .collectList()
                        .flatMap { earnings ->
                                if (earnings.isEmpty())
                                        return@flatMap Mono.error(
                                                IllegalStateException(
                                                        "No eligible earnings for settlement"
                                                )
                                        )

                                val totalAmount = earnings.sumOf { it.netEarning }
                                val settlement =
                                        Settlement(
                                                creatorId = creatorId,
                                                amount = totalAmount,
                                                bankInfo = bankInfo,
                                                status = SettlementStatus.REQUESTED
                                        )

                                settlementRepository.save(settlement).flatMap { savedSettlement ->
                                        // 정산 대상 수익들의 상태 변경
                                        Flux.fromIterable(earnings)
                                                .flatMap { earning ->
                                                        earningRepository.save(
                                                                earning.copy(
                                                                        status =
                                                                                EarningStatus
                                                                                        .SETTLED
                                                                )
                                                        )
                                                }
                                                .then(Mono.just(savedSettlement))
                                }
                        }
        }

        override fun getSettlementHistory(creatorId: Long): Flux<Settlement> {
                return settlementRepository.findSettlementsByCreatorId(creatorId)
        }
}

// sumOf for BigDecimal helper
private fun List<CreatorEarning>.sumOf(selector: (CreatorEarning) -> BigDecimal): BigDecimal {
        var sum = BigDecimal.ZERO
        for (element in this) {
                sum = sum.add(selector(element))
        }
        return sum
}
