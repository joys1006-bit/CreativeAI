package com.creativeai.application.service

import com.creativeai.adapter.output.persistence.UserSubscriptionR2dbcRepository
import com.creativeai.domain.settlement.SubscriptionTier
import com.creativeai.domain.settlement.UserSubscription
import java.time.LocalDateTime
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

/**
 * ============================================ 구독 관리 서비스 (SubscriptionService)
 * ============================================
 *
 * 역할:
 * - 사용자 구독 정보 조회
 * - 구독 가입 및 업그레이드
 * - 구독 만료 상태 체크 및 비활성화
 */
@Service
class SubscriptionService(private val subscriptionRepository: UserSubscriptionR2dbcRepository) {

    /** 사용자의 현재 구독 정보 조회 (없으면 기본 BASIC 반환) */
    fun getUserSubscription(userId: Long): Mono<UserSubscription> {
        return subscriptionRepository
                .findByUserId(userId)
                .map { it.toDomain() }
                .defaultIfEmpty(
                        UserSubscription(
                                userId = userId,
                                tier = SubscriptionTier.BASIC,
                                startsAt = LocalDateTime.now(),
                                endsAt = LocalDateTime.now().plusYears(100), // 무제한
                                isActive = true
                        )
                )
    }

    /** 구독 가입/갱신 처리 */
    fun subscribe(
            userId: Long,
            tier: SubscriptionTier,
            durationMonths: Long
    ): Mono<UserSubscription> {
        val now = LocalDateTime.now()
        val endsAt = now.plusMonths(durationMonths)

        return subscriptionRepository
                .findByUserId(userId)
                .flatMap { existing ->
                    // 기존 구독이 있으면 업데이트
                    val updated =
                            existing.copy(
                                    tier = tier.name,
                                    startsAt = now,
                                    endsAt = endsAt,
                                    isActive = true
                            )
                    subscriptionRepository.save(updated)
                }
                .switchIfEmpty(
                        // 신규 구독 생성
                        Mono.defer {
                            val newSub =
                                    com.creativeai.adapter.output.persistence
                                            .UserSubscriptionEntity(
                                                    userId = userId,
                                                    tier = tier.name,
                                                    startsAt = now,
                                                    endsAt = endsAt,
                                                    isActive = true
                                            )
                            subscriptionRepository.save(newSub)
                        }
                )
                .map { it.toDomain() }
    }

    /** 구독 취소 (즉시 비활성화가 아닌, 다음 갱신 방지 설정 등) */
    fun cancelSubscription(userId: Long): Mono<Void> {
        return subscriptionRepository
                .findByUserId(userId)
                .flatMap { sub ->
                    val updated = sub.copy(isActive = false)
                    subscriptionRepository.save(updated)
                }
                .then()
    }
}
