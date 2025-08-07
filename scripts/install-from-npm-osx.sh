#!/bin/bash

# Script to run legal-md-ui with automatic dependency installation
# Compatible with macOS and executable from the terminal as a shell script
#
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/petalo/legal-markdown-js/refs/heads/main/scripts/install-from-npm-osx.sh)"


# FLOW:
# 1. Check if Homebrew is installed, if not, install it
# 2. Check if Node.js and npm are installed, if not, install them
# 3. Check if legal-markdown-js is installed globally, if not, install it
# 4. Verify all executables are available in PATH
# 5. Check configuration status at ~/.config/legal-markdown-js/.env
# 6. Check Chrome/Chromium for PDF generation
# 7. Execute legal-md-ui


set -e  # Exit on any error

# Verbose mode for debugging
VERBOSE=false
if [[ "$1" == "--verbose" ]] || [[ "$1" == "-v" ]]; then
    VERBOSE=true
    set -x  # Enable command tracing
fi

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

# Function to check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."
    
    # Check macOS version
    OS_VERSION=$(sw_vers -productVersion)
    print_status "macOS version: $OS_VERSION"
    
    # Check architecture
    ARCH=$(uname -m)
    print_status "Architecture: $ARCH"
    
    # Check available disk space
    DISK_SPACE=$(df -h / | awk 'NR==2 {print $4}')
    print_status "Available disk space: $DISK_SPACE"
    
    # Check internet connectivity
    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connection available"
    else
        print_error "No internet connection detected"
        exit 1
    fi
}

print_status "Starting legal-md-ui setup..."

# Run system checks if verbose
if [[ "$VERBOSE" == "true" ]]; then
    check_system_requirements
fi

# Quick environment check
QUICK_MODE=false
if command -v brew &> /dev/null && command -v node &> /dev/null && command -v npm &> /dev/null && command -v legal-md-ui &> /dev/null; then
    print_success "All core dependencies detected - quick mode enabled"
    QUICK_MODE=true
fi

# 1. Check if Homebrew is installed
check_homebrew() {
    local brew_paths=(
        "/opt/homebrew/bin/brew"  # Apple Silicon
        "/usr/local/bin/brew"      # Intel Mac
        "/home/linuxbrew/.linuxbrew/bin/brew"  # Linux
        "$HOME/.brew/bin/brew"     # User installation
    )
    
    # First check if brew is already in PATH
    if command -v brew &> /dev/null; then
        print_success "Homebrew is already in PATH"
        if [[ "$VERBOSE" == "true" ]]; then
            print_status "Homebrew version: $(brew --version | head -n1)"
            print_status "Homebrew location: $(which brew)"
        fi
        return 0
    fi
    
    # Check all possible installation paths
    for brew_path in "${brew_paths[@]}"; do
        if [[ -x "$brew_path" ]]; then
            print_success "Homebrew found at: $brew_path"
            
            # Get the brew prefix and add to PATH
            local brew_prefix=$(dirname $(dirname $brew_path))
            eval "$($brew_path shellenv)"
            
            # Add to shell profile if not already there
            local shell_profile="$HOME/.zprofile"
            if [[ "$SHELL" == *"bash"* ]]; then
                shell_profile="$HOME/.bash_profile"
            fi
            
            if ! grep -q "$brew_prefix/bin/brew shellenv" "$shell_profile" 2>/dev/null; then
                echo "eval \"\$($brew_path shellenv)\"" >> "$shell_profile"
                print_status "Added Homebrew to $shell_profile"
            fi
            
            return 0
        fi
    done
    
    # Homebrew not found, need to install
    print_warning "Homebrew not found in any standard location"
    print_status "Installing Homebrew..."
    
    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Setup PATH for current session based on architecture
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    else
        eval "$(/usr/local/bin/brew shellenv)"
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
    fi
    
    print_success "Homebrew installed successfully"
}

check_homebrew

