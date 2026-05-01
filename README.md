# Meteor Web

A web-based interface for managing Meteor Client modules.

## Features

- **Module Management:** View and configure Meteor Client modules.
- **Search:** Quickly find modules and settings.
- **Favorites:** Mark your most-used modules for easy access.
- **Responsive Design:** Use the interface on any device.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [bun](https://bun.sh/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/pizzav-xyz/meteor-web.git
    ```
2.  Navigate to the `web` directory:
    ```bash
    cd meteor-web/web
    ```
3.  Install dependencies:
    ```bash
    bun install
    ```

### Running the Development Server

```bash
bun run dev
```

This will start the development server at `http://localhost:5173`.

## Building for Production

```bash
bun run build
```

This will create a production-ready build in the `dist` directory.
