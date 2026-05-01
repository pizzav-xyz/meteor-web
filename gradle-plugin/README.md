# Gradle Plugin

This directory contains the Gradle plugin for Meteor Web. The plugin is responsible for parsing a Meteor Client addon project's source code and generating a `modules.json` file that is used by the web application.

## How It Works

The plugin uses static analysis to parse the Java source code and extract information about the modules and their settings. It does this without compiling the code, which makes it very fast.

### Module Discovery

The plugin discovers modules by searching for calls to `Modules.get().add(new ...)`. It also follows references to helper methods that wrap these calls, so you can organize your module registration code however you like. To speed up the search, the plugin will use [Ripgrep](https://github.com/BurntSushi/ripgrep) if it's available on your system.

### Setting Parsing

The plugin parses settings by looking for calls to `settings.getDefaultGroup()` and `settings.createGroup()`, and then it finds calls to `.add(new ...Builder())`. It then extracts the setting's name, type, and default value from the builder chain.

The following setting types are supported:

-   `BoolSetting`
-   `IntSetting`
-   `DoubleSetting`
-   `EnumSetting`
-   `StringSetting`
-   `ColorSetting`
-   `BlockPosSetting`
-   `Vector3dSetting`

### Type Conversion

The plugin converts Java types to JSON-compatible types. For example, it converts `ColorSetting` to a hex color string and `BlockPosSetting` to a comma-separated string of coordinates.

### @MeteorWeb Annotation

You can use the `@MeteorWeb` annotation to customize how your modules are displayed in the web interface. The annotation has the following properties:

-   `name`: Overrides the name of the module.
-   `category`: Overrides the category of the module.
-   `description`: Overrides the description of the module.
-   `hidden`: If set to `true`, the module will be hidden from the web interface.

## Configuration

To use the plugin, you need to apply it to your project and configure it in your `build.gradle.kts` file:

```kotlin
plugins {
    id("dev.pizzav.meteor-web") version "1.0.0"
}

meteorWeb {
    sourceDirectory.set("src/main/java")
    outputFile.set(layout.buildDirectory.file("generated/meteor-web/modules.json"))
}
```

The `sourceDirectory` property tells the plugin where to look for your Java source files, and the `outputFile` property tells it where to write the `modules.json` file.

## Building the Plugin

You can build the plugin using the included Gradle wrapper:

```bash
./gradlew build
```

This will assemble the plugin JAR file in the `build/libs` directory.
