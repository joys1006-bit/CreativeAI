package com.creativeai.domain.avatar

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Avatar 도메인 모델 단위 테스트
 */
class AvatarTest {
    
    @Test
    fun `아바타를 유효한 데이터로 생성할 수 있다`() {
        // given
        val imageData = "base64_image_data"
        val style = AvatarStyle.ANIME
        
        // when
        val avatar = Avatar.create(imageData, style)
        
        // then
        assertEquals(imageData, avatar.imageData)
        assertEquals(style, avatar.style)
        assertEquals(GenerationStatus.PENDING, avatar.status)
    }
    
    @Test
    fun `빈 이미지 데이터로는 아바타를 생성할 수 없다`() {
        // given
        val emptyImageData = ""
        val style = AvatarStyle.THREE_D
        
        // when & then
        assertThrows<IllegalArgumentException> {
            Avatar.create(emptyImageData, style)
        }
    }
    
    @Test
    fun `PENDING 상태에서 처리를 시작할 수 있다`() {
        // given
        val avatar = Avatar.create("image_data", AvatarStyle.PIXEL)
        
        // when
        avatar.startProcessing()
        
        // then
        assertEquals(GenerationStatus.PROCESSING, avatar.status)
    }
    
    @Test
    fun `PROCESSING 상태에서 생성을 완료할 수 있다`() {
        // given
        val avatar = Avatar.create("image_data", AvatarStyle.CARTOON)
        avatar.startProcessing()
        val generatedImage = "generated_avatar"
        val variations = listOf("var1", "var2")
        
        // when
        avatar.completeGeneration(generatedImage, variations)
        
        // then
        assertEquals(GenerationStatus.COMPLETED, avatar.status)
        assertEquals(generatedImage, avatar.generatedImage)
        assertEquals(variations, avatar.variations)
        assertTrue(avatar.isCompleted())
    }
    
    @Test
    fun `PROCESSING 상태에서 생성을 실패할 수 있다`() {
        // given
        val avatar = Avatar.create("image_data", AvatarStyle.REALISTIC)
        avatar.startProcessing()
        val errorMessage = "Generation failed"
        
        // when
        avatar.failGeneration(errorMessage)
        
        // then
        assertEquals(GenerationStatus.FAILED, avatar.status)
        assertEquals(errorMessage, avatar.errorMessage)
        assertTrue(avatar.isFailed())
    }
    
    @Test
    fun `AvatarStyle은 id로 조회할 수 있다`() {
        // when
        val style = AvatarStyle.fromId("anime")
        
        // then
        assertEquals(AvatarStyle.ANIME, style)
    }
    
    @Test
    fun `존재하지 않는 스타일 id는 예외를 발생시킨다`() {
        // when & then
        assertThrows<IllegalArgumentException> {
            AvatarStyle.fromId("invalid_style")
        }
    }
    
    @Test
    fun `모든 스타일 목록을 조회할 수 있다`() {
        // when
        val styles = AvatarStyle.allStyles()
        
        // then
        assertEquals(6, styles.size)
        assertTrue(styles.contains(AvatarStyle.ANIME))
        assertTrue(styles.contains(AvatarStyle.FANTASY))
    }
}
