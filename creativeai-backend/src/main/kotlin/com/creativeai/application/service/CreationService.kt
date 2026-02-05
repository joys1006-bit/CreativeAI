package com.creativeai.application.service

/** 창작물 통합 서비스 모든 종류의 창작물(Emoji, Avatar, Photo 등)에 대한 조회 및 관리 */
import com.creativeai.adapter.output.persistence.CreationR2dbcRepository
import com.creativeai.adapter.output.persistence.entity.CreationEntity
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux

@Service
class CreationService {
    @Autowired lateinit var creationRepository: CreationR2dbcRepository

    /** 특정 사용자의 창작물 목록 조회 */
    fun getUserCreations(userId: Long): Flux<CreationEntity> {
        return creationRepository.findByUserId(userId)
    }

    /**
     * 인기 창작물 조회 (시뮬레이션 implementation) 실제로는 좋아요 수, 조회수 등을 기준으로 해야 함 현재는 최근 생성된 완료 상태의 창작물 10개를
     * 반환하도록 구현
     */
    fun getPopularCreations(): Flux<CreationEntity> {
        // 실제 운영 환경에서는 별도의 인기 순위 테이블이나 복잡한 쿼리가 필요할 수 있음
        // 여기서는 예시로 status가 'completed'인 항목들을 가져옴
        return creationRepository
                .findByStatus("completed")
                .take(10) // 상위 10개만 제한 (R2DBC Query method에서 Limit을 지원하지 않는 경우 대비)
    }
}
