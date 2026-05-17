#!/bin/bash
# Wraps the x86-64 hermesc with qemu-x86_64-static for aarch64 hosts.
# Runs automatically via postinstall on non-x86_64 Linux.

set -e

ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" != "Linux" ] || [ "$ARCH" = "x86_64" ]; then
  exit 0
fi

HERMESC_DIR="$(dirname "$0")/../node_modules/react-native/sdks/hermesc/linux64-bin"
HERMESC="$HERMESC_DIR/hermesc"
HERMESC_ORIG="$HERMESC_DIR/hermesc.x86_64"

if [ ! -f "$HERMESC_ORIG" ]; then
  if [ ! -f "$HERMESC" ]; then
    echo "patch-hermesc-arm64: hermesc not found, skipping"
    exit 0
  fi
  # Check if it's already a wrapper script
  if file "$HERMESC" | grep -q "ELF"; then
    mv "$HERMESC" "$HERMESC_ORIG"
  else
    echo "patch-hermesc-arm64: hermesc already patched"
    exit 0
  fi
fi

if ! command -v qemu-x86_64-static >/dev/null 2>&1; then
  echo "patch-hermesc-arm64: qemu-x86_64-static not found; install it with: apt-get install qemu-user-static"
  exit 1
fi

cat > "$HERMESC" <<'EOF'
#!/bin/bash
exec qemu-x86_64-static "$(dirname "$(readlink -f "$0")")/hermesc.x86_64" "$@"
EOF
chmod +x "$HERMESC"
echo "patch-hermesc-arm64: hermesc patched for aarch64"
