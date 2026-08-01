The directory containing this package is the complete installable Survey
system. Resolve every owned path from that directory. Never search for a Git
root, governance document, sibling skill, parent package, or parent
`node_modules`.

Use `./compile.sh` as the sole build entry. It may only locate the physical
root and execute `source/executables/compiler/build.mjs`. Treat `SKILL.md`,
`references/`, `scripts/`, `assets/`, and `generated/` as checked projections,
never compiler inputs.

Install and test the whole root. Do not install a generated subset, expose the
staging root through automatic discovery, or modify canonical
`skills/survey`.
