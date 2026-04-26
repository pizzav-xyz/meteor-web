package dev.pizzav.meteorweb

import org.gradle.api.Project
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.Locale

data class ParseResult(val json: String, val warnings: List<String>, val moduleCount: Int)

private data class ParsedModule(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    val settings: List<Map<String, Any>>,
)

private data class ModuleOverride(
    val hidden: Boolean = false,
    val name: String? = null,
    val category: String? = null,
    val description: String? = null,
)

private data class ParsedSetting(
    val group: String,
    val builderType: String,
    val builderBody: String,
)

private data class ModuleMetadata(
    val categoryArg: String,
    val nameArg: String,
    val descriptionArg: String,
)

private data class MethodDef(
    val params: List<String>,
    val moduleParams: Set<String>,
    val body: String,
)

class MeteorWebParser(private val project: Project, private val sourceDir: File) {
    private val warnings = mutableListOf<String>()
    private val javaFiles = sourceDir.walkTopDown().filter { it.isFile && it.extension == "java" }.toList()
    private val javaTextByFile by lazy { javaFiles.associateWith(File::readText) }
    private val categoryConstants by lazy { collectCategoryConstants() }
    private val directModuleSimpleNames by lazy { collectDirectModuleSimpleNames() }
    private val modulesBySimpleName by lazy { collectModuleFiles() }
    private val methodBodyIndex by lazy { buildMethodBodyIndex() }

    fun parse(): ParseResult {
        val registeredModules = collectRegisteredModules()
        val parsed = registeredModules.mapNotNull(::parseRegisteredModule)
        return ParseResult(renderJson(parsed), warnings, parsed.size)
    }

    private fun collectRegisteredModules(): List<String> {
        val directPattern = Regex("""Modules\s*\.\s*get\s*\(\s*\)\s*\.\s*add\s*\(\s*new\s+([A-Za-z0-9_]+)\s*\(""")
        val aliasPattern = Regex("""(?:final\s+)?(?:[A-Za-z0-9_$.<>?]+\s+)?([A-Za-z0-9_]+)\s*=\s*Modules\s*\.\s*get\s*\(\s*\)\s*;""")

        val rgHits = runRipgrep("Modules\\s*\\.\\s*get\\s*\\(\\s*\\)\\s*\\.\\s*add|[A-Za-z0-9_]+\\s*=\\s*Modules\\s*\\.\\s*get\\s*\\(\\s*\\)|[A-Za-z0-9_]+\\s*\\(\\s*Modules\\s*\\.\\s*get\\s*\\(\\s*\\)\\s*\\)")
        val texts = if (rgHits.isNotEmpty()) rgHits.mapNotNull { path -> javaTextByFile[javaFiles.firstOrNull { it.absolutePath == path }] } else javaTextByFile.values.toList()

        return texts.flatMap { text ->
            collectRegisteredModulesFromText(text, directPattern, aliasPattern, mutableSetOf(), mutableSetOf(), emptySet())
        }.distinct()
    }

    private fun collectRegisteredModulesFromText(
        text: String,
        directPattern: Regex,
        aliasPattern: Regex,
        visitedMethods: MutableSet<String>,
        visitedBodies: MutableSet<Int>,
        moduleAliases: Set<String>,
    ): List<String> {
        val bodyHash = text.hashCode()
        if (!visitedBodies.add(bodyHash)) return emptyList()
        val modules = mutableListOf<String>()
        modules += directPattern.findAll(text).map { it.groupValues[1] }.toList()

        for (alias in moduleAliases) {
            val aliasAddPattern = Regex("""\b${Regex.escape(alias)}\s*\.\s*add\s*\(\s*new\s+([A-Za-z0-9_]+)\s*\(""")
            modules += aliasAddPattern.findAll(text).map { it.groupValues[1] }.toList()
        }

        val directHelperPattern = Regex("""([A-Za-z0-9_]+)\s*\(\s*Modules\s*\.\s*get\s*\(\s*\)\s*\)""")
        for (match in directHelperPattern.findAll(text)) {
            val methodName = match.groupValues[1]
            if (!visitedMethods.add(methodName)) continue
            modules += collectRegisteredModulesFromHelper(methodName, directPattern, aliasPattern, visitedMethods, visitedBodies, listOf("__DIRECT_MODULES__"))
        }

        val aliases = aliasPattern.findAll(text).map { it.groupValues[1] }.toSet()
        for (alias in aliases) {
            val aliasAddPattern = Regex("""\b${Regex.escape(alias)}\s*\.\s*add\s*\(\s*new\s+([A-Za-z0-9_]+)\s*\(""")
            modules += aliasAddPattern.findAll(text).map { it.groupValues[1] }.toList()

            val helperPattern = Regex("""([A-Za-z0-9_]+)\s*\(\s*${Regex.escape(alias)}\s*\)""")
            for (match in helperPattern.findAll(text)) {
                val methodName = match.groupValues[1]
                if (!visitedMethods.add(methodName)) continue
                modules += collectRegisteredModulesFromHelper(methodName, directPattern, aliasPattern, visitedMethods, visitedBodies, listOf(alias))
            }
        }

        return modules
    }

