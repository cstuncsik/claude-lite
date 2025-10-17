# Claude Lite

A lightweight desktop client for Claude AI with local data persistence.

> ⚠️ **Note**: This is not a production-ready application. It's a vibe coding experiment and learning project.

<img width="1407" height="711" alt="CleanShot 2025-10-17 at 09 48 03" src="https://github.com/user-attachments/assets/e8e2d87e-09a0-41c5-9d6d-702f22034443" />

## Features

- 💬 Chat with Claude using your own API key
- 📁 Organize chats into projects
- 💾 Local SQLite storage for all data
- 🌊 Real-time streaming responses
- 🎨 Clean, dark-mode interface
- ⚡ Fast and lightweight (built with Tauri + React)

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Anthropic API Key](https://console.anthropic.com/)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**

   Copy `.env.example` to `.env` and add your Anthropic API key:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

## Troubleshooting

If you encounter issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

## Building for Production

Build the application for your platform:

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

### Platform-specific outputs:
- **macOS**: `.app` bundle in `bundle/macos/`
- **Windows**: `.exe` installer in `bundle/msi/`
- **Linux**: `.AppImage` or `.deb` in `bundle/appimage/` or `bundle/deb/`

## Usage

### Creating a Chat
1. Click "New Chat" to start a conversation
2. Type your message and press Enter (or click Send)

### Organizing with Projects
1. Click the "+" button next to "Projects" in the sidebar
2. Enter a project name
3. Chats created while a project is selected will belong to that project

### Keyboard Shortcuts
- `Enter` - Send message
- `Shift+Enter` - New line in message input

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Zustand
- **Backend**: Rust + Tauri + SQLite
- **API**: Anthropic Claude API with streaming support

## Data Storage

All data is stored locally in SQLite:
- **Location**: `~/.local/share/claude-lite/claude.db` (Linux)
- **Location**: `~/Library/Application Support/claude-lite/claude.db` (macOS)
- **Location**: `%APPDATA%\claude-lite\claude.db` (Windows)

## Project Structure

```
claude-lite/
├── src/                    # Frontend (React)
│   ├── components/        # UI components
│   ├── store/            # Zustand stores
│   └── lib/              # Utilities & types
├── src-tauri/             # Backend (Rust)
│   └── src/
│       ├── commands/     # Tauri commands
│       └── db/          # Database logic
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
