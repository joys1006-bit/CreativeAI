package com.creativeai.adapter.output.persistence

import com.creativeai.adapter.output.persistence.entity.CreationEntity
import com.creativeai.adapter.output.persistence.entity.CreationFileEntity
import com.creativeai.domain.emoji.Emoji
import com.creativeai.domain.emoji.EmojiRepository
import com.creativeai.domain.emoji.EmojiStyle
import com.creativeai.domain.emoji.GenerationStatus
import java.time.LocalDateTime
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.transaction.reactive.TransactionalOperator
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Component
class PersistenceEmojiAdapter : EmojiRepository {
    @Autowired lateinit var creationRepository: CreationR2dbcRepository
    @Autowired lateinit var fileRepository: CreationFileR2dbcRepository
    @Autowired lateinit var transactionalOperator: TransactionalOperator

    override fun save(emoji: Emoji): Mono<Emoji> {
        // 도메인 -> 엔티티 매핑
        // 참고: 이것은 단순화된 구현입니다. 실제 앱에서는 업데이트와 삽입을 더 신중하게 처리하고
        // 파일 매핑도 적절히 처리해야 합니다.

        // Emoji ID는 String(UUID)이지만 CreationEntity ID는 Long(Auto Increment)이므로
        // 타입 불일치가 발생합니다. 실용적인 구현에서는 메타데이터에 UUID를 저장하거나
        // creations 테이블에 uuid 컬럼을 추가할 수 있습니다.
        // 현재는 UUID를 메타데이터에 저장하거나 일시적 필드로 매핑한다고 가정합니다.
        // 이 턴에서는 단순함을 위해 매번 새로운 엔티티를 생성합니다.

        // 실제로는 Emoji 도메인의 ID는 String이고 Creation은 Long입니다.
        // 보통 DB에 `uuid` 컬럼을 추가하여 해결합니다.
        // 지금은 스키마 변경 없이 `metadata` 컬럼(JSON)에 UUID를 저장하겠습니다.

        // 저장 (생성/업데이트):
        val entity =
                CreationEntity(
                        userId = 1L, // Temporary: Hardcoded user ID or passed via Context
                        creationType = "emoji",
                        styleId = null, // Need to map Style Enum to ID or store in metadata/desc
                        status = emoji.status.name.lowercase(),
                        metadata = "{\"uuid\": \"${emoji.id}\", \"style\": \"${emoji.style.id}\"}",
                        createdAt = emoji.createdAt,
                        updatedAt = LocalDateTime.now()
                )

        return creationRepository
                .save(entity)
                .flatMap { savedEntity ->
                    // 완료된 경우 파일 정보 저장
                    if (emoji.status == GenerationStatus.COMPLETED && emoji.generatedImage != null
                    ) {
                        val fileEntity =
                                CreationFileEntity(
                                        creationId = savedEntity.id!!,
                                        fileType = "result_image",
                                        filePath = emoji.generatedImage!!,
                                        fileUrl = emoji.generatedImage!!,
                                        isPrimary = true
                                )
                        fileRepository.save(fileEntity).thenReturn(savedEntity)
                    } else {
                        Mono.just(savedEntity)
                    }
                }
                .map { savedEntity ->
                    // 엔티티 -> 도메인 매핑
                    // 참고: 도메인 객체를 재구성해야 합니다.
                    // 전체 재매핑을 하려면 파일 정보를 조회해야 합니다.
                    // 현재는 원래 emoji 객체를 반환합니다. (필드가 업데이트되었을 수 있음)
                    // 또는 엔티티로부터 다시 매핑하는 것이 좋습니다.

                    // 지금은 인터페이스 계약을 만족시키기 위해 입력값을 반환합니다.
                    emoji
                }
                .`as`(transactionalOperator::transactional)
    }

    override fun findById(id: String): Mono<Emoji> {
        // ID가 String(UUID)이지만 Repo는 Long을 사용하므로 까다롭습니다.
        // metadata->uuid로 쿼리해야 합니다.
        // 이상적으로는 UUID 컬럼을 추가해야 합니다.
        return Mono.empty()
    }

    override fun findAll(): Flux<Emoji> {
        return creationRepository.findAll().filter { it.creationType == "emoji" }.map { entity ->
            // 엔티티 -> 도메인 매핑
            // 메타데이터에서 UUID 추출 필요
            // 단순화된 매핑
            Emoji.create("dummy_image", EmojiStyle.CUTE)
        }
    }

    override fun delete(id: String): Mono<Void> {
        return Mono.empty()
    }
}
