# Meteor Web

Meteor Web is a web-based user interface for managing and configuring modules for the Meteor Client, a popular Minecraft mod. It provides a complete recreation of the in-game GUI, allowing users to toggle modules, adjust their settings, and manage their favorites, all from the comfort of their web browser.

## How It Works

The project is divided into two main components: a Gradle plugin and a web application.

1.  **Gradle Plugin:** The `meteor-web` Gradle plugin is responsible for parsing a Meteor Client addon project's source code. It scans for Java classes that are annotated with a custom `@MeteorWeb` annotation and extracts metadata about each module, including its name, description, category, and settings. This information is then written to a `modules.json` file.

2.  **Web Application:** The web application is a React-based single-page application (SPA) that reads the `modules.json` file and dynamically generates a user interface. This interface is a faithful recreation of the Meteor Client's in-game GUI, and it allows users to interact with the modules as if they were in the game.

## Features

-   **Faithful Recreation:** A pixel-perfect recreation of the Meteor Client's in-game GUI.
-   **Module Management:** Toggle modules on and off, and adjust their settings.
-   **Favorites:** Mark your most-used modules for easy access.
-   **Search:** Quickly find modules by name or by setting.
-   **Responsive Design:** The interface is fully responsive and can be used on any device.
-   **Persistent State:** The state of your modules, favorites, and window positions is saved in your browser's local storage.

## Getting Started

To use Meteor Web with your own Meteor Client addon, you'll need to apply the Gradle plugin to your project and add the `@MeteorWeb` annotation to your module classes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [bun](https://bun.sh/)
-   [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/) (version 17 or higher)

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
