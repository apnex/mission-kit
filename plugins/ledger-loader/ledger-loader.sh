#!/usr/bin/env bash
# ledger-loader: a Claude Code SessionStart hook (startup, resume, clear, compact).
#
# Usage: ledger-loader.sh PART PARTS   (register one hook per part, 1..PARTS)
#
# Claude Code keeps a hook's additionalContext inline only below about 10,000
# characters; a larger one is saved to a file and the model sees a 2 KB preview.
# So the ledger (INDEX.md on main, ~33 KB) is cut at line boundaries into parts of at
# most PART_MAX characters, one part per hook. Every part names the ledger's sha256 so
# parts from two different fetches can be told apart. The last part ends with
# END-OF-LEDGER only when every row fits the registered parts, and LEDGER-INCOMPLETE
# otherwise. Part 1 also checks the CLAUDE.md files this harness loads for drift from
# main's AGENTS.md. A failure the script can see is announced in context; a hook the
# harness kills, or never runs, cannot announce itself.
set -u
part=${1:-1}; parts=${2:-1}
canon=https://raw.githubusercontent.com/apnex/mission-kit/main
base=${MISSION_KIT_RAW:-$canon}
budget=${LEDGER_FETCH_SECONDS:-6}   # per fetch; part 1 makes two, under the 20s hook timeout
part_max=${LEDGER_PART_MAX:-8000}   # characters of ledger per part; the inline cap is ~10,000
log=${LEDGER_LOADER_LOG:-${HOME:-/tmp}/.claude/ledger-loader.log}

input=$(cat 2>/dev/null)
field() { printf '%s' "$input" | jq -r ".$1 // empty" 2>/dev/null; }
event=$(field source); event=${event:-unknown}
cwd=$(field cwd); cwd=${cwd:-$PWD}

out=""
say() { out="$out$1"$'\n'; }
tmp=""
trap '[ -n "$tmp" ] && rm -f "$tmp" "$tmp.n"; printf "%s event=%s part=%s/%s cwd=%s chars_out=%s\n" "$(date -u +%FT%TZ)" "$event" "$part" "$parts" "$cwd" "${#out}" >> "$log" 2>/dev/null' EXIT
emit() {
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg c "$out" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
  else
    printf '%s' "$out"   # SessionStart adds plain stdout to context
  fi
}
fail() {
  say "WARNING: ledger-loader part $part of $parts (event: $event): $1. This part of the ledger is NOT in context. Fetch it yourself before relying on the ledger: curl -sS $canon/INDEX.md"
  emit; exit 0
}

case "$part$parts" in *[!0-9]*|'') fail "called with part '$part' of '$parts'; both must be whole numbers" ;; esac
[ "$part" -ge 1 ] && [ "$part" -le "$parts" ] || fail "called with part $part of $parts, outside 1..$parts"

tmp=$(mktemp 2>/dev/null) || { tmp=""; fail "could not create a temporary file"; }
err=$(curl -sS --fail --max-time "$budget" -o "$tmp" "$base/INDEX.md" 2>&1) || fail "could not fetch $base/INDEX.md ($err)"
[ "$(head -1 "$tmp")" = "# Index" ] || fail "$base/INDEX.md does not start with '# Index', so it is not the ledger"

chars=$(wc -c < "$tmp")
sha=$(sha256sum "$tmp" 2>/dev/null | cut -c1-12)
[ -n "$sha" ] || sha=$(shasum -a 256 "$tmp" 2>/dev/null | cut -c1-12)
last=$(grep -o '^| \[[A-Z]*[0-9]*\]' "$tmp" | tail -1 | tr -d '|[] ')

# Cut at line boundaries: a new chunk starts when adding a line would pass part_max.
# A chunk that does not open on a layer heading first restates the heading it continues.
chunk=$(awk -v max="$part_max" -v want="$part" '
  BEGIN { n = 1; size = 0; heading = "" }
  {
    line = $0 "\n"
    if (size > 0 && size + length(line) > max) {
      n++; size = 0
      if ($0 !~ /^## / && heading != "") {
        cont = "(continuing " heading ")\n"
        if (n == want) printf "%s", cont
        size += length(cont)
      }
    }
    if ($0 ~ /^## /) heading = $0
    if (n == want) printf "%s", line
    size += length(line)
  }
  END { print n > "/dev/stderr" }' "$tmp" 2>"$tmp.n")
needed=$(cat "$tmp.n")

say "mission-kit ledger part $part of $parts (ledger sha256 $sha, $chars characters, fetched $(date -u +%FT%TZ) from $base/INDEX.md by the ledger-loader SessionStart hook, event: $event)."
say "The parts may arrive in any order. All $parts must be in context and name this sha256, and part $parts must end with END-OF-LEDGER; otherwise fetch the ledger yourself before relying on it."
say ""
[ -n "$chunk" ] && say "$chunk"
if [ "$part" -eq "$parts" ]; then
  if [ "$needed" -le "$parts" ]; then
    say "END-OF-LEDGER: sha256 $sha, $chars characters, last row $last."
  else
    say "LEDGER-INCOMPLETE: the ledger needs $needed parts and $parts are registered, so rows past part $parts are NOT in context. Register more parts, and fetch the ledger yourself now: curl -sS $canon/INDEX.md"
  fi
fi

# Drift: the CLAUDE.md files this harness loads - the user's, and each from the session's
# directory upward - that declare themselves a standing context must begin with main's
# AGENTS.md. Content appended after it (local context) is allowed and reported.
if [ "$part" -eq 1 ]; then
  main_doc=$(curl -sS --fail --max-time "$budget" "$base/AGENTS.md" 2>/dev/null)
  if [ -z "$main_doc" ]; then
    say "WARNING: could not fetch main's AGENTS.md, so the standing context in this session was not checked for drift."
  else
    want=$(printf '%s\n' "$main_doc"); n=$(printf '%s\n' "$main_doc" | wc -c)
    files=("${HOME:-/nonexistent}/.claude/CLAUDE.md"); dir=$cwd
    while :; do files+=("$dir/CLAUDE.md"); [ "$dir" = / ] && break; dir=$(dirname "$dir"); done
    shown=0; drifted=0
    for f in "${files[@]}"; do
      [ -f "$f" ] && grep -q '^kind: standing-context' "$f" 2>/dev/null || continue
      if [ "$(head -c "$n" "$f")" != "$want" ]; then
        drifted=$((drifted + 1))
        [ $shown -lt 3 ] && say "WARNING: $f has drifted from main's AGENTS.md, so the standing context in this session may be stale. Compare: diff $(printf '%q' "$f") <(curl -sS $canon/AGENTS.md)" && shown=$((shown + 1))
      elif [ "$(wc -c < "$f")" -gt "$n" ]; then
        say "note: $f matches main's AGENTS.md and carries local content appended after it."
      fi
    done
    [ $drifted -gt $shown ] && say "WARNING: $((drifted - shown)) more standing-context files have drifted from main."
  fi
fi

emit
