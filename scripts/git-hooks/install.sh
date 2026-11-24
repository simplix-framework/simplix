#!/usr/bin/env bash
# Links the repository's hooks into this clone's hooks directory: commit-msg, which refuses a
# commit that does not declare where it goes, and pre-push, which says what the other release
# line still lacks. An existing hook is left in place and reported, never overwritten.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
hooks_dir=$(git rev-parse --git-common-dir)/hooks
mkdir -p "$hooks_dir"
chmod +x "$root/scripts/branch-sync/check.sh"

blocked=0
for name in commit-msg pre-push; do
  target="$hooks_dir/$name"
  source_hook="$root/scripts/git-hooks/$name"
  if [[ -e "$target" || -L "$target" ]]; then
    if [[ "$(readlink "$target" 2>/dev/null || true)" == "$source_hook" ]]; then
      echo "✔ $name hook already installed"
      continue
    fi
    echo "✖ $target already exists; call $source_hook from it to chain the two" >&2
    blocked=1
    continue
  fi
  chmod +x "$source_hook"
  ln -s "$source_hook" "$target"
  echo "✔ $name hook installed: $target -> $source_hook"
done
exit "$blocked"
