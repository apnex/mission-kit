#!/usr/bin/env bash
# check-landed - say whether local work has actually reached the remote, from git rather than memory.
#
# Sovereign duty: this one question and no other. A commit that the gate refused, followed by a push
# that pushed nothing, was once reported as landed: the report rested on an echo that ran whatever
# the commands before it did. This reads the truth instead - an uncommitted change, a commit the
# remote lacks, or the remote ahead - and exits non-zero on any of them.
#
# Usage:  tools/check-landed.sh [REMOTE] [BRANCH]     defaults: origin, the current branch

set -uo pipefail
cd "$(dirname "$0")/.."
remote=${1:-origin}
branch=${2:-$(git rev-parse --abbrev-ref HEAD)}
git fetch -q "$remote" "$branch" 2>/dev/null || { echo "NOT LANDED  cannot fetch $remote/$branch"; exit 1; }
dirty=$(git status --porcelain | wc -l)
ahead=$(git rev-list --count "$remote/$branch..HEAD")
behind=$(git rev-list --count "HEAD..$remote/$branch")
head=$(git rev-parse --short HEAD)
if [ "$dirty" -eq 0 ] && [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
	echo "LANDED  $head is on $remote/$branch; nothing uncommitted"
	exit 0
fi
echo "NOT LANDED  $dirty uncommitted path(s), $ahead commit(s) not on $remote/$branch, $remote $behind ahead"
exit 1
