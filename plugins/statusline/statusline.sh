#!/usr/bin/env bash
# Claude Code statusline.
# Format: cwd | model | ctx: pct [used/total] | 5h: X% [time-left: burn×]  7d: Y% [time-left: burn×]
# Burn ratio = used% / elapsed%; colored yellow when >= 1.0× (on-pace or ahead).

input=$(cat)

HOME="${HOME:-$(getent passwd "$(id -un)" | cut -d: -f6)}"
export HOME

jq -r --arg home "$HOME" '
  def k: if . == null then "?" else (. / 1000 | floor | tostring) + "k" end;
  def pct: if . == null then "?" else (floor | tostring) + "%" end;

  def fmt_remaining:
    if . == null then "-"
    elif . <= 0 then "0m"
    elif . < 3600 then ((. / 60) | floor | tostring) + "m"
    elif . < 86400 then
      ((. / 3600) | floor) as $h
      | (((. - $h*3600) / 60) | floor) as $m
      | "\($h)h\($m)m"
    else
      ((. / 86400) | floor) as $d
      | (((. - $d*86400) / 3600) | floor) as $h
      | "\($d)d\($h)h"
    end;

  def burn_ratio(used; remaining; duration):
    if (used == null or remaining == null) then null
    elif remaining >= duration then 0
    else
      ((duration - remaining) / duration * 100) as $elapsed
      | if $elapsed <= 0 then 0 else (used / $elapsed) end
    end;

  def fmt1:
    (. * 10 | floor) as $scaled
    | ($scaled / 10 | floor) as $whole
    | ($scaled - $whole * 10) as $frac
    | "\($whole).\($frac)";

  def burn_fmt:
    if . == null then "-"
    else
      (. | fmt1) as $r
      | if . >= 1.0 then "\u001b[33m\($r)×\u001b[0m" else "\($r)×" end
    end;

  # Compound red: section turns fully red when projected to exhaust
  # AND already past the half-budget point — "burn > 1.0 AND used > 50".
  # Yellow × remains the softer signal for "over pace but still within
  # half-budget territory".
  def section(window; prefix; used; remaining; burn):
    if used == null then ""
    elif (burn != null and burn >= 1.0 and used > 50) then
      "\(prefix)\u001b[31m\(window): \(used | pct) [\(remaining | fmt_remaining): \(burn | fmt1)×]\u001b[0m"
    else
      "\(prefix)\(window): \(used | pct) [\(remaining | fmt_remaining): \(burn | burn_fmt)]"
    end;

  (.cwd | sub("^" + $home; "~")) as $cwd
  | .model.display_name as $model
  | .context_window.context_window_size as $ctx_total
  | (.context_window.used_percentage // 0) as $ctx_pct
  | (($ctx_total // 0) * $ctx_pct / 100 | floor) as $ctx_used
  | now as $now
  | .rate_limits.five_hour.used_percentage as $rl5
  | .rate_limits.five_hour.resets_at as $rl5_reset
  | .rate_limits.seven_day.used_percentage as $rl7
  | .rate_limits.seven_day.resets_at as $rl7_reset
  | (if $rl5_reset != null then ($rl5_reset - $now) else null end) as $rl5_remaining
  | (if $rl7_reset != null then ($rl7_reset - $now) else null end) as $rl7_remaining
  | burn_ratio($rl5; $rl5_remaining; 18000) as $rl5_burn
  | burn_ratio($rl7; $rl7_remaining; 604800) as $rl7_burn

  | "\($cwd) | \($model) | ctx: \($ctx_pct | pct) [\($ctx_used | k)/\($ctx_total | k)]"
    + section("5h"; " | "; $rl5; $rl5_remaining; $rl5_burn)
    + section("7d"; "  "; $rl7; $rl7_remaining; $rl7_burn)
' <<<"$input"
