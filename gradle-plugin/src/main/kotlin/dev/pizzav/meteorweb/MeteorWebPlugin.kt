package dev.pizzav.meteorweb

import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction
import java.nio.file.Files

abstract class GenerateMeteorWebModulesTask : DefaultTask() {
    @get:Input
    abstract val sourceDirectory: Property<String>

    @get:OutputFile
    abstract val outputFile: RegularFileProperty

    @TaskAction
    fun generate() {
        val sourceDir = project.file(sourceDirectory.get())
        val output = outputFile.get().asFile
        val result = MeteorWebParser(project, sourceDir).parse()

        output.parentFile.mkdirs()
        Files.writeString(output.toPath(), result.json)

        result.warnings.forEach { logger.warn(it) }
        logger.lifecycle("Generated ${result.moduleCount} Meteor-web modules at ${output.absolutePath}")
    }
}

open class MeteorWebExtension(project: Project) {
    val sourceDirectory: Property<String> = project.objects.property(String::class.java).convention("src/main/java")
    val outputFile: RegularFileProperty = project.objects.fileProperty().convention(
        project.layout.buildDirectory.file("generated/meteor-web/modules.json")
    )
}

class MeteorWebPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val extension = project.extensions.create("meteorWeb", MeteorWebExtension::class.java, project)

        project.tasks.register("generateMeteorWebModules", GenerateMeteorWebModulesTask::class.java) {
            group = "meteor web"
            description = "Generates a Meteor Web modules.json file from registered addon modules."
            sourceDirectory.set(extension.sourceDirectory)
            outputFile.set(extension.outputFile)
        }
    }
}
