package com.creativeai.common.util

import java.awt.Image
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import kotlin.math.sqrt

object ImageUtils {

    /** 이미지의 총 픽셀 수가 maxPixels를 초과할 경우 비율을 유지하며 리사이징합니다. */
    fun resizeImageToLimit(imageBytes: ByteArray, maxPixels: Int = 1048576): ByteArray {
        val inputStream = ByteArrayInputStream(imageBytes)
        val originalImage = ImageIO.read(inputStream) ?: return imageBytes

        val width = originalImage.width
        val height = originalImage.height
        val currentPixels = width * height

        if (currentPixels <= maxPixels) {
            return imageBytes
        }

        // 비율 유지하며 목표 픽셀 수에 맞게 스케일 계산
        val scale = sqrt(maxPixels.toDouble() / currentPixels)
        val targetWidth = (width * scale).toInt()
        val targetHeight = (height * scale).toInt()

        val resizedImage =
                originalImage.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH)
        val outputImage = BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB)

        val g2d = outputImage.createGraphics()
        g2d.drawImage(resizedImage, 0, 0, null)
        g2d.dispose()

        val outputStream = ByteArrayOutputStream()
        ImageIO.write(outputImage, "png", outputStream)
        return outputStream.toByteArray()
    }

    /** SDXL 엔진이 허용하는 특정 해상도로 이미지를 리사이징합니다. */
    fun resizeToSDXLDimensions(imageBytes: ByteArray): ByteArray {
        val sdxlDimensions =
                listOf(
                        Pair(1024, 1024),
                        Pair(1152, 896),
                        Pair(1216, 832),
                        Pair(1344, 768),
                        Pair(1536, 640),
                        Pair(640, 1536),
                        Pair(768, 1344),
                        Pair(832, 1216),
                        Pair(896, 1152)
                )

        val inputStream = ByteArrayInputStream(imageBytes)
        val originalImage = ImageIO.read(inputStream) ?: return imageBytes

        val originalWidth = originalImage.width
        val originalHeight = originalImage.height
        val originalRatio = originalWidth.toDouble() / originalHeight

        // 종횡비가 가장 유사한 규격 찾기
        val bestDim =
                sdxlDimensions.minByOrNull { (w, h) ->
                    val targetRatio = w.toDouble() / h
                    kotlin.math.abs(originalRatio - targetRatio)
                }
                        ?: Pair(1024, 1024)

        val targetWidth = bestDim.first
        val targetHeight = bestDim.second

        val resizedImage =
                originalImage.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH)
        val outputImage = BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB)
        val g2d = outputImage.createGraphics()
        g2d.drawImage(resizedImage, 0, 0, null)
        g2d.dispose()

        val outputStream = ByteArrayOutputStream()
        ImageIO.write(outputImage, "png", outputStream)
        return outputStream.toByteArray()
    }
}
