#!/usr/bin/env bash
# Builds the documentation site under build-docs/. The work is done by build-docs.mjs.
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/build-docs.mjs" "$@"
