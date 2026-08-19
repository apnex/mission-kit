# statusline

<!-- style-check: allow S13 (the sample output is reproduced verbatim; statusline.sh emits these glyphs) -->

A Claude Code status line: working directory, model, context usage, and rate-limit burn for the 5-hour and 7-day windows.

**Status:** working.\
Bash + `jq`; reads Claude Code's status-line JSON on stdin.

The line renders as:
```text
~/path | Model | ctx: 21% [42k/200k] | 5h: 30% [2h15m: 0.8×]  7d: 12% [5d3h: 0.4×]
```

Each rate-limit window shows `used% [time-to-reset: burn×]`.\
Burn ratio is `used% / elapsed%`: below `1.0×` you are under pace, at or above `1.0×` the figure turns yellow, and a window turns red once it is both projected to exhaust and past its half-budget point.

---

## Install

Copy the script into your Claude Code config directory and point `settings.json` at it:
```sh
cp statusline.sh ~/.claude/statusline.sh
chmod +x ~/.claude/statusline.sh
```

Add the status-line hook to `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

---

## Use

Claude Code invokes the script automatically once configured — the status line appears at the bottom of the session.\
It needs `jq` on `PATH`; nothing else.

---

## Test

Feed it a sample status-line payload and confirm it renders a line:
```sh
echo '{"cwd":"'"$HOME"'/demo","model":{"display_name":"Opus"},"context_window":{"context_window_size":200000,"used_percentage":21},"rate_limits":{"five_hour":{"used_percentage":30,"resets_at":0},"seven_day":{"used_percentage":12,"resets_at":0}}}' | ~/.claude/statusline.sh
```

---

## Remove

Drop the `statusLine` block from `~/.claude/settings.json` and delete the script:
```sh
rm ~/.claude/statusline.sh
```
