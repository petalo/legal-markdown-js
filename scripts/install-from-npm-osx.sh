#!/bin/bash

# Script to run legal-md-ui with automatic dependency installation
# Compatible with macOS and executable from Shortcuts as a shell script
#
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/petalo/legal-markdown-js/refs/heads/main/scripts/install-from-npm-osx.sh)"


# FLOW:
# 1. Check if Homebrew is installed, if not, install it
# 2. Check if Node.js and npm are installed, if not, install them
# 3. Check if legal-markdown-js is installed globally, if not, install it
# 4. Verify all executables are available in PATH
# 5. Check configuration status at ~/.config/legal-markdown-js/.env
# 6. Execute legal-md-ui


set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show progress spinner
show_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

print_status "Starting legal-md-ui setup..."

# 1. Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew is not installed. Installing Homebrew..."

    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for current session
    if [[ $(uname -m) == 'arm64' ]]; then
        # Mac with Apple Silicon
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    else
        # Mac with Intel
        eval "$(/usr/local/bin/brew shellenv)"
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
    fi

    print_success "Homebrew installed successfully"
else
    print_success "Homebrew is already installed"
fi

# 2. Check if Node.js and npm are installed
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    print_warning "Node.js/npm is not installed. Installing Node.js..."

    # Install Node.js using Homebrew
    brew install node

    print_success "Node.js and npm installed successfully"
else
    print_success "Node.js and npm are already installed"
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
fi

# 3. Check if legal-markdown-js is installed globally
if ! command -v legal-md-ui &> /dev/null; then
    print_warning "legal-markdown-js is not installed globally. Installing..."

    # Install legal-markdown-js globally
    npm install -g legal-markdown-js

    print_success "legal-markdown-js installed successfully"
else
    print_success "legal-markdown-js is already installed"

    # Check for available updates
    print_status "Checking for updates..."
    if npm outdated -g legal-markdown-js &> /dev/null; then
        print_warning "An update is available for legal-markdown-js. Updating..."
        npm update -g legal-markdown-js
        print_success "legal-markdown-js updated successfully"
    else
        print_success "legal-markdown-js is up to date"
    fi
fi

# 4. Verify all executables are available
print_status "Verifying available executables..."
executables=("legal-md" "legal-md-ui" "legal-md-setup" "legal-md-playground")

for executable in "${executables[@]}"; do
    if command -v "$executable" &> /dev/null; then
        print_success "$executable is available"
    else
        print_warning "$executable is not available in PATH"
    fi
done

# 5. Check configuration status
print_status "Checking configuration status..."
CONFIG_PATH="$HOME/.config/legal-markdown-js/.env"

if [[ -f "$CONFIG_PATH" && -s "$CONFIG_PATH" ]]; then
    print_success "Configuration found at ~/.config/legal-markdown-js/.env"
else
    if [[ -f "$CONFIG_PATH" ]]; then
        print_warning "Configuration file exists but is empty at ~/.config/legal-markdown-js/.env"
    else
        print_warning "No configuration found at ~/.config/legal-markdown-js/.env"
    fi
    print_status "legal-md-ui will guide you through the setup process"
fi

# 6. Execute legal-md-ui
print_status "Launching legal-md-ui..."
echo ""
echo "================================================="
echo "           RUNNING LEGAL-MD-UI"
echo "================================================="
echo ""

# Execute the command
legal-md-ui

echo ""
echo "================================================="
echo "           PROCESS COMPLETED"
echo "================================================="
print_success "legal-md-ui executed successfully"
