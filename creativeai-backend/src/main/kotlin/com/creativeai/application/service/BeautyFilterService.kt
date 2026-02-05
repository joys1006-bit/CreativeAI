package com.creativeai.application.service

import com.creativeai.adapter.output.persistence.entity.CreationEntity
import com.creativeai.adapter.output.persistence.repository.CreationR2dbcRepository
import java.time.LocalDateTime
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Mono

/** 뷰티 필터 서비스 인물 사진 보정 및 미용 효과 적용 */
@Service
class BeautyFilterService(private val creationRepository: CreationR2dbcRepository) {

    /** 편명 보정 요청 처리 */
    @Transactional
    fun applyBeautyFilter(
            imageData: String,
            filterType: String,
            intensity: Int
    ): Mono<CreationEntity> {
        // 1. 작업 기록 생성
        val creation =
                CreationEntity(
                        userId = 1L, // 임시 사용자 ID
                        creationType = "beauty_filter",
                        title = "뷰티 필터: $filterType",
                        status = "processing",
                        metadata = "{\"filter\": \"$filterType\", \"intensity\": $intensity}",
                        createdAt = LocalDateTime.now(),
                        updatedAt = LocalDateTime.now()
                )

        return creationRepository.save(creation).flatMap { savedCreation ->
            // 2. AI 필터 처리 시뮬레이션
            Mono.just(savedCreation)
                    .map {
                        it.copy(
                                status = "completed",
                                processingCompletedAt = LocalDateTime.now(),
                                metadata = it.metadata + " [Beautified]"
                        )
                    }
                    .flatMap { completedCreation -> creationRepository.save(completedCreation) }
        }
    }
}
