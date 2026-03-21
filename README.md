# infinito

A desktop application for organizing notes and drawing on an infinite canvas. Built with Electron, React, and TypeScript.

## Features

### Notes

- Create and organize blocks of content organized by date
- Markdown support with syntax highlighting
- Code blocks with Mermaid diagram support
- Collapsible date groups

### Canvas

- Draw shapes: rectangles, circles, triangles
- Lines and arrows with adjustable curves (Bézier)
- Text elements with configurable font size
- Stroke and fill color presets
- Line styles: solid, dashed, dotted
- Pan and zoom navigation

### Settings

- Configurable font size, font family
- Code syntax theme selection

## Tech Stack

- **Electron** + **electron-vite** - Desktop application framework
- **React 19** + **TypeScript** - UI
- **Tailwind CSS v4** - Styling
- **Drizzle ORM** + **better-sqlite3** - Local database
- **Motion** - Animations
- **Mermaid** - Diagram rendering

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Screenshots

> TODO: Add screenshots here
