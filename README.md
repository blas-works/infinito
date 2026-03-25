<div align="center">
  <img src="build/icon.png" alt="Infinito Logo" width="120" height="120">

  <h1>Infinito</h1>

  <p><strong>A minimalist note-taking app with an infinite canvas</strong></p>

  <p>
    <em>Write. Draw. Think without limits.</em>
  </p>

  <p>
    <a href="https://electronjs.org">
      <img alt="Electron" src="https://img.shields.io/badge/Electron-39-9FEAF9?style=flat-square&logo=electron">
    </a>
    <a href="https://react.dev">
      <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react">
    </a>
    <a href="https://www.typescriptlang.org">
      <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript">
    </a>
    <a href="https://bun.sh">
      <img alt="Bun" src="https://img.shields.io/badge/Bun-1.3-000000?style=flat-square&logo=bun">
    </a>
    <a href="https://codecov.io/gh/blas-works/infinito">
      <img alt="Coverage" src="https://img.shields.io/codecov/c/github/blas-works/infinito?style=flat-square&logo=codecov&label=coverage">
    </a>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#development">Development</a>
  </p>
</div>

---

## Features

| **Notes**    | Infinite canvas with pan and zoom               |
| :----------- | :---------------------------------------------- |
|              | Markdown support with syntax highlighting       |
|              | Mermaid diagram rendering in code blocks        |
|              | Date-based organization with collapsible groups |
| **Canvas**   | Shape tools: rectangles, circles, triangles     |
|              | Lines and arrows with Bezier curves             |
|              | Text elements with customizable font            |
|              | Color presets and line styles (solid/dash/dot)  |
| **Settings** | Configurable font size and family               |
|              | Syntax theme selection                          |
| **Data**     | Local SQLite storage, no cloud required         |
|              | Offline-first design, privacy-focused           |

## Installation

### Homebrew

**Step 1:** Add the tap (first time only):

```bash
brew tap blas-works/apps
```

**Step 2:** Install:

```bash
brew install --cask hollow
brew install --cask infinito
```

Or install without prior tap:

```bash
brew install --cask blas-works/apps/hollow
brew install --cask blas-works/apps/infinito
```

**Update** (when a new version is released):

```bash
brew upgrade --cask hollow
brew upgrade --cask infinito
```

**Option 2** — One-liner without prior tap:

```bash
brew install --cask blas-works/apps/hollow
brew install --cask blas-works/apps/infinito
```

### Manual Download

Download the latest version from [GitHub Releases](https://github.com/blas-works/infinito/releases/latest).

| Platform    | Architecture  | Format                    |
| ----------- | ------------- | ------------------------- |
| **Windows** | x64           | `.exe` (NSIS)             |
| **Linux**   | x64           | `.AppImage` `.deb` `.rpm` |
| **macOS**   | Apple Silicon | `.dmg`                    |
| **macOS**   | Intel         | `.dmg`                    |

#### macOS: First Run

The app is not signed with Apple Developer. After installing, run in Terminal:

```bash
xattr -cr /Applications/Infinito.app
```

> **Note:** Automatic updates are not available on macOS (requires Apple Developer signature). Download new versions manually from [Releases](https://github.com/blas-works/infinito/releases/latest).

## Development

### Prerequisites

- **Node.js** >= 18.x
- **Bun** >= 1.0

### Quick Start

```bash
# Clone the repository
git clone https://github.com/blas-works/infinito.git
cd infinito

# Install dependencies
bun install

# Run in development mode
bun run dev
```

<details>
<summary><b>Development Scripts</b></summary>

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `bun run dev`           | Development server with hot reload |
| `bun run build`         | Production build (auto-detects OS) |
| `bun run build:win`     | Build for Windows (.exe)           |
| `bun run build:mac`     | Build for macOS (.dmg)             |
| `bun run build:linux`   | Build for Linux (.AppImage, .deb)  |
| `bun run test`          | Run tests in watch mode            |
| `bun run test:run`      | Run tests once                     |
| `bun run test:coverage` | Run tests with coverage report     |

</details>
