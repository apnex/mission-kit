Keep this package at staging path `skills/survey-v2`, excluded from bundles,
routers and normal skill installation. Generate immutable frontmatter
`name: survey` from the first build so a later canary or promotion never
rewrites bytes.

Do not run a live Director canary under implementation authority. A separately
authorized canary may copy the complete sealed root to an isolated
`<CODEX_HOME>/skills/survey` with no v1 present and invoke it explicitly.

Canonical promotion requires separate reviewed authority, all G0–G7 evidence,
an exact package digest, an atomic no-rewrite replacement of `skills/survey`,
discovery updates, staging retirement and tested v1 rollback. This package
cannot perform or authorize that effect.
