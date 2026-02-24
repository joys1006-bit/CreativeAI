package com.creativeai.adapter.output.persistence

import com.creativeai.domain.settlement.*
import java.math.BigDecimal
import java.time.LocalDateTime
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table

@Table("marketplace_orders")
data class MarketplaceOrderEntity(
        @Id val id: Long? = null,
        val buyerId: Long,
        val creationId: Long,
        val amount: BigDecimal,
        val status: String,
        val paymentMethod: String?,
        val createdAt: LocalDateTime,
        val updatedAt: LocalDateTime
) {
        fun toDomain() =
                MarketplaceOrder(
                        id = id,
                        buyerId = buyerId,
                        creationId = creationId,
                        amount = amount,
                        status = OrderStatus.valueOf(status),
                        paymentMethod = paymentMethod,
                        createdAt = createdAt,
                        updatedAt = updatedAt
                )

        companion object {
                fun fromDomain(order: MarketplaceOrder) =
                        MarketplaceOrderEntity(
                                id = order.id,
                                buyerId = order.buyerId,
                                creationId = order.creationId,
                                amount = order.amount,
                                status = order.status.name,
                                paymentMethod = order.paymentMethod,
                                createdAt = order.createdAt,
                                updatedAt = order.updatedAt
                        )
        }
}

@Table("creator_earnings")
data class CreatorEarningEntity(
        @Id val id: Long? = null,
        val creatorId: Long,
        val orderId: Long,
        val totalAmount: BigDecimal,
        val commissionRate: BigDecimal,
        val netEarning: BigDecimal,
        val status: String,
        val availableAt: LocalDateTime?,
        val createdAt: LocalDateTime
) {
        fun toDomain() =
                CreatorEarning(
                        id = id,
                        creatorId = creatorId,
                        orderId = orderId,
                        totalAmount = totalAmount,
                        commissionRate = commissionRate,
                        netEarning = netEarning,
                        status = EarningStatus.valueOf(status),
                        availableAt = availableAt,
                        createdAt = createdAt
                )

        companion object {
                fun fromDomain(earning: CreatorEarning) =
                        CreatorEarningEntity(
                                id = earning.id,
                                creatorId = earning.creatorId,
                                orderId = earning.orderId,
                                totalAmount = earning.totalAmount,
                                commissionRate = earning.commissionRate,
                                netEarning = earning.netEarning,
                                status = earning.status.name,
                                availableAt = earning.availableAt,
                                createdAt = earning.createdAt
                        )
        }
}

@Table("settlements")
data class SettlementEntity(
        @Id val id: Long? = null,
        val creatorId: Long,
        val amount: BigDecimal,
        val status: String,
        val bankInfo: String?,
        val settledAt: LocalDateTime?,
        val createdAt: LocalDateTime
) {
        fun toDomain() =
                Settlement(
                        id = id,
                        creatorId = creatorId,
                        amount = amount,
                        status = SettlementStatus.valueOf(status),
                        bankInfo = bankInfo,
                        settledAt = settledAt,
                        createdAt = createdAt
                )

        companion object {
                fun fromDomain(settlement: Settlement) =
                        SettlementEntity(
                                id = settlement.id,
                                creatorId = settlement.creatorId,
                                amount = settlement.amount,
                                status = settlement.status.name,
                                bankInfo = settlement.bankInfo,
                                settledAt = settlement.settledAt,
                                createdAt = settlement.createdAt
                        )
        }
}

@Table("user_subscriptions")
data class UserSubscriptionEntity(
        @Id val id: Long? = null,
        val userId: Long,
        val tier: String,
        val startsAt: LocalDateTime,
        val endsAt: LocalDateTime,
        val isActive: Boolean
) {
        fun toDomain() =
                UserSubscription(
                        id = id,
                        userId = userId,
                        tier = SubscriptionTier.valueOf(tier),
                        startsAt = startsAt,
                        endsAt = endsAt,
                        isActive = isActive
                )

        companion object {
                fun fromDomain(subscription: UserSubscription) =
                        UserSubscriptionEntity(
                                id = subscription.id,
                                userId = subscription.userId,
                                tier = subscription.tier.name,
                                startsAt = subscription.startsAt,
                                endsAt = subscription.endsAt,
                                isActive = subscription.isActive
                        )
        }
}
