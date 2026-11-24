#!/usr/bin/env bash
# Verifies that every change one release line owes the other has reached it, or is declared not to.
#
# Usage: scripts/branch-sync/check.sh [--local | --refs <mainline> <maintenance>]
#   --local  compare the local branches instead of the remote-tracking ones
#   --refs   compare the two given commits or refs
#
# Exits 1 and lists each commit that lacks a declaration or whose counterpart is missing.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
# shellcheck source=lib.sh
source "$root/scripts/branch-sync/lib.sh"
branch_lines_load

if [[ "${1:-}" == "--local" ]]; then
  mainline_ref="refs/heads/$BL_MAINLINE"
  maintenance_ref="refs/heads/$BL_MAINTENANCE"
elif [[ "${1:-}" == "--refs" ]]; then
  mainline_ref="${2:?--refs needs the mainline ref}"
  maintenance_ref="${3:?--refs needs the maintenance ref}"
else
  mainline_ref="refs/remotes/$BL_REMOTE/$BL_MAINLINE"
  maintenance_ref="refs/remotes/$BL_REMOTE/$BL_MAINTENANCE"
fi

for ref in "$mainline_ref" "$maintenance_ref"; do
  if ! git rev-parse --verify --quiet "$ref^{commit}" >/dev/null; then
    echo "✖ branch-sync: $ref does not exist; fetch both release lines first" >&2
    exit 1
  fi
done

fork_point=$(git merge-base "$mainline_ref" "$maintenance_ref")
problems=0

# Succeeds when the target line holds a copy of the commit: a cherry-pick that names it, or the
# same patch.
has_counterpart() {
  local sha="$1" target_ref="$2"
  if git log --format=%H --grep="^(cherry picked from commit $sha)\$" "$fork_point..$target_ref" | grep -q .; then
    return 0
  fi
  git cherry "$target_ref" "$sha" "$sha~1" | grep -q '^-'
}

# Reports commits on the source line that break the rules or are not yet on the target line.
check_line() {
  local branch="$1" source_ref="$2" target_ref="$3" target sha message verdict status touches
  target=$(branch_lines_target_for "$branch")
  while read -r sha; do
    [[ -z "$sha" ]] && continue
    branch_lines_is_exempt_commit "$sha" && continue
    message=$(git log -1 --format=%B "$sha")
    touches=0
    branch_lines_commit_touches_sync_paths "$sha" && touches=1
    status=0
    verdict=$(branch_lines_validate_message "$branch" "$message" "$touches") || status=$?
    # A commit made before its type or path had to declare is settled by its copy on the other line.
    if (( status == 2 )) && has_counterpart "$sha" "$target_ref"; then
      continue
    fi
    if (( status != 0 )); then
      echo "✖ $branch $(git log -1 --format='%h %s' "$sha")"
      echo "    $verdict"
      problems=$((problems + 1))
      continue
    fi
    [[ "$verdict" == "carry" ]] || continue

    has_counterpart "$sha" "$target_ref" && continue
    echo "✖ $branch $(git log -1 --format='%h %s' "$sha")"
    echo "    not yet on $target: git switch $target && git cherry-pick -x $sha"
    problems=$((problems + 1))
  done < <(git rev-list --no-merges --reverse "$fork_point..$source_ref")
}

check_line "$BL_MAINLINE" "$mainline_ref" "$maintenance_ref"
check_line "$BL_MAINTENANCE" "$maintenance_ref" "$mainline_ref"

if (( problems > 0 )); then
  echo "✖ branch-sync: $problems commit(s) since $(git log -1 --format=%h "$fork_point") need attention"
  exit 1
fi
echo "✔ branch-sync: $BL_MAINLINE and $BL_MAINTENANCE carry each other's changes since $(git log -1 --format=%h "$fork_point")"
