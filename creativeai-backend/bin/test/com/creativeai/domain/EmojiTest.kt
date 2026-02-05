package com.creativeai.domain.emoji

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Emoji 도메인 모델 단위 테스트
 */
class EmojiTest {
    
    @Test
    fun `이모티콘을 유효한 데이터로 생성할 수 있다`() {
        // given
        val imageData = "base64_image_data"
        val style = EmojiStyle.KAKAO
        
        // when
        val emoji = Emoji.create(imageData, style)
        
        // then
        assertEquals(imageData, emoji.imageData)
        assertEquals(style, emoji.style)
        assertEquals(GenerationStatus.PENDING, emoji.status)
    }
    
    @Test
    fun `빈 이미지 데이터로는 이모티콘을 생성할 수 없다`() {
        // given
        val emptyImageData = ""
        val style = EmojiStyle.KAKAO
        
        // when & then
        assertThrows<IllegalArgumentException> {
            Emoji.create(emptyImageData, style)
        }
    }
    
    @Test
    fun `PENDING 상태에서 처리를 시작할 수 있다`() {
        // given
        val emoji = Emoji.create("image_data", EmojiStyle.LINE)
        
        // when
        emoji.startProcessing()
        
        // then
        assertEquals(GenerationStatus.PROCESSING, emoji.status)
    }
    
    @Test
    fun `PENDING이 아닌 상태에서는 처리를 시작할 수 없다`() {
        // given
        val emoji = Emoji.create("image_data", EmojiStyle.CUTE)
        emoji.startProcessing()
        
        // when & then
        assertThrows<IllegalArgumentException> {
            emoji.startProcessing()
        }
    }
    
    @Test
    fun `PROCESSING 상태에서 생성을 완료할 수 있다`() {
        // given
        val emoji = Emoji.create("image_data", EmojiStyle.MINIMAL)
        emoji.startProcessing()
        val generatedImage = "generated_emoji"
        val variations = listOf("var1", "var2", "var3")
        
        // when
        emoji.completeGeneration(generatedImage, variations)
        
        // then
        assertEquals(GenerationStatus.COMPLETED, emoji.status)
        assertEquals(generatedImage, emoji.generatedImage)
        assertEquals(variations, emoji.variations)
        assertTrue(emoji.isCompleted())
    }
    
    @Test
    fun `PROCESSING 상태에서 생성을 실패할 수 있다`() {
        // given
        val emoji = Emoji.create("image_data", EmojiStyle.THREE_D)
        emoji.startProcessing()
        val errorMessage = "AI service error"
        
        // when
        emoji.failGeneration(errorMessage)
        
        // then
        assertEquals(GenerationStatus.FAILED, emoji.status)
        assertEquals(errorMessage, emoji.errorMessage)
        assertTrue(emoji.isFailed())
    }
    
    @Test
    fun `PROCESSING이 아닌 상태에서는 완료할 수 없다`() {
        // given
        val emoji = Emoji.create("image_data", EmojiStyle.RETRO)
        
        // when & then
        assertThrows<IllegalArgumentException> {
            emoji.completeGeneration("result", emptyList())
        }
    }
    
    @Test
    fun `EmojiStyle은 id로 조회할 수 있다`() {
        // when
        val style = EmojiStyle.fromId("kakao")
        
        // then
        assertEquals(EmojiStyle.KAKAO, style)
    }
    
    @Test
    fun `존재하지 않는 스타일 id는 예외를 발생시킨다`() {
        // when & then
        assertThrows<IllegalArgumentException> {
            EmojiStyle.fromId("invalid_style")
        }
    }
    
    @Test
    fun `모든 스타일 목록을 조회할 수 있다`() {
        // when
        val styles = EmojiStyle.allStyles()
        
        // then
        assertEquals(6, styles.size)
        assertTrue(styles.contains(EmojiStyle.KAKAO))
        assertTrue(styles.contains(EmojiStyle.LINE))
    }
}