    private fun collectRegisteredModulesFromHelper(
        methodName: String,
        directPattern: Regex,
        aliasPattern: Regex,
        visitedMethods: MutableSet<String>,
        visitedBodies: MutableSet<Int>,
        passedAliases: List<String>,
    ): List<String> {
        val methodDef = methodBodyIndex[methodName]
        if (methodDef != null) {
            val aliasParams = when {
                passedAliases.size == 1 && passedAliases[0] == "__DIRECT_MODULES__" -> methodDef.moduleParams
                else -> methodDef.params.zip(passedAliases).map { it.first }.toSet()
            }
            return collectRegisteredModulesFromText(methodDef.body, directPattern, aliasPattern, visitedMethods, visitedBodies, aliasParams)
        }
        return emptyList()
    }

    private fun buildMethodBodyIndex(): Map<String, MethodDef> {
        val result = mutableMapOf<String, MethodDef>()
        val methodRegex = Regex("""(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?[A-Za-z0-9_$.<>?,\s\[\]]+\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{""", setOf(RegexOption.DOT_MATCHES_ALL))
        for ((_, text) in javaTextByFile) {
            for (match in methodRegex.findAll(text)) {
                val methodName = match.groupValues[1]
                if (result.containsKey(methodName)) continue
                val openIndex = text.indexOf('{', match.range.first)
                val closeIndex = findMatchingBrace(text, openIndex) ?: continue
                val params = splitTopLevelArgs(match.groupValues[2]).mapNotNull { param ->
                    val trimmed = param.trim()
                    if (trimmed.isBlank()) null else trimmed.substringAfterLast(' ').trim().takeIf { it.isNotBlank() }
                }
                val moduleParams = splitTopLevelArgs(match.groupValues[2]).mapNotNull { param ->
                    val trimmed = param.trim()
                    if (!trimmed.contains("Modules")) null else trimmed.substringAfterLast(' ').trim().takeIf { it.isNotBlank() }
                }.toSet()
                result[methodName] = MethodDef(params, moduleParams, text.substring(openIndex + 1, closeIndex))
            }
        }
        return result
    }

