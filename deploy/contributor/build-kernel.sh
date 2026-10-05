#!/bin/sh
# Run on a Linux build machine. Source and output paths are operator-provided.
set -eu
: "${KERNEL_SOURCE:?path to checked-out Linux v6.1.128 source required}"
: "${FIRECRACKER_SOURCE:?path to checked-out Firecracker v1.12.1 source required}"
: "${KERNEL_OUTPUT:?absolute output path required}"
test "$(uname -s)" = Linux
test "$(git -C "$KERNEL_SOURCE" describe --tags --exact-match)" = v6.1.128
test "$(git -C "$FIRECRACKER_SOURCE" describe --tags --exact-match)" = v1.12.1
arch=$(uname -m)
case "$arch" in x86_64|aarch64) ;; *) exit 1 ;; esac
config="$FIRECRACKER_SOURCE/resources/guest_configs/microvm-kernel-ci-$arch-6.1.config"
cp "$config" "$KERNEL_SOURCE/.config"
"$KERNEL_SOURCE/scripts/config" --file "$KERNEL_SOURCE/.config" --disable LOCALVERSION_AUTO --set-str LOCALVERSION ""
make -C "$KERNEL_SOURCE" LOCALVERSION=-tendril olddefconfig
case "$arch" in
  x86_64)
    make -C "$KERNEL_SOURCE" -j"$(nproc)" LOCALVERSION=-tendril vmlinux
    objcopy --strip-debug "$KERNEL_SOURCE/vmlinux" "$KERNEL_OUTPUT"
    ;;
  aarch64)
    make -C "$KERNEL_SOURCE" -j"$(nproc)" LOCALVERSION=-tendril Image
    cp "$KERNEL_SOURCE/arch/arm64/boot/Image" "$KERNEL_OUTPUT"
    ;;
esac
chmod 0400 "$KERNEL_OUTPUT"
sha256sum "$KERNEL_OUTPUT"
