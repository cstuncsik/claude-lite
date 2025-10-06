# Troubleshooting Guide

## Common Issues

### 1. Database Error: "unable to open database file"

**Symptoms:**
```
Failed to initialize database: Failed to connect to database
error returned from database: (code: 14) unable to open database file
```

**Solution:**
This issue has been fixed. The database initialization now:
- Creates the directory automatically with `std::fs::create_dir_all`
- Uses the correct SQLite URL format: `sqlite:path?mode=rwc`
- Logs the database path on startup for debugging

If you still see this error:
1. **Check the console output** - You should see:
   ```
   App data directory: "/path/to/app/data"
   Database path: "/path/to/app/data/claude.db"
   ```

2. **Verify write permissions**:
   - macOS: `ls -la ~/Library/Application\ Support/`
   - Linux: `ls -la ~/.local/share/`
   - Windows: Check `%APPDATA%` folder permissions

3. **Manual directory creation**:
   ```bash
   # macOS
   mkdir -p ~/Library/Application\ Support/claude-lite

   # Linux
   mkdir -p ~/.local/share/claude-lite

   # Windows
   mkdir %APPDATA%\claude-lite
   ```

4. **Rebuild from scratch**:
   ```bash
   rm -rf src-tauri/target
   cargo build --manifest-path src-tauri/Cargo.toml
   ```

### 2. API Key Not Set

**Symptoms:**
```
Warning: ANTHROPIC_API_KEY not set in environment
```

**Solution:**
1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
3. Restart the app

### 3. Build Errors

**Rust Errors:**
```bash
# Clean build
rm -rf src-tauri/target
cargo check --manifest-path src-tauri/Cargo.toml
```

**TypeScript Errors:**
```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

### 4. Tailwind CSS Not Working

**Symptoms:**
- No styling appears
- Console errors about PostCSS

**Solution:**
Make sure you have the correct PostCSS config:
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 5. Port Already in Use

**Symptoms:**
```
Error: Port 1420 is already in use
```

**Solution:**
Kill any existing dev servers:
```bash
pkill -f "tauri dev"
# Or find and kill the specific process
lsof -ti:1420 | xargs kill -9
```

### 6. No Messages Appearing

**Possible Causes:**
1. API key invalid or missing
2. Network connectivity issues
3. Check browser console (Cmd+Option+I on macOS)

**Debug Steps:**
1. Verify API key is set correctly
2. Check network tab for failed requests
3. Look at console for errors
4. Check if streaming events are firing

### 7. Application Won't Start

**Solution:**
1. Check you have all prerequisites:
   ```bash
   node --version  # Should be v18+
   rustc --version # Should be recent stable
   ```
2. Reinstall dependencies:
   ```bash
   npm install
   ```
3. Check for port conflicts (see #5)

## Development Tips

### Hot Reload Not Working
The app uses Tauri's dev mode with hot reload. If changes aren't appearing:
1. Save the file
2. Wait 1-2 seconds
3. If still not working, restart dev server

### Database Location
- **macOS**: `~/Library/Application Support/claude-lite/claude.db`
- **Linux**: `~/.local/share/claude-lite/claude.db`
- **Windows**: `%APPDATA%\claude-lite\claude.db`

To reset database:
```bash
# macOS
rm -rf ~/Library/Application\ Support/claude-lite/

# Linux
rm -rf ~/.local/share/claude-lite/

# Windows
rmdir /s %APPDATA%\claude-lite
```

### Viewing Logs
Dev mode logs appear in the terminal where you ran `npm run tauri dev`.

### Debug Mode
Add to your `.env`:
```
RUST_LOG=debug
```

## Getting Help

If you're still stuck:
1. Check [README.md](README.md) for basic setup
2. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
3. Make sure all dependencies are installed
4. Try a clean rebuild (see Build Errors above)

## Reporting Bugs

When reporting issues, please include:
1. Operating system and version
2. Node.js version (`node --version`)
3. Rust version (`rustc --version`)
4. Full error message
5. Steps to reproduce
