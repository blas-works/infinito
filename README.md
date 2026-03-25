<div align="center">
  <img src="resources/icon.png" alt="Infinito Logo" width="120" height="120">

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
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-development">Development</a>
  </p>
</div>

---

## ✨ Features

| 📝 **Notes**                | Markdown support with syntax highlighting             |
| :-------------------------- | :---------------------------------------------------- |
|                             | Mermaid diagram rendering in code blocks              |
|                             | Date-based organization with collapsible groups       |
|                             | Vim mode for keyboard navigation (h/l, j/k, 1-4 tabs) |
| 🎨 **Canvas**               | Excalidraw-powered infinite canvas                    |
|                             | Multiple sessions with local persistence              |
|                             | Shape tools, text elements, and freehand drawing      |
| ⚙️ **Editor Configuration** | 8 font families (Inter, JetBrains, Fira Code, etc.)   |
|                             | 7 font sizes (11-17px)                                |
|                             | 12 syntax themes (Tokyo Night, Dracula, Nord, etc.)   |
|                             | Ligatures toggle for programming fonts                |
| 🖥️ **macOS Features**       | Menu bar mode for quick access                        |
|                             | Always-on-top window pinning                          |
| 🔄 **Automatic Updates**    | Smart updates with priority levels (normal/security)  |
|                             | Manual check and snooze options                       |
| 💾 **Local Storage**        | Private data stored locally, no cloud required        |
|                             | SQLite database with Drizzle ORM                      |
|                             | Offline-first design, privacy-focused                 |

## 🚀 Installation

### Homebrew (macOS/Linux)

Install Infinito via [Homebrew](https://brew.sh):

**Option 1 — Add tap first (recommended):**

```bash
brew tap blas-works/apps
brew install --cask infinito
```

**Option 2 — One-liner without tap:**

```bash
brew install --cask blas-works/apps/infinito
```

To upgrade to the latest version:

```bash
brew upgrade --cask infinito
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

### Development

#### Prerequisites

- **Node.js** >= 18.x
- **Bun** >= 1.0 (recommended) or npm

#### Quick Start

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
<summary><b>📖 Development Scripts</b></summary>

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
| `bun run lint`          | Lint code with ESLint              |
| `bun run typecheck`     | Type check with TypeScript         |

</details>
