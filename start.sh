#!/bin/bash
# Archive-OmniDash Startup Script
# Checks for existing instances and manages dev server lifecycle

set -e

PROJECT_NAME="Archive-OmniDash"
PROJECT_DIR="/home/owner/Documents/Archive-Omnidash-2"
PORTS=(3001 3002)  # Ports this app uses
PID_FILE="$PROJECT_DIR/.dev-server.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to get PID using a port
get_port_pid() {
    local port=$1
    lsof -i :$port -t 2>/dev/null | head -1
}

# Function to check if this app is already running
check_if_running() {
    local running=false
    local pids=()
    
    for port in "${PORTS[@]}"; do
        if check_port $port; then
            local pid=$(get_port_pid $port)
            if [ -n "$pid" ]; then
                # Check if it's our process
                local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "")
                if [[ "$cmd" == *"Archive-OmniDash"* ]] || [[ "$cmd" == *"vite"* ]]; then
                    pids+=($pid)
                    running=true
                fi
            fi
        fi
    done
    
    if [ "$running" = true ]; then
        log_warning "$PROJECT_NAME is already running!"
        echo -e "  Ports in use: ${PORTS[*]}"
        echo -e "  PIDs: ${pids[*]}"
        echo ""
        echo "Options:"
        echo "  1. Stop existing instances: ./stop.sh"
        echo "  2. View running app: http://localhost:3001"
        echo "  3. Force restart: ./stop.sh && ./start.sh"
        return 0
    else
        return 1
    fi
}

# Function to start the dev server
start_server() {
    log_info "Starting $PROJECT_NAME dev server..."
    
    cd "$PROJECT_DIR"
    
    # Start dev server in background
    npm run dev > .dev-server.log 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$PID_FILE"
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if it's still running
    if ps -p $pid > /dev/null 2>&1; then
        log_success "$PROJECT_NAME started successfully!"
        echo -e "  PID: $pid"
        echo -e "  URL: ${GREEN}http://localhost:3001${NC}"
        echo -e "  Logs: tail -f $PROJECT_DIR/.dev-server.log"
        echo ""
        echo "To stop: ./stop.sh"
    else
        log_error "Failed to start dev server. Check logs:"
        tail -20 .dev-server.log
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Main execution
main() {
    log_info "Checking for existing $PROJECT_NAME instances..."
    
    if check_if_running; then
        exit 0
    fi
    
    # Check if ports are occupied by other processes
    # Allow backend (3002) to be running, only check frontend (3001)
    if check_port 3001; then
        local pid=$(get_port_pid 3001)
        local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "unknown")
        if [[ "$cmd" != *"vite"* ]] && [[ "$cmd" != *"Archive-OmniDash"* ]]; then
            log_error "Port 3001 is already in use by another process!"
            echo -e "  PID: $pid"
            echo -e "  Command: $cmd"
            echo ""
            echo "Please free up the port or use a different port."
            exit 1
        else
            log_warning "Frontend already running on port 3001"
            echo -e "  URL: ${GREEN}http://localhost:3001${NC}"
            exit 0
        fi
    fi

    # Check if backend is running, if not warn user
    if ! check_port 3002; then
        log_warning "Backend (port 3002) is not running."
        echo -e "  Credentials and authenticated features will not work."
        echo -e "  To start backend: cd backend && npm start"
        echo ""
    fi
    
    log_success "All ports are available. Starting server..."
    start_server
}

# Run main function
main

