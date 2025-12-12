# 🚀 Archive-OmniDash Startup Guide

This guide explains how to start, stop, and manage the Archive-OmniDash development server.

---

## Quick Start

### Start the Server
```bash
npm start
# or
./start.sh
```

### Stop the Server
```bash
npm stop
# or
./stop.sh
```

### Restart the Server
```bash
npm run restart
# or
./stop.sh && ./start.sh
```

---

## Features

### ✅ Automatic Instance Detection
The startup script automatically checks if Archive-OmniDash is already running:
- Checks ports **3001** and **3002**
- Detects existing processes
- Prevents duplicate instances
- Shows helpful options if already running

### ✅ Clean Shutdown
The stop script ensures all resources are properly cleaned up:
- Graceful shutdown (SIGTERM) with 5-second timeout
- Force kill (SIGKILL) if needed
- Cleans up PID files
- Verifies all ports are freed
- Preserves logs for debugging

### ✅ Port Management
- **Primary Port:** 3001 (main app)
- **Secondary Port:** 3002 (HMR/WebSocket)
- Automatically detects port conflicts
- Shows which process is using a port

---

## Usage Examples

### Example 1: Normal Startup
```bash
$ npm start
[INFO] Checking for existing Archive-OmniDash instances...
[SUCCESS] All ports are available. Starting server...
[INFO] Starting Archive-OmniDash dev server...
[SUCCESS] Archive-OmniDash started successfully!
  PID: 123456
  URL: http://localhost:3001
  Logs: tail -f /home/owner/Documents/Archive-OmniDash/.dev-server.log

To stop: ./stop.sh
```

### Example 2: Already Running
```bash
$ npm start
[INFO] Checking for existing Archive-OmniDash instances...
[WARNING] Archive-OmniDash is already running!
  Ports in use: 3001 3002
  PIDs: 123456

Options:
  1. Stop existing instances: ./stop.sh
  2. View running app: http://localhost:3001
  3. Force restart: ./stop.sh && ./start.sh
```

### Example 3: Port Conflict
```bash
$ npm start
[INFO] Checking for existing Archive-OmniDash instances...
[ERROR] Port 3001 is already in use by another process!
  PID: 789012
  Command: node /some/other/app

Please free up the port or use a different port.
```

### Example 4: Clean Shutdown
```bash
$ npm stop
[INFO] Stopping Archive-OmniDash...
[INFO] Found 1 Archive-OmniDash instance(s) to stop
[INFO] Stopping Archive-OmniDash (PID: 123456)...
[SUCCESS] Stopped Archive-OmniDash
[INFO] Cleaned up PID file
[INFO] Log file preserved at: /home/owner/Documents/Archive-OmniDash/.dev-server.log
  (Delete manually if needed: rm /home/owner/Documents/Archive-OmniDash/.dev-server.log)
[SUCCESS] All Archive-OmniDash services stopped successfully!
  All ports (3001 3002) are now free
```

---

## Troubleshooting

### Server Won't Start
1. **Check if already running:**
   ```bash
   lsof -i :3001 -i :3002
   ```

2. **Stop all instances:**
   ```bash
   npm stop
   ```

3. **Check logs:**
   ```bash
   tail -f .dev-server.log
   ```

### Port Already in Use
1. **Find what's using the port:**
   ```bash
   lsof -i :3001
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or change the port in `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     server: {
       port: 3003  // Use a different port
     }
   })
   ```

### Server Won't Stop
1. **Force kill all instances:**
   ```bash
   pkill -9 -f "Archive-OmniDash"
   ```

2. **Manually free ports:**
   ```bash
   lsof -ti :3001 | xargs kill -9
   lsof -ti :3002 | xargs kill -9
   ```

3. **Clean up PID file:**
   ```bash
   rm -f .dev-server.pid
   ```

---

## Files Created

- **`start.sh`** - Startup script with instance detection
- **`stop.sh`** - Shutdown script with cleanup
- **`.dev-server.pid`** - PID file (auto-generated)
- **`.dev-server.log`** - Server logs (auto-generated)

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the dev server (with instance check) |
| `npm stop` | Stop the dev server (clean shutdown) |
| `npm run restart` | Restart the dev server |
| `npm run dev` | Start Vite directly (no instance check) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Best Practices

1. **Always use `npm start`** instead of `npm run dev` to get instance detection
2. **Always use `npm stop`** to ensure clean shutdown
3. **Check logs** if something goes wrong: `tail -f .dev-server.log`
4. **Don't manually kill processes** - use the stop script
5. **Restart cleanly** with `npm run restart` instead of Ctrl+C

---

## Advanced Usage

### Background Mode
The server runs in the background by default. To view logs:
```bash
tail -f .dev-server.log
```

### Manual Process Management
```bash
# Check if running
lsof -i :3001 -i :3002

# Get PID
cat .dev-server.pid

# View process details
ps aux | grep vite

# Kill specific PID
kill -15 $(cat .dev-server.pid)
```

---

**Happy coding!** 🎉

