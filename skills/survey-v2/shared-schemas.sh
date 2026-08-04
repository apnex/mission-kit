#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)

exec node "$ROOT_DIR/source/executables/compiler/shared-schema-closure.mjs" "$@"
