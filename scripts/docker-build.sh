#!/usr/bin/env bash
# Builds the Linkly image for linux/arm64/v8 (override with PLATFORM=...).
#
#   scripts/docker-build.sh                  # image archive in ./out/linkly-arm64.tar (no registry, no local load)
#   scripts/docker-build.sh --load           # load into the local Docker (host must be arm64 or have QEMU)
#   scripts/docker-build.sh --push ghcr.io/you/linkly:1.0.0
#
# Building on an x86 machine needs QEMU/binfmt once:  docker run --privileged --rm tonistiigi/binfmt --install arm64
set -euo pipefail

PLATFORM="${PLATFORM:-linux/arm64/v8}"
MODE="${1:-tar}"
TAG="${2:-linkly:arm64}"

cd "$(dirname "$0")/.."

case "$MODE" in
  --load) docker buildx build --platform "$PLATFORM" --load -t "$TAG" . ;;
  --push) docker buildx build --platform "$PLATFORM" --push -t "$TAG" . ;;
  tar|--tar)
    mkdir -p out
    docker buildx build --platform "$PLATFORM" -t "$TAG" --output "type=docker,dest=out/linkly-arm64.tar" .
    echo "Image archive: out/linkly-arm64.tar  (load on the target with: docker load -i linkly-arm64.tar)"
    ;;
  *) echo "Usage: $0 [--load|--push <tag>|--tar]" >&2; exit 1 ;;
esac
