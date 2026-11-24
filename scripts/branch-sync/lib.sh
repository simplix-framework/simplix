# Shared rules for carrying changes between the release lines named in .branch-lines.
#
# A commit declares where it goes when its type is one of patch_types, or when it touches one of
# sync_paths whatever its type. On the mainline the declaration is a trailer:
#   Backport: <maintenance branch>      the change must also land on the maintenance line
#   Backport: none - <reason>           the change does not apply there
# A commit made directly on the maintenance line carries:
#   Forwardport: <mainline branch>
#   Forwardport: none - <reason>
# The copy on the other line is made with `git cherry-pick -x`, whose
# "(cherry picked from commit <sha>)" line links it to the original.
#
# A commit whose subject matches exempt_subjects, or that exempt_commits names, belongs to its own
# line and declares nothing.

branch_lines_load() {
  local root file
  root=$(git rev-parse --show-toplevel)
  file="${BRANCH_LINES_FILE:-$root/.branch-lines}"
  if [[ ! -f "$file" ]]; then
    echo "✖ branch-sync: configuration file not found: $file" >&2
    return 1
  fi
  BL_MAINLINE=$(sed -n 's/^mainline=//p' "$file")
  BL_MAINTENANCE=$(sed -n 's/^maintenance=//p' "$file")
  BL_REMOTE=$(sed -n 's/^remote=//p' "$file")
  BL_PATCH_TYPES=$(sed -n 's/^patch_types=//p' "$file")
  BL_SYNC_PATHS=$(sed -n 's/^sync_paths=//p' "$file")
  BL_EXEMPT_SUBJECTS=$(sed -n 's/^exempt_subjects=//p' "$file")
  BL_EXEMPT_COMMITS=$(sed -n 's/^exempt_commits=//p' "$file")
  BL_REMOTE=${BL_REMOTE:-origin}
  if [[ -z "$BL_MAINLINE" || -z "$BL_MAINTENANCE" || -z "$BL_PATCH_TYPES" ]]; then
    echo "✖ branch-sync: $file must define mainline, maintenance and patch_types" >&2
    return 1
  fi
}

# Prints the trailer key a commit on the given branch must carry.
branch_lines_key_for() {
  if [[ "$1" == "$BL_MAINTENANCE" ]]; then echo "Forwardport"; else echo "Backport"; fi
}

# Prints the branch a commit on the given branch is carried to.
branch_lines_target_for() {
  if [[ "$1" == "$BL_MAINTENANCE" ]]; then echo "$BL_MAINLINE"; else echo "$BL_MAINTENANCE"; fi
}

branch_lines_is_patch_subject() {
  [[ "$1" =~ ^(${BL_PATCH_TYPES})(\([^\)]*\))?!?: ]]
}

branch_lines_is_exempt_message() {
  local message="$1" subject
  subject=$(head -n1 <<<"$message")
  [[ "$subject" == Merge\ * ]] && return 0
  if [[ -n "$BL_EXEMPT_SUBJECTS" && "$subject" =~ $BL_EXEMPT_SUBJECTS ]]; then return 0; fi
  grep -q '^(cherry picked from commit [0-9a-f]\{7,\})$' <<<"$message"
}

# Succeeds when the commit is one exempt_commits names (space separated, full or abbreviated).
branch_lines_is_exempt_commit() {
  local sha="$1" named
  for named in $BL_EXEMPT_COMMITS; do
    [[ "$sha" == "$named"* ]] && return 0
  done
  return 1
}

# Succeeds when the commit touches one of sync_paths (space separated pathspecs).
branch_lines_commit_touches_sync_paths() {
  [[ -n "$BL_SYNC_PATHS" ]] || return 1
  # shellcheck disable=SC2086
  git diff-tree --no-commit-id --name-only -r "$1" -- $BL_SYNC_PATHS | grep -q .
}

# Succeeds when the staged changes touch one of sync_paths.
branch_lines_index_touches_sync_paths() {
  [[ -n "$BL_SYNC_PATHS" ]] || return 1
  # shellcheck disable=SC2086
  git diff --cached --name-only -- $BL_SYNC_PATHS | grep -q .
}

# Prints the value of the given trailer in a commit message, empty when absent.
branch_lines_trailer() {
  git interpret-trailers --parse <<<"$2" | sed -n "s/^$1: *//Ip" | head -n1
}

# Validates one commit message against the rules for the branch it is on.
# The third argument is 1 when the commit touches one of sync_paths.
# Prints the problem and returns 1 when a trailer is malformed, 2 when a commit that must declare
# where it goes carries no trailer.
# On success prints "carry" when the change must exist on the target branch, "none" otherwise.
branch_lines_validate_message() {
  local branch="$1" message="$2" touches_sync_paths="${3:-0}" key target subject value reason
  key=$(branch_lines_key_for "$branch")
  target=$(branch_lines_target_for "$branch")
  subject=$(head -n1 <<<"$message")

  if branch_lines_is_exempt_message "$message"; then echo "none"; return 0; fi
  # A copy carried from the other line names this branch in the other line's trailer.
  if [[ "$(branch_lines_trailer "$(branch_lines_key_for "$target")" "$message")" == "$branch" ]]; then
    echo "none"; return 0
  fi

  value=$(branch_lines_trailer "$key" "$message")
  if [[ -z "$value" ]]; then
    if branch_lines_is_patch_subject "$subject" || [[ "$touches_sync_paths" == 1 ]]; then
      echo "missing trailer '$key: $target' or '$key: none - <reason>' on a commit the other release line has to answer for"
      return 2
    fi
    echo "none"; return 0
  fi

  if [[ "$value" == "$target" ]]; then echo "carry"; return 0; fi
  if [[ "$value" =~ ^none([[:space:]]*-[[:space:]]*|[[:space:]]+)(.*)$ ]]; then
    reason="${BASH_REMATCH[2]}"
    if [[ -n "${reason// /}" ]]; then echo "none"; return 0; fi
  fi
  if [[ "$value" == none* ]]; then
    echo "'$key: none' needs a reason: '$key: none - <reason>'"
  else
    echo "'$key: $value' names no release line; use '$key: $target' or '$key: none - <reason>'"
  fi
  return 1
}