# 2. Check if Node.js and npm are installed
check_nodejs() {
    local min_node_version="18.0.0"
    
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        print_warning "Node.js/npm not found. Installing Node.js..."
        
        # Install Node.js using Homebrew
        brew install node
        
        print_success "Node.js and npm installed successfully"
    else
        print_success "Node.js and npm are already installed"
        
        # Check Node.js version
        local node_version=$(node --version | sed 's/v//')
        print_status "Node.js version: v$node_version"
        print_status "npm version: $(npm --version)"
        
        # Compare versions
        if [[ "$(printf '%s\n' "$min_node_version" "$node_version" | sort -V | head -n1)" != "$min_node_version" ]]; then
            print_warning "Node.js version is below minimum required ($min_node_version)"
            print_status "Updating Node.js..."
            brew upgrade node
            print_success "Node.js updated"
        fi
    fi
    
    # Verify npm global directory is writable
    NPM_PREFIX=$(npm config get prefix)
    if [[ ! -w "$NPM_PREFIX" ]]; then
        print_warning "npm global directory is not writable: $NPM_PREFIX"
        print_status "Fixing npm permissions..."
        mkdir -p "$HOME/.npm-global"
        npm config set prefix "$HOME/.npm-global"
        export PATH="$HOME/.npm-global/bin:$PATH"
        echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zprofile
        print_success "npm permissions fixed"
    fi
}

check_nodejs

# 3. Check if legal-markdown-js is installed globally
if ! command -v legal-md-ui &> /dev/null; then
    print_warning "legal-markdown-js is not installed globally. Installing..."

    # Install legal-markdown-js globally with Chrome download in global cache
    print_status "This may take a few minutes..."

    # Set global cache directory for Puppeteer
    GLOBAL_PUPPETEER_CACHE="$HOME/.cache/puppeteer-global"
    mkdir -p "$GLOBAL_PUPPETEER_CACHE"

    # Install with global cache configuration
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    PUPPETEER_CACHE_DIR="$GLOBAL_PUPPETEER_CACHE" \
    npm install -g legal-markdown-js

    print_success "legal-markdown-js installed successfully"
else
    print_success "legal-markdown-js is already installed"

    # Check for available updates (more efficient check)
    print_status "Checking for updates..."
    CURRENT_VERSION=$(npm list -g legal-markdown-js --depth=0 2>/dev/null | grep legal-markdown-js | sed 's/.*@//' | sed 's/ .*//')
    LATEST_VERSION=$(npm view legal-markdown-js version 2>/dev/null)
    
    if [[ "$CURRENT_VERSION" != "$LATEST_VERSION" ]]; then
        print_warning "Update available: $CURRENT_VERSION → $LATEST_VERSION"
        print_status "Updating legal-markdown-js..."
        npm update -g legal-markdown-js
        print_success "legal-markdown-js updated successfully"
    else
        print_success "legal-markdown-js is up to date (v$CURRENT_VERSION)"
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

