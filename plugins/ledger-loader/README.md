# ledger-loader

A Claude Code `SessionStart` hook that puts the ledger, `INDEX.md` on `main`, into a main session's context at start, on resume, after a clear and after every compaction, and says so in context when it cannot.

**Status:** working, measured on Claude Code 2.1.317.\
Needs `bash`, `curl`, `awk`, and `sha256sum` or `shasum`; uses `jq` if present and plain output if not.

`AGENTS.md` section 2 asks for the ledger and checks for it, but cannot load it: it is harness-neutral by contract.\
This plugin is the loading half for one harness, outside the corpus's own runtime, which preloads nothing.\
The measurements it is built from, and what it does not cover, are in [`docs/audits/ledger-delivery-2026-11-03.md`](../../docs/audits/ledger-delivery-2026-11-03.md).

---

## How it works

Claude Code keeps a hook's context inline only below about 10,000 characters; a larger one is saved to a file and the model sees a 2 KB preview.\
The ledger is about 33,000 characters, so the script cuts it at line boundaries into parts of at most 8,000 characters and is registered once per part.

- Every part names the ledger's sha256, so parts from two different fetches can be told apart.
- Parts do not arrive in registration order, and the order varies between runs, so every part says how many parts to expect, and each part after the first restates the layer heading it continues under.
- The last part ends with an `END-OF-LEDGER` line naming the sha, size and last row - but only when every row fits the registered parts. Otherwise it ends with `LEDGER-INCOMPLETE` and the number of parts needed.
- A failed fetch, a body that does not start `# Index`, or a bad argument puts a warning and the recovery command in context instead of the part.
- Part 1 also checks the `CLAUDE.md` files this harness loads - the user's and each from the session's directory upward - that declare `kind: standing-context`, against `main`'s `AGENTS.md`. Local content appended after the shared text is reported, not flagged. A branch or clone of this repository that edits `AGENTS.md` will, correctly, warn.
- Every run appends a line to `~/.claude/ledger-loader.log`.

What it cannot do: a hook the harness kills at its timeout, or never runs, puts nothing in context.\
The `AGENTS.md` check is what catches that.

---

## Install

From this directory, copy the script into your Claude Code config directory:
```sh
mkdir -p ~/.claude/hooks
cp ledger-loader.sh ~/.claude/hooks/ledger-loader.sh
chmod +x ~/.claude/hooks/ledger-loader.sh
```

Register one hook per part in `~/.claude/settings.json`, merged into any `hooks` you already have.\
Five parts hold up to 40,000 characters of ledger; when the last part says `LEDGER-INCOMPLETE`, add parts and change the second argument on every line to match.
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/ledger-loader.sh 1 5", "timeout": 20 },
          { "type": "command", "command": "~/.claude/hooks/ledger-loader.sh 2 5", "timeout": 20 },
          { "type": "command", "command": "~/.claude/hooks/ledger-loader.sh 3 5", "timeout": 20 },
          { "type": "command", "command": "~/.claude/hooks/ledger-loader.sh 4 5", "timeout": 20 },
          { "type": "command", "command": "~/.claude/hooks/ledger-loader.sh 5 5", "timeout": 20 }
        ]
      }
    ]
  }
}
```

Environment, all optional: `MISSION_KIT_RAW` (the raw base address, default `main` of this repository), `LEDGER_PART_MAX` (characters per part, default 8000), `LEDGER_FETCH_SECONDS` (per fetch, default 6), `LEDGER_LOADER_LOG`.

---

## Use

Nothing to do: each main session starts with the ledger, and each compaction reloads it.\
Subagents receive none of it; give a subagent the ledger in its prompt if it must route.\
The `AGENTS.md` check still applies - name `K3` - and has a second signal here: five parts naming one sha, and the `END-OF-LEDGER` line.

---

## Test

Run every part by hand; each should be under 10,000 characters, and the last line should be `END-OF-LEDGER`:
```sh
for i in 1 2 3 4 5; do
  echo '{"source":"startup","cwd":"'"$PWD"'"}' | ~/.claude/hooks/ledger-loader.sh $i 5 \
    | jq -r '.hookSpecificOutput.additionalContext' | wc -c
done
echo '{"source":"startup"}' | ~/.claude/hooks/ledger-loader.sh 5 5 \
  | jq -r '.hookSpecificOutput.additionalContext' | grep -E '^(END-OF-LEDGER|LEDGER-INCOMPLETE)'
```

Then end to end, from context alone:
```sh
claude -p 'Without tools, name ledger entry K3 and quote the END-OF-LEDGER line.' < /dev/null
claude -p 'Without tools, name ledger entry K3 and quote the END-OF-LEDGER line.' --settings '{"disableAllHooks": true}' < /dev/null
```
The first should answer `repo-audit - code-grounded repo audit` and quote the line; the second should not.

---

## Remove

Drop the five `ledger-loader.sh` entries from `~/.claude/settings.json`, then:
```sh
rm ~/.claude/hooks/ledger-loader.sh ~/.claude/ledger-loader.log
```
