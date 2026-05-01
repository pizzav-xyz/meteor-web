# Meteor Web

Meteor Web is a tool for generating a web-based user interface from a Java project's source code. It consists of a Gradle plugin that parses Java files to extract metadata from a custom annotation, and a web application that displays this information in a user-friendly interface.

## How It Works

1.  **Annotation:** The `@MeteorWeb` annotation is used to mark classes in a Java project with metadata such as a name, category, and description.
2.  **Gradle Plugin:** The `meteor-web` Gradle plugin scans the project's source code for this annotation and generates a `modules.json` file containing the extracted metadata.
3.  **Web Application:** The web application reads the `modules.json` file and dynamically generates a user interface to display the information.

## Getting Started

To use Meteor Web in your own project, you'll need to apply the Gradle plugin and add the `@MeteorWeb` annotation to your Java classes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [bun](https://bun.sh/)
- [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/) (version 17 or higher)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/pizzav-xyz/meteor-web.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd meteor-web
    ```

### Building the Project

To build the entire project, including the Gradle plugin and the web application, run the following command from the root directory:

```bash
./gradlew build
```
