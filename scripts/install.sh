#!/bin/sh
set -e

REPO="petalo/legal-markdown-js"
BINARY_NAME="legal-md"
INSTALL_DIR="/usr/local/bin"

# Detect OS
OS=$(uname -s)
if [ "$OS" != "Darwin" ]; then
  echo "Error: This installer only supports macOS." >&2
  exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  ASSET="legal-md-macos-arm64"
elif [ "$ARCH" = "x86_64" ]; then
  ASSET="legal-md-macos-x64"
else
  echo "Error: Unsupported architecture: $ARCH" >&2
  exit 1
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"

echo "Downloading ${BINARY_NAME} for macOS (${ARCH})..."
curl -fsSL "$DOWNLOAD_URL" -o "/tmp/${BINARY_NAME}"
chmod +x "/tmp/${BINARY_NAME}"

echo "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."
mv "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "Done. Run 'legal-md --help' to get started."
