package com.creativeai.adapter.input.web

import com.creativeai.application.port.input.OrderUseCase
import com.creativeai.application.port.input.SettlementUseCase
import com.creativeai.domain.settlement.CreatorEarning
import com.creativeai.domain.settlement.MarketplaceOrder
import com.creativeai.domain.settlement.Settlement
import java.math.BigDecimal
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/marketplace")
class MarketplaceController(
        private val orderUseCase: OrderUseCase,
        private val settlementUseCase: SettlementUseCase
) {

        /** 작품 주문 생성 (구매) */
        @PostMapping("/orders")
        fun placeOrder(@RequestBody request: OrderRequest): Mono<MarketplaceOrder> {
                return orderUseCase.placeOrder(
                        buyerId = request.buyerId,
                        creationId = request.creationId,
                        amount = request.amount
                )
        }

        /** 크리에이터 수익 내역 조회 */
        @GetMapping("/earnings/{creatorId}")
        fun getEarnings(@PathVariable creatorId: Long): Flux<CreatorEarning> {
                return settlementUseCase.getCreatorEarnings(creatorId)
        }

        /** 정산 요청 */
        @PostMapping("/settlements")
        fun requestSettlement(@RequestBody request: SettlementRequest): Mono<Settlement> {
                return settlementUseCase.requestSettlement(
                        creatorId = request.creatorId,
                        bankInfo = request.bankInfo
                )
        }

        /** 정산 이력 조회 */
        @GetMapping("/settlements/{creatorId}")
        fun getSettlementHistory(@PathVariable creatorId: Long): Flux<Settlement> {
                return settlementUseCase.getSettlementHistory(creatorId)
        }
}

data class OrderRequest(val buyerId: Long, val creationId: Long, val amount: BigDecimal)

data class SettlementRequest(val creatorId: Long, val bankInfo: String)
