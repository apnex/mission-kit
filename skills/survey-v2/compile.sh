#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)

case "${1-}" in
  "") ;;
  --check) ;;
  *)
    echo "usage: ./compile.sh [--check]" >&2
    exit 64
    ;;
esac

exec node "$ROOT_DIR/source/executables/compiler/build.mjs" "$@"
