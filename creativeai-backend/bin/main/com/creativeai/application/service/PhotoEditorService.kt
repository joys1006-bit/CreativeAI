package com.creativeai.application.service

import com.creativeai.adapter.output.external.AiApiClient
import com.creativeai.adapter.output.persistence.CreationEntity
import com.creativeai.adapter.output.persistence.CreationFileEntity
import com.creativeai.adapter.output.persistence.CreationFileR2dbcRepository
import com.creativeai.adapter.output.persistence.CreationR2dbcRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Mono

@Service
class PhotoEditorService {
        @Autowired lateinit var creationRepository: CreationR2dbcRepository
        @Autowired lateinit var creationFileRepository: CreationFileR2dbcRepository
        @Autowired lateinit var aiApiClient: AiApiClient

        @Transactional
        fun editPhoto(
                imageData: String?,
                operation: String?,
                params: Map<String, Any>?
        ): Mono<CreationEntity> {
                val effectiveOperation = operation ?: "unknown"
                val effectiveParams = params ?: emptyMap()

                // 1. Creation 엔티티 생성
                val creation =
                        CreationEntity(
                                userId = 1L, // 임시 사용자 ID
                                creationType = "photo_editor",
                                status = "completed", // 시뮬레이션을 위해 즉시 완료 처리
                                progress = 100,
                                title = "AI Edited Photo",
                                prompt = effectiveOperation,
                                metadata = "params=$effectiveParams"
                        )

                return creationRepository.save(creation).flatMap { savedCreation ->
                        // 2. 실제 AI 처리 수행
                        val aiProcess =
                                when (effectiveOperation) {
                                        "remove_bg" -> aiApiClient.removeBackground(imageData ?: "")
                                        "enhance" -> aiApiClient.enhance(imageData ?: "")
                                        "upscale" -> aiApiClient.upscale(imageData ?: "")
                                        "style_transfer" ->
                                                aiApiClient.styleTransfer(
                                                        imageData ?: "",
                                                        effectiveParams["style"] as? String
                                                                ?: "artistic"
                                                )
                                        else ->
                                                Mono.error(
                                                        IllegalArgumentException(
                                                                "지원하지 않는 작업입니다: $effectiveOperation"
                                                        )
                                                )
                                }

                        aiProcess.flatMap { resultBase64 ->
                                // 시뮬레이션을 위해 picsum 이미지를 결과로 사용하던 부분을 실제 바이너리로 처리하거나,
                                // 여기서는 결과 데이터를 데이터베이스에 URL 형태로 저장 (실제 서비스에서는 S3 등에 업로드 후 URL 저장)
                                // 현재 데모 환경에서는 resultBase64 자체를 URL처럼 처리하거나 임시 파일로 취급
                                val resultFileUrl = "data:image/png;base64,$resultBase64"

                                val fileEntity =
                                        CreationFileEntity(
                                                creationId = savedCreation.id!!,
                                                fileType = "result_image",
                                                filePath = "memory", // 실제로는 저장 경로
                                                fileUrl = resultFileUrl,
                                                isPrimary = true
                                        )

                                creationFileRepository.save(fileEntity).thenReturn(savedCreation)
                        }
                }
        }
}
