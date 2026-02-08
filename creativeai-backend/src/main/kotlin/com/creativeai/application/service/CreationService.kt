package com.creativeai.application.service

/** 창작물 통합 서비스 모든 종류의 창작물(Emoji, Avatar, Photo 등)에 대한 조회 및 관리 */
import com.creativeai.adapter.output.persistence.CreationEntity
import com.creativeai.adapter.output.persistence.CreationFileR2dbcRepository
import com.creativeai.adapter.output.persistence.CreationR2dbcRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux

@Service
class CreationService {
    @Autowired lateinit var creationRepository: CreationR2dbcRepository
    @Autowired lateinit var creationFileRepository: CreationFileR2dbcRepository

    /** 특정 사용자의 창작물 목록 조회 */
    fun getUserCreations(userId: Long): Flux<CreationEntity> {
        return creationRepository.findByUserId(userId)
    }

    /** 인기 창작물 조회 (이미지 포함) */
    fun getPopularCreations(): Flux<Pair<CreationEntity, String?>> {
        return creationRepository.findAll().filter { it.status == "completed" }.take(10).flatMap {
                creation ->
            creationFileRepository
                    .findByCreationId(creation.id!!)
                    .filter { it.fileType == "result_image" || it.fileType == "thumbnail" }
                    .next()
                    .map { file -> Pair(creation, file.fileUrl as String?) }
                    .defaultIfEmpty(Pair(creation, null as String?))
        }
    }

    /** 마켓플레이스 창작물 조회 */
    fun getMarketplaceCreations(): Flux<Pair<CreationEntity, String?>> {
        return creationRepository.findByIsForSaleTrue().take(10).flatMap { creation ->
            creationFileRepository
                    .findByCreationId(creation.id!!)
                    .filter { it.fileType == "result_image" || it.fileType == "thumbnail" }
                    .next()
                    .map { file -> Pair(creation, file.fileUrl as String?) }
                    .defaultIfEmpty(Pair(creation, null as String?))
        }
    }
}
