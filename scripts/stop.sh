#!/bin/bash

# Telehealth Platform Stop Script
# This script stops all running services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ASCII Art Header
echo -e "${RED}"
echo "╔══════════════════════════════════════════╗"
echo "║      TELEHEALTH PLATFORM SHUTDOWN       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Stop backend server
stop_backend() {
    print_info "Stopping backend server..."
    
    # Check for PID file
    if [ -f backend.pid ]; then
        PID=$(cat backend.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            print_success "Backend server stopped (PID: $PID)"
        else
            print_warning "Backend server process not found (PID: $PID)"
        fi
        rm backend.pid
    else
        # Try to find and kill Node.js process on port 3001
        if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_info "Found Node.js process on port 3001"
            kill -9 $(lsof -Pi :3001 -sTCP:LISTEN -t)
            print_success "Backend server stopped"
        else
            print_info "Backend server is not running"
        fi
    fi
}

# Stop Docker services
stop_docker() {
    print_info "Stopping Docker services..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        print_success "Docker services stopped"
    else
        print_info "Docker services are not running"
    fi
}

# Clean up
cleanup() {
    print_info "Cleaning up..."
    
    # Remove PID files
    rm -f backend.pid
    
    print_success "Cleanup complete"
}

# Main execution
main() {
    stop_backend
    stop_docker
    cleanup
    
    echo
    print_success "All services have been stopped"
    echo
    echo "To restart the platform, run: ./start.sh"
    echo
}

# Run main function
main
