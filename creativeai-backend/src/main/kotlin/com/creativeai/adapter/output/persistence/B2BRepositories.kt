package com.creativeai.adapter.output.persistence

import com.creativeai.domain.b2b.ApiKey
import com.creativeai.domain.b2b.Partner
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/** R2DBC Repository: partners */
@Repository
interface R2dbcPartnerRepository : ReactiveCrudRepository<PartnerEntity, Long> {
    fun findByUserId(userId: Long): Mono<PartnerEntity>
}

/** R2DBC Repository: api_keys */
@Repository
interface R2dbcApiKeyRepository : ReactiveCrudRepository<ApiKeyEntity, Long> {
    fun findByPartnerId(partnerId: Long): Flux<ApiKeyEntity>
    fun findByKeyString(keyString: String): Mono<ApiKeyEntity>
}

@org.springframework.data.relational.core.mapping.Table("partners")
data class PartnerEntity(
    @org.springframework.data.annotation.Id val id: Long? = null,
    @org.springframework.data.relational.core.mapping.Column("user_id") val userId: Long,
    @org.springframework.data.relational.core.mapping.Column("company_name") val companyName: String,
    @org.springframework.data.relational.core.mapping.Column("business_registration_number") val businessRegistrationNumber: String,
    val status: String,
    @org.springframework.data.relational.core.mapping.Column("created_at") val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

@org.springframework.data.relational.core.mapping.Table("api_keys")
data class ApiKeyEntity(
    @org.springframework.data.annotation.Id val id: Long? = null,
    @org.springframework.data.relational.core.mapping.Column("partner_id") val partnerId: Long,
    @org.springframework.data.relational.core.mapping.Column("key_string") val keyString: String,
    val name: String,
    @org.springframework.data.relational.core.mapping.Column("is_active") val isActive: Boolean = true,
    @org.springframework.data.relational.core.mapping.Column("expires_at") val expiresAt: java.time.LocalDateTime? = null,
    @org.springframework.data.relational.core.mapping.Column("created_at") val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)
