package com.creativeai.application.service

/** 아바타 서비스 비즈니스 로직 및 트랜잭션 관리 */
import com.creativeai.application.port.output.AIModelPort
import com.creativeai.domain.avatar.Avatar
import com.creativeai.domain.avatar.AvatarRepository
import com.creativeai.domain.avatar.AvatarStyle
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/** 아바타 서비스 비즈니스 로직 및 트랜잭션 관리 */
@Service
class AvatarService {
    @Autowired lateinit var avatarRepository: AvatarRepository
    @Autowired lateinit var aiModelPort: AIModelPort

    /** 아바타 생성 요청 처리 */
    @Transactional
    fun generateAvatar(imageData: String, styleId: String): Mono<Avatar> {
        return Mono.defer {
            val style = AvatarStyle.fromId(styleId)
            val newAvatar = Avatar.create(imageData, style)

            // 1. 초기 상태 저장
            avatarRepository
                    .save(newAvatar)
                    .flatMap { savedAvatar ->
                        // 2. 프로세싱 시작
                        savedAvatar.startProcessing()
                        avatarRepository.save(savedAvatar)
                    }
                    .flatMap { processingAvatar ->
                        // 3. AI 모델 호출
                        aiModelPort
                                .generateAvatar(imageData, styleId)
                                .flatMap { result ->
                                    // 4. 완료 처리
                                    processingAvatar.completeGeneration(
                                            generatedImage = result.generatedImage,
                                            variations = result.variations
                                    )
                                    avatarRepository.save(processingAvatar)
                                }
                                .onErrorResume { e ->
                                    // 5. 실패 처리
                                    processingAvatar.failGeneration(e.message ?: "알 수 없는 오류")
                                    avatarRepository.save(processingAvatar)
                                }
                    }
        }
    }

    fun getAllAvatars(): Flux<Avatar> {
        return avatarRepository.findAll()
    }

    fun getAvatarById(id: String): Mono<Avatar> {
        return avatarRepository.findById(id)
    }
}
