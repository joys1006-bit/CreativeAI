package com.creativeai.domain.emoji

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * TDD: Emoji 도메인 모델 테스트
 * 
 * DDD 원칙:
 * - Emoji는 Aggregate Root
 * - EmojiStyle은 Value Object
 * - 도메인 로직은 엔티티 내부에 캡슐화
 */
class EmojiTest {
    
    @Test
    fun `should create emoji with valid data`() {
        // Given
        val imageData = "base64_encoded_image_data"
        val style = EmojiStyle.KAKAO
        
        // When
        val emoji = Emoji.create(imageData, style)
        
        // Then
        assertNotNull(emoji.id)
        assertEquals(imageData, emoji.imageData)
        assertEquals(style, emoji.style)
        assertEquals(GenerationStatus.PENDING, emoji.status)
        assertTrue(emoji.variations.isEmpty())
    }
    
    @Test
    fun `should not create emoji with empty image data`() {
        // Given
        val emptyImageData = ""
        val style = EmojiStyle.KAKAO
        
        // When & Then
        assertThrows<IllegalArgumentException> {
            Emoji.create(emptyImageData, style)
        }
    }
    
    @Test
    fun `should complete emoji generation with result`() {
        // Given
        val emoji = Emoji.create("image_data", EmojiStyle.LINE)
        val generatedImage = "generated_emoji_image"
        val variations = listOf("var1", "var2", "var3")
        
        // When
        emoji.completeGeneration(generatedImage, variations)
        
        // Then
        assertEquals(GenerationStatus.COMPLETED, emoji.status)
        assertEquals(generatedImage, emoji.generatedImage)
        assertEquals(variations, emoji.variations)
        assertNotNull(emoji.completedAt)
    }
    
    @Test
    fun `should fail emoji generation with error message`() {
        // Given
        val emoji = Emoji.create("image_data", EmojiStyle.CUTE)
        val errorMessage = "AI model failed"
        
        // When
        emoji.failGeneration(errorMessage)
        
        // Then
        assertEquals(GenerationStatus.FAILED, emoji.status)
        assertEquals(errorMessage, emoji.errorMessage)
        assertNotNull(emoji.completedAt)
    }
    
    @Test
    fun `should not complete already completed emoji`() {
        // Given
        val emoji = Emoji.create("image_data", EmojiStyle.MINIMAL)
        emoji.completeGeneration("result", emptyList())
        
        // When & Then
        assertThrows<IllegalStateException> {
            emoji.completeGeneration("another_result", emptyList())
        }
    }
    
    @Test
    fun `should start processing`() {
        // Given
        val emoji = Emoji.create("image_data", EmojiStyle.RETRO)
        
        // When
        emoji.startProcessing()
        
        // Then
        assertEquals(GenerationStatus.PROCESSING, emoji.status)
        assertNotNull(emoji.startedAt)
    }
}

class EmojiStyleTest {
    
    @Test
    fun `should create emoji style with valid data`() {
        // Given
        val id = "custom"
        val name = "Custom Style"
        val description = "A custom emoji style"
        
        // When
        val style = EmojiStyle(id, name, description)
        
        // Then
        assertEquals(id, style.id)
        assertEquals(name, style.name)
        assertEquals(description, style.description)
    }
    
    @Test
    fun `should have predefined styles`() {
        // Then
        assertNotNull(EmojiStyle.KAKAO)
        assertNotNull(EmojiStyle.LINE)
        assertNotNull(EmojiStyle.CUTE)
        assertNotNull(EmojiStyle.MINIMAL)
        assertNotNull(EmojiStyle.THREE_D)
        assertNotNull(EmojiStyle.RETRO)
    }
    
    @Test
    fun `should find style by id`() {
        // When
        val style = EmojiStyle.fromId("kakao")
        
        // Then
        assertEquals(EmojiStyle.KAKAO, style)
    }
    
    @Test
    fun `should throw exception for unknown style id`() {
        // When & Then
        assertThrows<IllegalArgumentException> {
            EmojiStyle.fromId("unknown")
        }
    }
    
    @Test
    fun `should get all available styles`() {
        // When
        val styles = EmojiStyle.allStyles()
        
        // Then
        assertEquals(6, styles.size)
        assertTrue(styles.contains(EmojiStyle.KAKAO))
        assertTrue(styles.contains(EmojiStyle.LINE))
    }
}
