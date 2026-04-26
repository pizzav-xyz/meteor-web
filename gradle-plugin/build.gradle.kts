plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

group = "dev.pizzav"
version = "0.1.0"

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    implementation(kotlin("stdlib"))
    testImplementation(gradleTestKit())
    testImplementation(kotlin("test"))
}

gradlePlugin {
    plugins {
        create("meteorWeb") {
            id = "dev.pizzav.meteor-web"
            implementationClass = "dev.pizzav.meteorweb.MeteorWebPlugin"
        }
    }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

tasks.processResources {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

kotlin {
    jvmToolchain(21)
}
