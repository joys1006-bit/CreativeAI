package com.creativeai.adapter.output.persistence

import com.creativeai.adapter.output.persistence.entity.CreationEntity
import com.creativeai.adapter.output.persistence.entity.CreationFileEntity
import com.creativeai.adapter.output.persistence.repository.CreationFileR2dbcRepository
import com.creativeai.adapter.output.persistence.repository.CreationR2dbcRepository
import com.creativeai.domain.avatar.Avatar
import com.creativeai.domain.avatar.AvatarRepository
import com.creativeai.domain.avatar.AvatarStyle
import com.creativeai.domain.avatar.GenerationStatus
import java.time.LocalDateTime
import org.springframework.stereotype.Component
import org.springframework.transaction.reactive.TransactionalOperator
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/** Avatar 도메인 영속성 어댑터 */
@Component
class PersistenceAvatarAdapter(
        private val creationRepository: CreationR2dbcRepository,
        private val fileRepository: CreationFileR2dbcRepository,
        private val transactionalOperator: TransactionalOperator
) : AvatarRepository {

    override fun save(avatar: Avatar): Mono<Avatar> {
        // 도메인 -> 엔티티 매핑
        val entity =
                CreationEntity(
                        userId = 1L, // 임시: 하드코딩된 사용자 ID
                        creationType = "avatar",
                        styleId = null,
                        status = avatar.status.name.lowercase(),
                        metadata =
                                "{\"uuid\": \"${avatar.id}\", \"style\": \"${avatar.style.id}\"}",
                        createdAt = avatar.createdAt,
                        updatedAt = LocalDateTime.now()
                )

        return creationRepository
                .save(entity)
                .flatMap { savedEntity ->
                    // 완료 시 파일 저장
                    if (avatar.status == GenerationStatus.COMPLETED && avatar.generatedImage != null
                    ) {
                        val fileEntity =
                                CreationFileEntity(
                                        creationId = savedEntity.id!!,
                                        fileType = "result_image",
                                        filePath = avatar.generatedImage!!,
                                        fileUrl = avatar.generatedImage!!,
                                        isPrimary = true
                                )
                        fileRepository.save(fileEntity).thenReturn(savedEntity)
                    } else {
                        Mono.just(savedEntity)
                    }
                }
                .map {
                    // 엔티티 -> 도메인 매핑 (입력값 반환)
                    avatar
                }
                .`as`(transactionalOperator::transactional)
    }

    override fun findById(id: String): Mono<Avatar> {
        // 실제 구현에서는 메타데이터의 UUID로 조회해야 함
        return Mono.empty()
    }

    override fun findAll(): Flux<Avatar> {
        return creationRepository.findAll().filter { it.creationType == "avatar" }.map {
            // 단순 매핑
            Avatar.create("dummy_image", AvatarStyle.ANIME)
        }
    }

    override fun delete(id: String): Mono<Void> {
        return Mono.empty()
    }
}
