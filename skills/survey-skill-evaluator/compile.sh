#!/usr/bin/env bash
set -euo pipefail

package_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
exec node "$package_root/source/executables/compiler/build.mjs" \
  --root "$package_root" \
  "$@"
