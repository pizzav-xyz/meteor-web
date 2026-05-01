# Gradle Plugin

This directory contains the Gradle plugin for Meteor Web. The plugin is responsible for parsing a Java project's source code and generating a `modules.json` file.

## How It Works

The plugin scans a specified source directory for Java files that are annotated with `@MeteorWeb`. It then extracts the metadata from these annotations and writes it to a `modules.json` file in the build directory.

## Building the Plugin

You can build the plugin using the included Gradle wrapper:

```bash
./gradlew build
```

This will assemble the plugin JAR file in the `build/libs` directory.
