package com.creativeai.application.service

import com.creativeai.application.port.input.GenerateEmojiCommand
import com.creativeai.application.port.output.AIModelPort
import com.creativeai.application.port.output.GeneratedEmojiData
import com.creativeai.domain.emoji.Emoji
import com.creativeai.domain.emoji.EmojiRepository
import com.creativeai.domain.emoji.EmojiStyle
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlin.test.assertEquals
import org.junit.jupiter.api.Test
import reactor.core.publisher.Mono
import reactor.test.StepVerifier

/** EmojiService 단위 테스트 */
class EmojiServiceTest {

    private val emojiRepository: EmojiRepository = mockk()
    private val aiModelPort: AIModelPort = mockk()
    private val emojiService = EmojiService(emojiRepository, aiModelPort)

    @Test
    fun `이모티콘 생성 요청이 성공하면 PROCESSING 상태를 반환한다`() {
        // given
        val command =
                GenerateEmojiCommand(
                        imageData = "test_image",
                        styleId = "kakao",
                        generationType = "single"
                )

        val emoji = Emoji.create(command.imageData, EmojiStyle.KAKAO)

        every { emojiRepository.save(any()) } returns Mono.just(emoji)
        every { aiModelPort.generateEmoji(any(), any()) } returns
                Mono.just(GeneratedEmojiData("generated", listOf("var1", "var2")))

        // when
        val result = emojiService.execute(command)

        // then
        StepVerifier.create(result)
                .assertNext { response ->
                    assertEquals("processing", response.status)
                    assertEquals(0, response.progress)
                }
                .verifyComplete()

        verify { emojiRepository.save(any()) }
        verify { aiModelPort.generateEmoji(command.imageData, command.styleId) }
    }

    /*
        @Test
        fun `스타일 목록 조회가 성공한다`() {
            // given
            val styles = EmojiStyle.allStyles()

            // when
            val result = styles

            // then
            assertEquals(6, result.size)
            assertEquals("kakao", result[0].id)
        }
    */
}
