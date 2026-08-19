# Plugins

Operator-facing artifacts that run inside a specific agent host.

A plugin is a thing an operator installs into a harness, not a thing the corpus knows.\
It is portable in the sense the charter requires - a different team on different hardware running the same host can install it directly - while remaining bound to that host's extension surface.

## Plugins are not entries

A plugin is mechanism, not knowledge, so it takes no ID and appears in no ledger.\
The discriminator is in the root charter under `Adding and retiring a layer`, and is not restated here.

The knowledge a plugin embodies is a separate question from the plugin.\
Where a design generalises beyond its host, it belongs in `patterns/` or as an axiom instance, cited by the plugin rather than duplicated into it.

---

## Not tools

[`tools/`](../tools/README.md) owns the scripts that hold the corpus to its own rules.\
A plugin holds nothing to any rule; it renders or acts inside a host for an operator.\
Filing one under `tools/` would give that directory a second concern.

---

## Current plugins

| Plugin | Host | State |
| --- | --- | --- |
| [`statusline/`](statusline/README.md) | Claude Code | Runnable as shipped, bash and `jq`. |
| [`statusline-pi/`](statusline-pi/README.md) | pi | Design of record; implementation pending. The canonical A5 instance. |

`statusline-pi/` currently carries a design rather than an implementation, and its authoritative specification lives outside this repository.\
It is held here as the portable summary, which means it is a derived representation and will drift if the upstream spec moves without it.
