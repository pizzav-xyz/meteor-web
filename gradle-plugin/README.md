# Gradle Plugin

This directory contains the Gradle plugin for Meteor Web. The plugin is responsible for parsing a Meteor Client addon project's source code and generating a `modules.json` file that is used by the web application.

## How It Works

The plugin defines a `generateMeteorWebModules` task that scans a specified source directory for Java files. It uses the [JavaParser](https://javaparser.org/) library to parse the files and identify classes that are annotated with `@MeteorWeb`. It then extracts the metadata from these annotations and writes it to a `modules.json` file in the build directory.

## Building the Plugin

You can build the plugin using the included Gradle wrapper:

```bash
./gradlew build
```

This will assemble the plugin JAR file in the `build/libs` directory.
