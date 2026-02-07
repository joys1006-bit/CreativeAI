package com.creativeai.application.service

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.*
import javax.crypto.SecretKey
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

/**
 * ============================================ JWT 서비스 (JSON Web Token 관리)
 * ============================================
 *
 * 역할:
 * - Access Token 생성 및 검증
 * - Refresh Token 생성
 * - 토큰에서 사용자 정보 추출
 */
@Service
class JwtService {

    // JWT 설정값 (application.properties에서 주입)
    @Value("\${jwt.secret:creativeai-super-secret-key-for-jwt-token-2024-minimum-256-bits}")
    private lateinit var jwtSecret: String

    @Value("\${jwt.access-token-expiry:900000}") // 기본값: 15분 (밀리초)
    private var accessTokenExpiry: Long = 900000

    @Value("\${jwt.refresh-token-expiry:604800000}") // 기본값: 7일 (밀리초)
    private var refreshTokenExpiry: Long = 604800000

    /** 서명에 사용할 비밀 키 생성 */
    private fun getSigningKey(): SecretKey {
        val keyBytes = jwtSecret.toByteArray(StandardCharsets.UTF_8)
        return Keys.hmacShaKeyFor(keyBytes)
    }

    /**
     * Access Token 생성
     *
     * @param userId 사용자 ID
     * @param email 사용자 이메일
     * @param username 사용자 이름
     * @return JWT Access Token 문자열
     */
    fun generateAccessToken(userId: Long, email: String, username: String): String {
        val now = Date()
        val expiryDate = Date(now.time + accessTokenExpiry)

        return Jwts.builder()
                .subject(userId.toString()) // subject: 사용자 ID
                .claim("email", email) // 추가 클레임: 이메일
                .claim("username", username) // 추가 클레임: 사용자명
                .claim("type", "access") // 토큰 타입
                .issuedAt(now) // 발급 시간
                .expiration(expiryDate) // 만료 시간
                .signWith(getSigningKey()) // 서명
                .compact()
    }

    /**
     * Refresh Token 생성
     *
     * @param userId 사용자 ID
     * @return JWT Refresh Token 문자열
     */
    fun generateRefreshToken(userId: Long): String {
        val now = Date()
        val expiryDate = Date(now.time + refreshTokenExpiry)

        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "refresh")
                .claim("random", UUID.randomUUID().toString()) // 고유성 보장
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact()
    }

    /** 토큰에서 사용자 ID 추출 */
    fun getUserIdFromToken(token: String): Long? {
        return try {
            val claims = parseToken(token)
            claims.subject.toLongOrNull()
        } catch (e: Exception) {
            null
        }
    }

    /** 토큰에서 이메일 추출 */
    fun getEmailFromToken(token: String): String? {
        return try {
            val claims = parseToken(token)
            claims["email"] as? String
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 토큰 유효성 검증
     *
     * @param token JWT 토큰
     * @return 유효하면 true
     */
    fun validateToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            !claims.expiration.before(Date()) // 만료되지 않았으면 유효
        } catch (e: Exception) {
            false
        }
    }

    /** Access Token인지 확인 */
    fun isAccessToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            claims["type"] == "access"
        } catch (e: Exception) {
            false
        }
    }

    /** Refresh Token인지 확인 */
    fun isRefreshToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            claims["type"] == "refresh"
        } catch (e: Exception) {
            false
        }
    }

    /** 토큰 파싱 (내부 메서드) */
    private fun parseToken(token: String): Claims {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).payload
    }

    /** Refresh Token 해시 생성 (DB 저장용) SHA-256 해시 사용 */
    fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(token.toByteArray(StandardCharsets.UTF_8))
        return Base64.getEncoder().encodeToString(hashBytes)
    }
}
