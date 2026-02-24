package com.creativeai.domain.settlement

import java.math.BigDecimal
import java.time.LocalDateTime

/** 정산 도메인 서비스 주문 처리와 수익 계산의 핵심 비즈니스 로직을 담당합니다. */
class SettlementDomainService {

    /** 주문 완료 시 크리에이터의 수익을 계산하여 엔티티를 생성합니다. */
    fun createEarningFromOrder(
            order: MarketplaceOrder,
            creatorId: Long,
            subscription: UserSubscription?
    ): CreatorEarning {
        val commissionRate = subscription?.getCommissionRate() ?: BigDecimal("30.0") // 기본 30%

        val totalAmount = order.amount
        val commission = totalAmount.multiply(commissionRate).divide(BigDecimal("100"))
        val netEarning = totalAmount.subtract(commission)

        return CreatorEarning(
                creatorId = creatorId,
                orderId = order.id ?: 0L,
                totalAmount = totalAmount,
                commissionRate = commissionRate,
                netEarning = netEarning,
                status = EarningStatus.PENDING,
                availableAt = LocalDateTime.now().plusDays(7) // 7일 후 정산 가능 상태로 전환 예정
        )
    }
}
