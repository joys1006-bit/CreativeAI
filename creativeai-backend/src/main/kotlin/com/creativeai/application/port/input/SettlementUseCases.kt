package com.creativeai.application.port.input

import com.creativeai.domain.settlement.CreatorEarning
import com.creativeai.domain.settlement.MarketplaceOrder
import com.creativeai.domain.settlement.Settlement
import java.math.BigDecimal
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface OrderUseCase {
    fun placeOrder(buyerId: Long, creationId: Long, amount: BigDecimal): Mono<MarketplaceOrder>
}

interface SettlementUseCase {
    fun getCreatorEarnings(creatorId: Long): Flux<CreatorEarning>
    fun requestSettlement(creatorId: Long, bankInfo: String): Mono<Settlement>
    fun getSettlementHistory(creatorId: Long): Flux<Settlement>
}
