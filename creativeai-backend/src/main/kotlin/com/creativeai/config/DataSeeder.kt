package com.creativeai.config

import com.creativeai.adapter.output.persistence.*
import java.math.BigDecimal
import java.util.Random
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.ApplicationListener
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Component
class DataSeeder(
        private val userRepository: UserR2dbcRepository,
        private val creationRepository: CreationR2dbcRepository,
        private val creationFileRepository: CreationFileR2dbcRepository
) : ApplicationListener<ApplicationReadyEvent> {

        override fun onApplicationEvent(event: ApplicationReadyEvent) {
                seedData().subscribe()
        }

        private fun seedData(): Mono<Void> {
                return userRepository.count().flatMap { userCount ->
                        if (userCount == 0L) {
                                println("No users found. Seeding users and creations...")
                                createUsers()
                                        .collectList()
                                        .flatMap { users -> seedCreationsAndMarketplace(users) }
                                        .then()
                        } else {
                                println("Users found ($userCount). Checking creations...")
                                creationRepository.count().flatMap { creationCount ->
                                        if (creationCount == 0L) {
                                                println(
                                                        "No creations found. Seeding creations for existing users..."
                                                )
                                                userRepository
                                                        .findAll()
                                                        .collectList()
                                                        .flatMap { users ->
                                                                seedCreationsAndMarketplace(users)
                                                        }
                                                        .then()
                                        } else {
                                                println(
                                                        "Creations found ($creationCount). Skipping seeding."
                                                )
                                                Mono.empty()
                                        }
                                }
                        }
                }
        }

        private fun seedCreationsAndMarketplace(users: List<UserEntity>): Mono<Void> {
                val creationsMono = createCreations(users)
                val marketplaceMono = createMarketplaceItems(users)
                return Mono.zip(creationsMono.then(), marketplaceMono.then()).then()
        }

        private fun createUsers(): Flux<UserEntity> {
                val users =
                        listOf(
                                UserEntity(
                                        username = "Luna",
                                        email = "luna@example.com",
                                        totalCredits = 500
                                ),
                                UserEntity(
                                        username = "Akira",
                                        email = "akira@example.com",
                                        totalCredits = 300
                                ),
                                UserEntity(
                                        username = "Dante",
                                        email = "dante@example.com",
                                        totalCredits = 1000
                                ),
                                UserEntity(
                                        username = "V",
                                        email = "v@example.com",
                                        totalCredits = 200
                                ),
                                UserEntity(
                                        username = "Sarah",
                                        email = "sarah@example.com",
                                        totalCredits = 150
                                )
                        )
                return userRepository.saveAll(users)
        }

        private fun createCreations(users: List<UserEntity>): Flux<CreationEntity> {
                val random = Random()
                val creations = mutableListOf<CreationEntity>()

                // Helper to get random user
                fun getRandomUser() = users[random.nextInt(users.size)]

                // 1. Popular Works
                val titles =
                        listOf(
                                "Cosmic Dreams",
                                "Neo Tokyo",
                                "Abstract Mind",
                                "Cyber Punk",
                                "Morning Dew",
                                "Electric Sheep",
                                "Pixel Heart",
                                "Neon City",
                                "Retro Wave",
                                "Future Bass"
                        )

                titles.forEachIndexed { index, title ->
                        val user = getRandomUser()
                        creations.add(
                                CreationEntity(
                                        userId = user.id!!,
                                        creationType =
                                                if (index % 2 == 0) "avatar" else "photo_editor",
                                        title = title,
                                        status = "completed",
                                        likeCount = random.nextInt(1000) + 100,
                                        isForSale = false
                                )
                        )
                }

                return creationRepository.saveAll(creations).flatMap { savedCreation ->
                        // Create associated file
                        val imageUrl = "https://picsum.photos/seed/${savedCreation.id}/300/300"
                        val file =
                                CreationFileEntity(
                                        creationId = savedCreation.id!!,
                                        fileType = "result_image",
                                        filePath = "/tmp/mock/${savedCreation.id}.jpg", // Mock path
                                        fileUrl = imageUrl,
                                        width = 300,
                                        height = 300
                                )
                        creationFileRepository.save(file).thenReturn(savedCreation)
                }
        }

        private fun createMarketplaceItems(users: List<UserEntity>): Flux<CreationEntity> {
                val random = Random()
                val marketItems = mutableListOf<CreationEntity>()
                fun getRandomUser() = users[random.nextInt(users.size)]

                val items =
                        listOf(
                                "Cyber Nexus Avatar" to "avatar",
                                "Cute Shiba Emoji Set" to "emoji",
                                "Midnight Tokyo Photo" to "photo",
                                "Galaxy Soul Portrait" to "avatar",
                                "Minimalist Line Emoji" to "emoji",
                                "Cyber Slicer Blade" to "photo",
                                "Vintage Analog Look" to "photo",
                                "Mecha Pilot Suite" to "avatar",
                                "Retro Gaming Icons" to "emoji"
                        )

                items.forEachIndexed { index, pair ->
                        val user = getRandomUser()
                        marketItems.add(
                                CreationEntity(
                                        userId = user.id!!,
                                        creationType = pair.second,
                                        title = pair.first,
                                        status = "completed",
                                        likeCount = random.nextInt(500) + 50,
                                        isForSale = true,
                                        price = BigDecimal(random.nextInt(1000) + 100)
                                )
                        )
                }

                return creationRepository.saveAll(marketItems).flatMap { savedCreation ->
                        val imageUrl =
                                "https://picsum.photos/seed/market${savedCreation.id}/600/600"
                        val file =
                                CreationFileEntity(
                                        creationId = savedCreation.id!!,
                                        fileType = "result_image",
                                        filePath = "/tmp/mock/market_${savedCreation.id}.jpg",
                                        fileUrl = imageUrl,
                                        width = 600,
                                        height = 600
                                )
                        creationFileRepository.save(file).thenReturn(savedCreation)
                }
        }
}
