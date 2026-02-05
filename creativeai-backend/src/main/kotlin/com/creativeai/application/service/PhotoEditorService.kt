package com.creativeai.application.service

/** 사진 편집 서비스 이미지 자르기, 필터 적용 등의 기능 제공 */
import com.creativeai.adapter.output.persistence.CreationR2dbcRepository
import com.creativeai.adapter.output.persistence.entity.CreationEntity
import java.time.LocalDateTime
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Mono

/** 사진 편집 서비스 이미지 자르기, 필터 적용 등의 기능 제공 */
@Service
class PhotoEditorService {
        @Autowired lateinit var creationRepository: CreationR2dbcRepository

        /** 이미지 편집 요청 처리 */
        @Transactional
        fun editPhoto(
                imageData: String,
                operation: String,
                params: Map<String, Any>
        ): Mono<CreationEntity> {
                // 1. 작업 기록 생성
                val creation =
                        CreationEntity(
                                userId = 1L, // 임시 사용자 ID
                                creationType = "photo_edit",
                                title = "사진 편집: $operation",
                                status = "processing",
                                metadata = params.toString(),
                                createdAt = LocalDateTime.now(),
                                updatedAt = LocalDateTime.now()
                        )

                return creationRepository.save(creation).flatMap { savedCreation ->
                        // 2. 이미지 처리 시뮬레이션 (비동기)
                        // 실제로는 여기서 이미지 처리 라이브러리 등을 호출
                        Mono.just(savedCreation)
                                .map {
                                        it.copy(
                                                status = "completed",
                                                processingCompletedAt = LocalDateTime.now(),
                                                metadata = it.metadata + " [Processed]"
                                        )
                                }
                                .flatMap { completedCreation ->
                                        creationRepository.save(completedCreation)
                                }
                }
        }
}