    private fun runRipgrep(pattern: String): List<String> {
        return try {
            val process = ProcessBuilder("rg", "-l", pattern, sourceDir.absolutePath)
                .redirectErrorStream(true)
                .start()
            val output = process.inputStream.bufferedReader().use { it.readText() }
            process.waitFor()
            output.lineSequence().map(String::trim).filter(String::isNotEmpty).toList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun collectDirectModuleSimpleNames(): Set<String> {
        val pattern = Regex("""class\s+([A-Za-z0-9_]+)\s+extends\s+Module\b""")
        return javaTextByFile.values.mapNotNull { text -> pattern.find(text)?.groupValues?.get(1) }.toSet()
    }

    private fun collectModuleFiles(): Map<String, File> {
        val pattern = Regex("""class\s+([A-Za-z0-9_]+)\b""")
        return buildMap {
            for (file in javaFiles) {
                val text = javaTextByFile.getValue(file)
                val className = pattern.find(text)?.groupValues?.get(1) ?: continue
                if (inheritsFromModule(className, text, mutableSetOf())) put(className, file)
            }
        }
    }

    private fun inheritsFromModule(className: String, text: String, visited: MutableSet<String>): Boolean {
        if (!visited.add(className)) return false
        if (directModuleSimpleNames.contains(className)) return true

        val extendsMatch = Regex("""class\s+${Regex.escape(className)}\s+extends\s+([A-Za-z0-9_]+)\b""").find(text) ?: return false
        val parentSimpleName = extendsMatch.groupValues[1]
        if (parentSimpleName == "Module") return true

        val parentFile = javaFiles.firstOrNull { it.nameWithoutExtension == parentSimpleName } ?: return false
        return inheritsFromModule(parentSimpleName, javaTextByFile.getValue(parentFile), visited)
    }

    private fun collectCategoryConstants(): Map<String, String> {
        val pattern = Regex("""([A-Za-z0-9_]+)\s*=\s*new\s+Category\(\s*\"([^\"]+)\"""")
        val categories = mutableMapOf(
            "Categories.Combat" to "Combat",
            "Categories.Player" to "Player",
            "Categories.Movement" to "Movement",
            "Categories.Render" to "Render",
            "Categories.World" to "World",
            "Categories.Misc" to "Misc",
        )

        for (file in javaFiles) {
            val text = javaTextByFile.getValue(file)
            val packageName = Regex("""package\s+([A-Za-z0-9_.]+);""").find(text)?.groupValues?.get(1)
            val className = Regex("""class\s+([A-Za-z0-9_]+)\b""").find(text)?.groupValues?.get(1)
            for (match in pattern.findAll(text)) {
                val fieldName = match.groupValues[1]
                val value = match.groupValues[2]
                categories[fieldName] = value
                if (className != null) categories["$className.$fieldName"] = value
                if (packageName != null && className != null) categories["$packageName.$className.$fieldName"] = value
            }
        }

        return categories
    }

    private fun parseRegisteredModule(simpleName: String): ParsedModule? {
        val file = modulesBySimpleName[simpleName]
        if (file == null) {
            warnings += "Skipping registered module '$simpleName' because its source file was not found."
            return null
        }

        val text = javaTextByFile.getValue(file)
        val metadata = extractModuleMetadata(simpleName, text, mutableSetOf())
        if (metadata == null) {
            warnings += "Skipping module '$simpleName' because no super(...) call was found."
            return null
        }

        val override = parseOverride(text)
        if (override.hidden) return null

        val builtInCategory = resolveCategory(metadata.categoryArg) ?: run {
            warnings += "Skipping module '$simpleName' because category '${metadata.categoryArg}' could not be resolved."
            return null
        }

        val builtInName = decodeJavaString(metadata.nameArg) ?: run {
            warnings += "Skipping module '$simpleName' because module name is not a string literal."
            return null
        }
        val name = override.name ?: builtInName

        val description = override.description ?: decodeJavaString(metadata.descriptionArg) ?: ""
        val category = override.category ?: builtInCategory
        val settings = mutableListOf<Map<String, Any>>()
        settings += defaultBindSettings()
        settings += parseSettings(file, text)

        return ParsedModule(slugify(name), titleCase(name), category, description, settings)
    }

    private fun extractModuleMetadata(simpleName: String, text: String, visited: MutableSet<String>): ModuleMetadata? {
        if (!visited.add(simpleName)) return null

        val ownSuper = Regex("""super\s*\((.*?)\)\s*;""", setOf(RegexOption.DOT_MATCHES_ALL)).find(text)
        if (ownSuper != null) {
            val args = splitTopLevelArgs(ownSuper.groupValues[1])
            if (args.size >= 3 && resolveCategory(args[0]) != null) {
                return ModuleMetadata(args[0], args[1], args[2])
            }
            if (args.size >= 2 && resolveCategory(args[0]) == null && decodeJavaString(args[0]) != null && decodeJavaString(args[1]) != null) {
                // Child constructors like super(name, description, ...) inherit category from their Module subclass parent.
            }
        }

        val extendsMatch = Regex("""class\s+${Regex.escape(simpleName)}\s+extends\s+([A-Za-z0-9_]+)\b""").find(text) ?: return null
        val parentSimpleName = extendsMatch.groupValues[1]
        if (parentSimpleName == "Module") return null

        val parentFile = javaFiles.firstOrNull { it.nameWithoutExtension == parentSimpleName } ?: return null
        val parentMetadata = extractModuleMetadata(parentSimpleName, javaTextByFile.getValue(parentFile), visited) ?: return null

        if (ownSuper != null) {
            val args = splitTopLevelArgs(ownSuper.groupValues[1])
            if (args.size >= 2 && resolveCategory(args[0]) == null && decodeJavaString(args[0]) != null && decodeJavaString(args[1]) != null) {
                return ModuleMetadata(parentMetadata.categoryArg, args[0], args[1])
            }
        }

        return parentMetadata
    }

    private fun parseOverride(text: String): ModuleOverride {
        val annotation = Regex("""@MeteorWeb\s*\((.*?)\)""", setOf(RegexOption.DOT_MATCHES_ALL)).find(text)
            ?: return ModuleOverride()
        val args = splitTopLevelArgs(annotation.groupValues[1])
        var hidden = false
        var name: String? = null
        var category: String? = null
        var description: String? = null

        for (arg in args) {
            val parts = arg.split("=", limit = 2).map(String::trim)
            if (parts.size != 2) continue
            when (parts[0]) {
                "hidden" -> hidden = parts[1] == "true"
                "name" -> name = decodeJavaString(parts[1])?.takeIf { it.isNotBlank() }
                "category" -> category = decodeJavaString(parts[1])?.takeIf { it.isNotBlank() }
                "description" -> description = decodeJavaString(parts[1])?.takeIf { it.isNotBlank() }
            }
        }

        return ModuleOverride(hidden, name, category, description)
    }

    private fun parseSettings(file: File, text: String): List<Map<String, Any>> {
        val groupMap = parseSettingGroups(text)
        val settings = mutableListOf<Map<String, Any>>()
        val addPattern = Regex("""([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\s*\.\s*add\s*\(\s*new\s+([A-Za-z0-9_$.<>]+)\.Builder\s*\(\s*\)""")
        var searchIndex = 0

        while (true) {
            val match = addPattern.find(text, searchIndex) ?: break
            val buildIndex = text.indexOf(".build", match.range.last + 1)
            if (buildIndex < 0) break
            val buildParenIndex = text.indexOf('(', buildIndex)
            if (buildParenIndex < 0) break
            val buildParenEnd = findMatchingParen(text, buildParenIndex) ?: break
            val closingIndex = text.indexOf(')', buildParenEnd + 1).takeIf { it >= 0 } ?: buildParenEnd
            val endIndex = text.indexOf(';', closingIndex + 1).takeIf { it >= 0 } ?: buildParenEnd

            val groupName = groupMap[match.groupValues[2]] ?: "General"
            val builderType = match.groupValues[3].substringBefore('<').substringAfterLast('.')
            val builderBody = text.substring(match.range.last + 1, buildIndex)
            buildSetting(file, ParsedSetting(groupName, builderType, builderBody))?.let(settings::add)

            searchIndex = endIndex + 1
        }

        return settings
    }

    private fun parseSettingGroups(text: String): Map<String, String> {
        val groups = mutableMapOf<String, String>()
        Regex("""([A-Za-z0-9_]+)\s*=\s*(?:this\.)?settings\s*\.\s*getDefaultGroup\s*\(\s*\)""")
            .findAll(text)
            .forEach { groups[it.groupValues[1]] = "General" }
        Regex("""([A-Za-z0-9_]+)\s*=\s*(?:this\.)?settings\s*\.\s*createGroup\s*\(\s*\"([^\"]+)\"\s*\)""")
            .findAll(text)
            .forEach { groups[it.groupValues[1]] = it.groupValues[2] }
        return groups
    }

    private fun buildSetting(file: File, setting: ParsedSetting): Map<String, Any>? {
        val name = extractMethodArg(setting.builderBody, "name")?.let(::decodeJavaString)
        if (name.isNullOrBlank()) {
            warnings += "Skipping a ${setting.builderType} setting in ${file.name} because .name(...) is missing or dynamic."
            return null
        }

        return when (setting.builderType) {
            "BoolSetting" -> mapOf("name" to titleCase(name), "type" to "bool", "group" to setting.group, "value" to parseBoolean(extractMethodArg(setting.builderBody, "defaultValue")))
            "IntSetting" -> numericSetting(name, "int", setting, true)
            "DoubleSetting" -> numericSetting(name, "double", setting, false)
            "EnumSetting" -> enumSetting(file, name, setting)
            "StringSetting", "ProvidedStringSetting" -> stringSetting(file, name, setting)
            "ColorSetting" -> colorSetting(name, setting)
            "ColorListSetting" -> colorListSetting(name, setting)
            "BlockPosSetting" -> blockPosSetting(name, setting)
            "Vector3dSetting" -> vector3dSetting(name, setting)
            "StringListSetting" -> literalListSetting(name, setting, ::parseStringLiteralList)
            "BlockListSetting", "StorageBlockListSetting", "ItemListSetting", "EntityTypeListSetting", "SoundEventListSetting" -> literalListSetting(name, setting, ::parseIdentifierLikeList)
            "ModuleListSetting" -> literalListSetting(name, setting, ::parseModuleClassList)
            "ItemSetting", "BlockSetting" -> identifierStringSetting(name, setting)
            "KeybindSetting" -> null
            else -> {
                warnings += "Skipping unsupported ${setting.builderType} in ${file.name}."
                null
            }
        }
    }

    private fun stringSetting(file: File, name: String, setting: ParsedSetting): Map<String, Any> {
        val defaultArg = extractMethodArg(setting.builderBody, "defaultValue")
        val value = defaultArg?.let(::parseStringValue) ?: ""
        if (defaultArg != null && value.isEmpty() && decodeJavaString(defaultArg) == null) {
            warnings += "Using empty fallback for dynamic string setting '$name' in ${file.name}."
        }
        return linkedMapOf("name" to titleCase(name), "type" to "string", "group" to setting.group, "value" to value)
    }

    private fun colorSetting(name: String, setting: ParsedSetting): Map<String, Any>? {
        val color = extractMethodArg(setting.builderBody, "defaultValue")?.let(::parseColorValue) ?: return null
        return linkedMapOf("name" to titleCase(name), "type" to "color", "group" to setting.group, "value" to color)
    }

    private fun colorListSetting(name: String, setting: ParsedSetting): Map<String, Any> {
        val colors = normalizeCollectionArgs(extractMethodArgs(setting.builderBody, "defaultValue").orEmpty()).mapNotNull(::parseColorValue)
        return linkedMapOf("name" to titleCase(name), "type" to "select", "group" to setting.group, "value" to colors.joinToString(", "), "options" to colors, "selectedCount" to colors.size, "totalCount" to colors.size)
    }

    private fun blockPosSetting(name: String, setting: ParsedSetting): Map<String, Any>? {
        val coords = extractMethodArg(setting.builderBody, "defaultValue")?.let(::parseCoordinateValue) ?: return null
        return linkedMapOf("name" to titleCase(name), "type" to "vector", "group" to setting.group, "value" to coords)
    }

    private fun vector3dSetting(name: String, setting: ParsedSetting): Map<String, Any>? {
        val coords = parseVectorArgs(extractMethodArgs(setting.builderBody, "defaultValue") ?: return null) ?: return null
        return linkedMapOf("name" to titleCase(name), "type" to "vector", "group" to setting.group, "value" to coords)
    }

    private fun identifierStringSetting(name: String, setting: ParsedSetting): Map<String, Any>? {
        val defaultArg = extractMethodArg(setting.builderBody, "defaultValue") ?: return null
        return linkedMapOf("name" to titleCase(name), "type" to "string", "group" to setting.group, "value" to parseIdentifierLikeValue(defaultArg))
    }

    private fun literalListSetting(name: String, setting: ParsedSetting, parser: (List<String>) -> List<String>): Map<String, Any> {
        val args = normalizeCollectionArgs(extractMethodArgs(setting.builderBody, "defaultValue").orEmpty())
        val options = parser(args)
        val value = if (options.isEmpty()) "" else options.joinToString(", ")
        return linkedMapOf("name" to titleCase(name), "type" to "select", "group" to setting.group, "value" to value, "options" to options, "selectedCount" to options.size, "totalCount" to options.size)
    }

    private fun numericSetting(name: String, type: String, setting: ParsedSetting, integer: Boolean): Map<String, Any>? {
        val defaultArg = extractMethodArg(setting.builderBody, "defaultValue") ?: return null
        val rangeArg = extractMethodArgs(setting.builderBody, "range")
        val minArg = rangeArg?.getOrNull(0) ?: extractMethodArg(setting.builderBody, "min")
        val maxArg = rangeArg?.getOrNull(1) ?: extractMethodArg(setting.builderBody, "sliderMax") ?: extractMethodArg(setting.builderBody, "max")
        val value: Any = if (integer) parseNumber(defaultArg).toInt() else parseNumber(defaultArg)
        val result = linkedMapOf<String, Any>("name" to titleCase(name), "type" to type, "group" to setting.group, "value" to value)
        minArg?.let { result["min"] = if (integer) parseNumber(it).toInt() else parseNumber(it) }
        maxArg?.let { result["max"] = if (integer) parseNumber(it).toInt() else parseNumber(it) }
        return result
    }

    private fun enumSetting(file: File, name: String, setting: ParsedSetting): Map<String, Any>? {
        val defaultArg = extractMethodArg(setting.builderBody, "defaultValue") ?: return null
        val enumType = defaultArg.substringBeforeLast('.').substringAfterLast('.')
        val defaultValue = defaultArg.substringAfterLast('.').trim()
        val options = parseEnumOptions(file, enumType)
        if (options.isEmpty()) {
            warnings += "Skipping enum setting '$name' in ${file.name} because enum options for $enumType could not be resolved."
            return null
        }
        return linkedMapOf("name" to titleCase(name), "type" to "enum", "group" to setting.group, "value" to titleCase(defaultValue), "options" to options.map(::titleCase))
    }

    private fun parseEnumOptions(file: File, enumType: String): List<String> {
        val text = javaTextByFile.getValue(file)
        val nested = Regex("""enum\s+$enumType\s*\{([^}]*)}""", setOf(RegexOption.DOT_MATCHES_ALL)).find(text)
        if (nested != null) {
            return nested.groupValues[1].split(',').map(String::trim).filter { it.isNotBlank() }.map { it.substringBefore('(').substringBefore(';').trim() }
        }
        val importMatch = Regex("""import\s+([A-Za-z0-9_.]+\.$enumType);""").find(text)
        if (importMatch != null) {
            val importedSimple = importMatch.groupValues[1].substringAfterLast('.')
            val importedFile = javaFiles.firstOrNull { it.nameWithoutExtension == importedSimple }
            if (importedFile != null) return parseEnumOptions(importedFile, importedSimple)
        }
        return emptyList()
    }

    private fun resolveCategory(raw: String): String? {
        val candidate = raw.trim()
        return categoryConstants[candidate] ?: categoryConstants[candidate.substringAfterLast('.')]
    }

    private fun defaultBindSettings(): List<Map<String, Any>> = listOf(
        linkedMapOf("name" to "Bind", "type" to "keybind", "group" to "Bind", "value" to "None"),
        linkedMapOf("name" to "Toggle On Bind Release", "type" to "bool", "group" to "Bind", "value" to false),
        linkedMapOf("name" to "Chat Feedback", "type" to "bool", "group" to "Bind", "value" to true),
    )

    private fun extractMethodArg(body: String, method: String): String? = extractMethodArgs(body, method)?.firstOrNull()

    private fun extractMethodArgs(body: String, method: String): List<String>? {
        val marker = ".${method}"
        var searchIndex = 0
        while (true) {
            val methodIndex = body.indexOf(marker, searchIndex)
            if (methodIndex < 0) return null
            var index = methodIndex + marker.length
            while (index < body.length && body[index].isWhitespace()) index += 1
            if (index >= body.length || body[index] != '(') {
                searchIndex = methodIndex + marker.length
                continue
            }
            val endIndex = findMatchingParen(body, index) ?: return null
            return splitTopLevelArgs(body.substring(index + 1, endIndex))
        }
    }

    private fun findMatchingParen(input: String, openIndex: Int): Int? {
        var depth = 0
        var inString = false
        var escaped = false
        for (index in openIndex until input.length) {
            val char = input[index]
            when {
                escaped -> escaped = false
                char == '\\' -> escaped = true
                char == '"' -> inString = !inString
                !inString && char == '(' -> depth += 1
                !inString && char == ')' -> {
                    depth -= 1
                    if (depth == 0) return index
                }
            }
        }
        return null
    }

    private fun findMatchingBrace(input: String, openIndex: Int): Int? {
        var depth = 0
        var inString = false
        var escaped = false
        for (index in openIndex until input.length) {
            val char = input[index]
            when {
                escaped -> escaped = false
                char == '\\' -> escaped = true
                char == '"' -> inString = !inString
                !inString && char == '{' -> depth += 1
                !inString && char == '}' -> {
                    depth -= 1
                    if (depth == 0) return index
                }
            }
        }
        return null
    }

    private fun splitTopLevelArgs(input: String): List<String> {
        val result = mutableListOf<String>()
        val current = StringBuilder()
        var depth = 0
        var inString = false
        var escaped = false
        for (char in input) {
            when {
                escaped -> { current.append(char); escaped = false }
                char == '\\' -> { current.append(char); escaped = true }
                char == '"' -> { current.append(char); inString = !inString }
                !inString && (char == '(' || char == '{' || char == '[') -> { current.append(char); depth += 1 }
                !inString && (char == ')' || char == '}' || char == ']') -> { current.append(char); depth -= 1 }
                !inString && depth == 0 && char == ',' -> { result += current.toString().trim(); current.clear() }
                else -> current.append(char)
            }
        }
        val tail = current.toString().trim()
        if (tail.isNotEmpty()) result += tail
        return result
    }

    private fun decodeJavaString(raw: String): String? {
        val trimmed = raw.trim()
        if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null
        return trimmed.substring(1, trimmed.length - 1).replace("\\\"", "\"").replace("\\n", "\n").replace("\\t", "\t").replace("\\\\", "\\")
    }

    private fun parseBoolean(raw: String?): Boolean = raw?.trim()?.equals("true", true) == true

    private fun parseStringValue(raw: String): String {
        decodeJavaString(raw)?.let { return it }
        if (looksDynamicExpression(raw)) return ""
        return parseIdentifierLikeValue(raw)
    }

    private fun parseColorValue(raw: String): String? {
        val trimmed = raw.trim()
        val intArgs = if (trimmed.startsWith("new SettingColor")) {
            Regex("""new\s+SettingColor\s*\((.*)\)""", setOf(RegexOption.DOT_MATCHES_ALL)).find(trimmed)?.groupValues?.get(1)?.let(::splitTopLevelArgs)
        } else null
        val numbers = intArgs?.mapNotNull { it.trim().toIntOrNull() } ?: return null
        if (numbers.size < 3) return null
        val r = numbers[0].coerceIn(0, 255)
        val g = numbers[1].coerceIn(0, 255)
        val b = numbers[2].coerceIn(0, 255)
        val a = numbers.getOrElse(3) { 255 }.coerceIn(0, 255)
        return if (a == 255) String.format("#%02X%02X%02X", r, g, b) else String.format("rgba(%d, %d, %d, %.3f)", r, g, b, a / 255.0)
    }

    private fun parseCoordinateValue(raw: String): String? {
        val match = Regex("""new\s+[A-Za-z0-9_.]+\s*\((.*)\)""", setOf(RegexOption.DOT_MATCHES_ALL)).find(raw.trim()) ?: return null
        return parseVectorArgs(splitTopLevelArgs(match.groupValues[1]))
    }

    private fun parseVectorArgs(args: List<String>): String? {
        if (args.size < 3) return null
        return args.take(3).map { parseNumber(it) }.joinToString(", ") { trimTrailingZeros(it) }
    }

    private fun parseStringLiteralList(args: List<String>): List<String> = args.mapNotNull { decodeJavaString(it)?.takeIf(String::isNotBlank) }.distinct()

    private fun parseIdentifierLikeList(args: List<String>): List<String> = args.mapNotNull {
        if (looksDynamicExpression(it)) null else parseIdentifierLikeValue(it).takeIf(String::isNotBlank)
    }.distinct()

    private fun parseModuleClassList(args: List<String>): List<String> = args.mapNotNull { raw ->
        val simpleName = raw.trim().removeSuffix(".class").substringAfterLast('.')
        val file = modulesBySimpleName[simpleName] ?: return@mapNotNull null
        val text = javaTextByFile.getValue(file)
        val superCall = Regex("""super\s*\((.*?)\)\s*;""", setOf(RegexOption.DOT_MATCHES_ALL)).find(text) ?: return@mapNotNull null
        val moduleName = splitTopLevelArgs(superCall.groupValues[1]).getOrNull(1)?.let(::decodeJavaString) ?: return@mapNotNull null
        titleCase(moduleName)
    }

    private fun parseIdentifierLikeValue(raw: String): String {
        val trimmed = raw.trim()
        decodeJavaString(trimmed)?.let { return humanizeIdentifier(it) }
        if (looksDynamicExpression(trimmed)) return ""
        val token = trimmed.removeSuffix(".class").substringAfterLast('.').substringAfterLast(':').trim()
        return titleCase(token)
    }

    private fun humanizeIdentifier(value: String): String = titleCase(value.substringAfterLast(':'))

    private fun normalizeCollectionArgs(args: List<String>): List<String> {
        if (args.size != 1) return args
        val single = args[0].trim()
        if (single.startsWith("List.of(")) {
            val start = single.indexOf('(')
            val end = findMatchingParen(single, start) ?: return emptyList()
            return splitTopLevelArgs(single.substring(start + 1, end))
        }
        if (single.endsWith(".toList()") || single.contains("stream()")) return emptyList()
        return args
    }

    private fun looksDynamicExpression(raw: String): Boolean {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return false
        if (decodeJavaString(trimmed) != null) return false
        if (trimmed.startsWith("new ")) return false
        if (trimmed.endsWith(".class")) return false
        if (Regex("""^[A-Za-z0-9_$.:]+$""").matches(trimmed)) return false
        if (trimmed.startsWith("List.of(")) return false
        return trimmed.contains("+") || trimmed.contains("->") || trimmed.contains("::") || trimmed.contains("(")
    }

    private fun parseNumber(raw: String): Double = raw.trim().removeSuffix("d").removeSuffix("D").removeSuffix("f").removeSuffix("F").toDouble()

    private fun trimTrailingZeros(value: Double): String = if (value == value.toLong().toDouble()) value.toLong().toString() else value.toString()

    private fun slugify(name: String): String = name.trim().lowercase(Locale.ROOT).replace(Regex("[^a-z0-9]+"), "-").trim('-')

    private fun titleCase(name: String): String = name.split('-', '_', ' ').filter(String::isNotBlank).joinToString(" ") { part ->
        val normalized = part.lowercase(Locale.ROOT)
        normalized.replaceFirstChar { it.titlecase(Locale.ROOT) }
    }

    private fun renderJson(modules: List<ParsedModule>): String {
        val lines = mutableListOf("[")
        modules.forEachIndexed { index, module ->
            lines += "  {"
            lines += "    \"id\": ${jsonString(module.id)},"
            lines += "    \"name\": ${jsonString(module.name)},"
            lines += "    \"category\": ${jsonString(module.category)},"
            lines += "    \"description\": ${jsonString(module.description)},"
            lines += "    \"settings\": ["
            module.settings.forEachIndexed { settingIndex, setting ->
                lines += "      {"
                val entries = setting.entries.toList()
                entries.forEachIndexed { entryIndex, entry ->
                    val comma = if (entryIndex == entries.lastIndex) "" else ","
                    lines += "        ${jsonString(entry.key)}: ${jsonValue(entry.value)}$comma"
                }
                val comma = if (settingIndex == module.settings.lastIndex) "" else ","
                lines += "      }$comma"
            }
            lines += "    ]"
            lines += if (index == modules.lastIndex) "  }" else "  },"
        }
        lines += "]"
        return lines.joinToString("\n") + "\n"
    }

    private fun jsonValue(value: Any): String = when (value) {
        is String -> jsonString(value)
        is Boolean, is Int, is Double -> value.toString()
        is List<*> -> value.joinToString(prefix = "[", postfix = "]") { item -> jsonValue(item ?: "") }
        else -> jsonString(value.toString())
    }

    private fun jsonString(value: String): String = buildString {
        append('"')
        value.forEach { char ->
            when (char) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> append(char)
            }
        }
        append('"')
    }
}
