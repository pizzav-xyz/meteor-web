package dev.pizzav.meteorweb

import org.gradle.testfixtures.ProjectBuilder
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MeteorWebParserTest {
    @Test
    fun parsesRegisteredModuleWithOverridesAndBestEffortSettings() {
        val project = ProjectBuilder.builder().build()
        val sourceDir = createTempDir(prefix = "meteor-web-parser-")

        writeFile(
            sourceDir,
            "com/example/addon/AddonTemplate.java",
            """
            package com.example.addon;

            import com.example.addon.modules.ExampleModule;
            import meteordevelopment.meteorclient.systems.modules.Category;
            import meteordevelopment.meteorclient.systems.modules.Modules;

            public class AddonTemplate {
                public static final Category CATEGORY = new Category("Example");

                public void onInitialize() {
                    Modules.get().add(new ExampleModule());
                }
            }
            """.trimIndent()
        )

        writeFile(
            sourceDir,
            "com/example/addon/modules/ExampleModule.java",
            """
            package com.example.addon.modules;

            import com.example.addon.AddonTemplate;
            import dev.pizzav.meteorweb.MeteorWeb;
            import meteordevelopment.meteorclient.settings.BoolSetting;
            import meteordevelopment.meteorclient.settings.BlockListSetting;
            import meteordevelopment.meteorclient.settings.BlockPosSetting;
            import meteordevelopment.meteorclient.settings.BlockSetting;
            import meteordevelopment.meteorclient.settings.ColorListSetting;
            import meteordevelopment.meteorclient.settings.ColorSetting;
            import meteordevelopment.meteorclient.settings.DoubleSetting;
            import meteordevelopment.meteorclient.settings.ItemListSetting;
            import meteordevelopment.meteorclient.settings.ItemSetting;
            import meteordevelopment.meteorclient.settings.ModuleListSetting;
            import meteordevelopment.meteorclient.settings.ProvidedStringSetting;
            import meteordevelopment.meteorclient.settings.Setting;
            import meteordevelopment.meteorclient.settings.SettingGroup;
            import meteordevelopment.meteorclient.settings.StringListSetting;
            import meteordevelopment.meteorclient.settings.StringSetting;
            import meteordevelopment.meteorclient.settings.Vector3dSetting;
            import meteordevelopment.meteorclient.systems.modules.Module;
            import meteordevelopment.meteorclient.utils.render.color.SettingColor;
            import net.minecraft.block.Blocks;
            import net.minecraft.item.Items;
            import net.minecraft.util.math.BlockPos;

            @MeteorWeb(category = "Utility", description = "Web description")
            public class ExampleModule extends Module {
                private final SettingGroup sgGeneral = settings.getDefaultGroup();

                private final Setting<Boolean> auto = sgGeneral.add(new BoolSetting.Builder()
                    .name("auto-run")
                    .defaultValue(true)
                    .build()
                );

                private final Setting<Double> scale = sgGeneral.add(new DoubleSetting.Builder()
                    .name("scale")
                    .defaultValue(2.5)
                    .range(1.0, 5.0)
                    .build()
                );

                private final Setting<String> command = sgGeneral.add(new StringSetting.Builder()
                    .name("command-name")
                    .defaultValue("home")
                    .build()
                );

                private final Setting<String> source = sgGeneral.add(new ProvidedStringSetting.Builder()
                    .name("source-name")
                    .defaultValue("friends")
                    .build()
                );

                private final Setting<Object> preferredBlock = sgGeneral.add(new BlockSetting.Builder()
                    .name("preferred-block")
                    .defaultValue(Blocks.OBSIDIAN)
                    .build()
                );

                private final Setting<Object> preferredItem = sgGeneral.add(new ItemSetting.Builder()
                    .name("preferred-item")
                    .defaultValue(Items.DIAMOND_SWORD)
                    .build()
                );

                private final Setting<Object> allowedBlocks = sgGeneral.add(new BlockListSetting.Builder()
                    .name("allowed-blocks")
                    .defaultValue(Blocks.OBSIDIAN, Blocks.CRYING_OBSIDIAN)
                    .build()
                );

                private final Setting<Object> foods = sgGeneral.add(new ItemListSetting.Builder()
                    .name("foods")
                    .defaultValue(Items.APPLE, Items.BREAD)
                    .build()
                );

                private final Setting<Object> aliases = sgGeneral.add(new StringListSetting.Builder()
                    .name("aliases")
                    .defaultValue("home", "base")
                    .build()
                );

                private final Setting<Object> linkedModules = sgGeneral.add(new ModuleListSetting.Builder()
                    .name("linked-modules")
                    .defaultValue(ExampleModule.class)
                    .build()
                );

                private final Setting<Object> color = sgGeneral.add(new ColorSetting.Builder()
                    .name("line-color")
                    .defaultValue(new SettingColor(15, 25, 35, 255))
                    .build()
                );

                private final Setting<Object> palette = sgGeneral.add(new ColorListSetting.Builder()
                    .name("palette")
                    .defaultValue(new SettingColor(255, 0, 0, 255), new SettingColor(0, 255, 0, 255))
                    .build()
                );

                private final Setting<Object> center = sgGeneral.add(new BlockPosSetting.Builder()
                    .name("center")
                    .defaultValue(new BlockPos(1, 64, -2))
                    .build()
                );

                private final Setting<Object> rotation = sgGeneral.add(new Vector3dSetting.Builder()
                    .name("rotation")
                    .defaultValue(0, 90, 180)
                    .build()
                );

                public ExampleModule() {
                    super(AddonTemplate.CATEGORY, "example-module", "Original description");
                }
            }
            """.trimIndent()
        )

        val result = MeteorWebParser(project, sourceDir).parse()

        assertEquals(1, result.moduleCount)
        assertTrue(result.json.contains("\"category\": \"Utility\""))
        assertTrue(result.json.contains("\"description\": \"Web description\""))
        assertTrue(result.json.contains("\"name\": \"Auto Run\""))
        assertTrue(result.json.contains("\"type\": \"double\""))
        assertTrue(result.json.contains("\"type\": \"string\""))
        assertTrue(result.json.contains("\"name\": \"Command Name\""))
        assertTrue(result.json.contains("\"value\": \"home\""))
        assertTrue(result.json.contains("\"name\": \"Preferred Block\""))
        assertTrue(result.json.contains("\"value\": \"Obsidian\""))
        assertTrue(result.json.contains("\"name\": \"Allowed Blocks\""))
        assertTrue(result.json.contains("\"type\": \"select\""))
        assertTrue(result.json.contains("\"options\": [\"Obsidian\", \"Crying Obsidian\"]"))
        assertTrue(result.json.contains("\"name\": \"Aliases\""))
        assertTrue(result.json.contains("\"options\": [\"home\", \"base\"]"))
        assertTrue(result.json.contains("\"name\": \"Linked Modules\""))
        assertTrue(result.json.contains("\"options\": [\"Example Module\"]"))
        assertTrue(result.json.contains("\"name\": \"Line Color\""))
        assertTrue(result.json.contains("\"type\": \"color\""))
        assertTrue(result.json.contains("\"value\": \"#0F1923\""))
        assertTrue(result.json.contains("\"name\": \"Palette\""))
        assertTrue(result.json.contains("\"options\": [\"#FF0000\", \"#00FF00\"]"))
        assertTrue(result.json.contains("\"name\": \"Center\""))
        assertTrue(result.json.contains("\"type\": \"vector\""))
        assertTrue(result.json.contains("\"value\": \"1, 64, -2\""))
        assertTrue(result.json.contains("\"name\": \"Rotation\""))
        assertTrue(result.json.contains("\"value\": \"0, 90, 180\""))
        assertFalse(result.warnings.any { it.contains("Skipping unsupported ColorSetting") })
    }

    private fun writeFile(root: File, relativePath: String, text: String) {
        val file = root.resolve(relativePath)
        file.parentFile.mkdirs()
        file.writeText(text + "\n")
    }
}
