package com.creativeai.domain.settlement

import java.math.BigDecimal
import java.time.LocalDateTime

/** 마켓플레이스 주문 엔티티 */
data class MarketplaceOrder(
        val id: Long? = null,
        val buyerId: Long,
        val creationId: Long,
        val amount: BigDecimal,
        val status: OrderStatus = OrderStatus.PENDING,
        val paymentMethod: String? = null,
        val createdAt: LocalDateTime = LocalDateTime.now(),
        val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class OrderStatus {
    PENDING,
    COMPLETED,
    CANCELLED
}

/** 크리에이터 수익 엔티티 */
data class CreatorEarning(
        val id: Long? = null,
        val creatorId: Long,
        val orderId: Long,
        val totalAmount: BigDecimal,
        val commissionRate: BigDecimal,
        val netEarning: BigDecimal,
        val status: EarningStatus = EarningStatus.PENDING,
        val availableAt: LocalDateTime? = null,
        val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun calculateNetEarning(): BigDecimal {
        val commission = totalAmount.multiply(commissionRate).divide(BigDecimal("100"))
        return totalAmount.subtract(commission)
    }
}

enum class EarningStatus {
    PENDING,
    ELIGIBLE,
    SETTLED
}

/** 실제 정산 집행 엔티티 */
data class Settlement(
        val id: Long? = null,
        val creatorId: Long,
        val amount: BigDecimal,
        val status: SettlementStatus = SettlementStatus.REQUESTED,
        val bankInfo: String? = null, // JSON string or specific object
        val settledAt: LocalDateTime? = null,
        val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class SettlementStatus {
    REQUESTED,
    PROCESSING,
    COMPLETED,
    FAILED
}

/** 사용자 멤버십 구독 엔티티 */
data class UserSubscription(
        val id: Long? = null,
        val userId: Long,
        val tier: SubscriptionTier = SubscriptionTier.BASIC,
        val startsAt: LocalDateTime,
        val endsAt: LocalDateTime,
        val isActive: Boolean = true
) {
    /** 등급별 플랫폼 수수료율 반환 */
    fun getCommissionRate(): BigDecimal =
            when (tier) {
                SubscriptionTier.BASIC -> BigDecimal("30.0")
                SubscriptionTier.PREMIUM -> BigDecimal("15.0")
                SubscriptionTier.PRO -> BigDecimal("5.0")
            }
}

enum class SubscriptionTier {
    BASIC,
    PREMIUM,
    PRO
}