# 6. Check Chrome/Chromium for PDF generation
check_chrome() {
    print_status "Checking Chrome/Chromium for PDF generation..."
    
    local chrome_found=false
    local chrome_locations=()
    
    # Check for system Chrome installations
    local chrome_paths=(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "/Applications/Chromium.app/Contents/MacOS/Chromium"
        "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "$HOME/Applications/Chromium.app/Contents/MacOS/Chromium"
    )
    
    for chrome_path in "${chrome_paths[@]}"; do
        if [[ -f "$chrome_path" ]]; then
            chrome_locations+=("$chrome_path")
            chrome_found=true
            if [[ "$VERBOSE" == "true" ]]; then
                print_success "Found: $chrome_path"
            fi
        fi
    done
    
    # Check Puppeteer cache locations
    local cache_paths=(
        "$HOME/.cache/puppeteer-global"  # Global cache for all installations
        "$HOME/.cache/puppeteer"
        "$HOME/.puppeteer-cache"
        "$(npm config get prefix 2>/dev/null)/lib/node_modules/puppeteer/.local-chromium"
    )
    
    for cache_path in "${cache_paths[@]}"; do
        if [[ -d "$cache_path" ]] && [[ -n "$(ls -A "$cache_path" 2>/dev/null)" ]]; then
            chrome_found=true
            if [[ "$VERBOSE" == "true" ]]; then
                print_success "Puppeteer cache found: $cache_path"
            fi
        fi
    done
    
    if [[ "$chrome_found" == "true" ]]; then
        print_success "Chrome/Chromium is available for PDF generation"
        if [[ "$VERBOSE" == "true" ]] && [[ ${#chrome_locations[@]} -gt 0 ]]; then
            print_status "Chrome locations: ${chrome_locations[*]}"
        fi
    else
        print_warning "Chrome/Chromium not found for PDF generation"
        print_status "Installing Chrome for Puppeteer in global cache (this may take a few minutes)..."

        # Set global cache directory
        GLOBAL_PUPPETEER_CACHE="$HOME/.cache/puppeteer-global"
        mkdir -p "$GLOBAL_PUPPETEER_CACHE"

        # Set environment to ensure download to global cache
        export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
        export PUPPETEER_SKIP_DOWNLOAD=false
        export PUPPETEER_CACHE_DIR="$GLOBAL_PUPPETEER_CACHE"

        # Try multiple installation methods
        local install_success=false

        # Method 1: npx puppeteer browsers install
        if PUPPETEER_CACHE_DIR="$GLOBAL_PUPPETEER_CACHE" npx puppeteer browsers install chrome 2>/dev/null; then
            install_success=true
            print_success "Chrome installed via npx puppeteer in global cache"
        # Method 2: Direct npm execution
        elif PUPPETEER_CACHE_DIR="$GLOBAL_PUPPETEER_CACHE" npm exec puppeteer browsers install chrome 2>/dev/null; then
            install_success=true
            print_success "Chrome installed via npm exec in global cache"
        # Method 3: Global puppeteer installation
        elif npm list -g puppeteer &>/dev/null && PUPPETEER_CACHE_DIR="$GLOBAL_PUPPETEER_CACHE" npx -p puppeteer browsers install chrome 2>/dev/null; then
            install_success=true
            print_success "Chrome installed via global puppeteer in global cache"
        fi

        if [[ "$install_success" == "false" ]]; then
            print_warning "Automatic Chrome installation failed"
            print_status "\n🔧 Manual steps to enable PDF generation:"
            echo "  Option 1: npx puppeteer browsers install chrome"
            echo "  Option 2: Download Chrome from https://www.google.com/chrome/"
            echo "  Option 3: brew install --cask google-chrome"
            echo ""
            print_status "PDF generation will not work until Chrome is installed"
        fi
    fi
}

# Only check Chrome if not in quick mode or if verbose
if [[ "$QUICK_MODE" != "true" ]] || [[ "$VERBOSE" == "true" ]]; then
    check_chrome
fi

# 7. Final summary before execution
if [[ "$VERBOSE" == "true" ]]; then
    print_status "\nEnvironment Summary:"
    echo "  Homebrew: $(which brew 2>/dev/null || echo 'not found')"
    echo "  Node.js: $(node --version 2>/dev/null || echo 'not found')"
    echo "  npm: $(npm --version 2>/dev/null || echo 'not found')"
    echo "  legal-md-ui: $(which legal-md-ui 2>/dev/null || echo 'not found')"
    echo ""
fi

# 8. Execute legal-md-ui
print_status "Launching legal-md-ui..."
echo ""
echo "================================================="
echo "           RUNNING LEGAL-MD-UI"
echo "================================================="
echo ""

# Execute the command with error handling
if ! legal-md-ui; then
    print_error "legal-md-ui exited with an error"
    print_status "\nTroubleshooting tips:"
    echo "  1. Run: npm install -g legal-markdown-js"
    echo "  2. Check PATH: echo \$PATH"
    echo "  3. Run with verbose: $0 --verbose"
    exit 1
fi

print_success "legal-md-ui executed successfully"