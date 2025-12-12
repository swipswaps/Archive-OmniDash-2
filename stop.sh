#!/bin/bash
# Archive-OmniDash Stop Script
# Cleanly stops all dev server instances and cleans up resources

set -e

PROJECT_NAME="Archive-OmniDash"
PROJECT_DIR="/home/owner/Documents/Archive-OmniDash"
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

# Function to kill a process gracefully
kill_process() {
    local pid=$1
    local name=$2
    
    if ps -p $pid > /dev/null 2>&1; then
        log_info "Stopping $name (PID: $pid)..."
        
        # Try graceful shutdown first (SIGTERM)
        kill -15 $pid 2>/dev/null || true
        
        # Wait up to 5 seconds for graceful shutdown
        local count=0
        while ps -p $pid > /dev/null 2>&1 && [ $count -lt 5 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running (SIGKILL)
        if ps -p $pid > /dev/null 2>&1; then
            log_warning "Process didn't stop gracefully, forcing..."
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
        
        # Verify it's stopped
        if ! ps -p $pid > /dev/null 2>&1; then
            log_success "Stopped $name"
            return 0
        else
            log_error "Failed to stop $name"
            return 1
        fi
    else
        log_warning "$name (PID: $pid) is not running"
        return 0
    fi
}

# Function to stop all instances
stop_all() {
    local stopped_any=false
    local pids_to_kill=()
    
    # Check PID file first
    if [ -f "$PID_FILE" ]; then
        local saved_pid=$(cat "$PID_FILE")
        if ps -p $saved_pid > /dev/null 2>&1; then
            pids_to_kill+=($saved_pid)
        fi
    fi
    
    # Check all ports
    for port in "${PORTS[@]}"; do
        if check_port $port; then
            local pid=$(get_port_pid $port)
            if [ -n "$pid" ]; then
                # Check if it's our process
                local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "")
                if [[ "$cmd" == *"Archive-OmniDash"* ]] || [[ "$cmd" == *"vite"* ]]; then
                    # Add to kill list if not already there
                    if [[ ! " ${pids_to_kill[@]} " =~ " ${pid} " ]]; then
                        pids_to_kill+=($pid)
                    fi
                fi
            fi
        fi
    done
    
    # Kill all found processes
    if [ ${#pids_to_kill[@]} -eq 0 ]; then
        log_info "No $PROJECT_NAME instances found running"
        return 0
    fi
    
    log_info "Found ${#pids_to_kill[@]} $PROJECT_NAME instance(s) to stop"
    
    for pid in "${pids_to_kill[@]}"; do
        kill_process $pid "$PROJECT_NAME"
        stopped_any=true
    done
    
    # Clean up PID file
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
        log_info "Cleaned up PID file"
    fi
    
    # Clean up log file (optional)
    if [ -f "$PROJECT_DIR/.dev-server.log" ]; then
        log_info "Log file preserved at: $PROJECT_DIR/.dev-server.log"
        echo "  (Delete manually if needed: rm $PROJECT_DIR/.dev-server.log)"
    fi
    
    # Verify all ports are free
    sleep 1
    local all_free=true
    for port in "${PORTS[@]}"; do
        if check_port $port; then
            log_warning "Port $port is still in use"
            all_free=false
        fi
    done
    
    if [ "$all_free" = true ]; then
        log_success "All $PROJECT_NAME services stopped successfully!"
        echo -e "  All ports (${PORTS[*]}) are now free"
    else
        log_warning "Some ports are still in use. You may need to manually kill processes."
    fi
}

# Main execution
main() {
    log_info "Stopping $PROJECT_NAME..."
    stop_all
}

# Run main function
main

