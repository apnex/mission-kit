#!/usr/bin/env node
// skill-graph — lint the SKILL.md catalogue as a DAG and derive levels.
//
// The catalogue is a hierarchy expressed as EDGES, not numbered names. Each canonical SKILL.md may declare,
// in its `metadata`, `prerequisite:` (vertical: read-first) and `composes:` (a specialist system over the
// primitives it is built from). This lint makes those edges load-bearing instead of narrative:
//   - every prerequisite / composes target resolves to a real skill;
//   - the graph is acyclic;
//   - "level" is DERIVED (longest path from a root), never stored in a name;
//   - composes-vs-MODEL: each composed primitive's construct family actually appears in the skill's assets;
//   - every bundle's `skills:` entry resolves.
// Exit non-zero on any broken edge or cycle. Dependency-free (no YAML lib); lenient frontmatter parse.
//
// Usage:  node tools/skill-graph.mjs            (from the mission-kit root)

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadCanonical as loadWorkGraphLifecycle, validateLifecycle as validateWorkGraphLifecycle } from '../skills/arc-lifecycle/assets/validate-workgraph-lifecycle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(ROOT, 'skills');
const BUNDLES = path.join(ROOT, 'bundles');

// --- parse the YAML frontmatter of a SKILL.md (name + the metadata edge fields), dependency-free ---
function parseSkill(file) {
	const text = readFileSync(file, 'utf8');
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const fm = m[1];
	const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
	if (!name) return null;
	// edge fields may be top-level or nested under metadata: — match anywhere in the frontmatter
	const edges = (key) => {
		const v = (fm.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm')) || [])[1];
		if (!v) return [];
		return v.replace(/[\[\]]/g, '').split(',')
			.map((s) => s.trim())
			// keep bare skill-name tokens only (drop prose like "sysml-modelling skills (model-a-…, …)")
			.filter((s) => /^[a-z0-9-]+$/.test(s));
	};
	// model-asset: names the .sysml file(s) that ARE the composition (so the composes-vs-model check reads the
	// MODEL, not the dogfood scaffolding — well-formedness.sysml/procedure assets are always constraint/action defs).
	const files = (key) => {
		const v = (fm.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm')) || [])[1];
		if (!v) return [];
		return v.replace(/[\[\]]/g, '').split(',').map((s) => s.trim()).filter((s) => /^[\w.\-]+\.sysml$/.test(s));
	};
	return { name, prerequisite: edges('prerequisite'), composes: edges('composes'), modelAsset: files('model-asset') };
}

// --- collect every canonical skill (a folder containing SKILL.md with a name) ---
const skills = new Map();
for (const ent of readdirSync(SKILLS)) {
	const dir = path.join(SKILLS, ent);
	if (!statSync(dir).isDirectory()) continue;
	const sk = path.join(dir, 'SKILL.md');
	if (!existsSync(sk)) continue;
	const parsed = parseSkill(sk);
	if (!parsed) continue;
	if (parsed.name !== ent) console.warn(`WARN  ${ent}/SKILL.md declares name '${parsed.name}' (should match folder)`);
	skills.set(parsed.name, { ...parsed, dir });
}

const errors = [];
const edgesOf = (s) => [...s.prerequisite, ...s.composes];

// --- 1. every edge target resolves ---
for (const s of skills.values())
	for (const t of edgesOf(s))
		if (!skills.has(t)) errors.push(`unresolved edge: ${s.name} -> ${t} (no such skill)`);

// --- 2. acyclic + 3. derived level = longest path from a root (memoized DFS with cycle guard) ---
const level = new Map();
const onStack = new Set();
function depth(name, trail = []) {
	if (level.has(name)) return level.get(name);
	if (onStack.has(name)) { errors.push(`cycle: ${[...trail, name].join(' -> ')}`); return 0; }
	onStack.add(name);
	const s = skills.get(name);
	const parents = s ? edgesOf(s).filter((t) => skills.has(t)) : [];
	const d = parents.length ? 1 + Math.max(...parents.map((p) => depth(p, [...trail, name]))) : 0;
	onStack.delete(name);
	level.set(name, d);
	return d;
}
for (const name of skills.keys()) depth(name);

// --- 5. composes-vs-MODEL: each composed primitive's construct family must appear in the skill's assets ---
// Turns a `composes:` claim into a tested invariant (twin-parity — a declared edge + the model it claims must
// agree): a composed skill must
// actually use the construct of each primitive it claims to compose, or the composition is a paper claim.
const COMPOSES_CONSTRUCT = {
	'model-a-state-machine':    { re: /\bstate\s+def\b/,            what: 'a state def' },
	'model-a-workflow':         { re: /\baction\s+def\b/,           what: 'an action def' },
	'model-a-component':        { re: /\bpart\s+def\b/,             what: 'a part def' },
	'model-a-dependency-graph': { re: /\bref\s+\w+\s*:\s*\w+\s*\[/, what: 'a ref-edge with multiplicity' },
	'model-a-constraint':       { re: /\bconstraint\s+def\b/,       what: 'a constraint def' },
	'model-a-classification':   { re: /\benum\s+def\b/,             what: 'an enum def' },
};
for (const s of skills.values()) {
	if (!s.composes.length) continue;
	if (!s.modelAsset.length) {
		errors.push(`composes-vs-model: ${s.name} composes but declares no \`model-asset:\` (which asset(s) ARE the composition?)`);
		continue;
	}
	let blob = '';
	for (const fn of s.modelAsset) {
		const p = path.join(s.dir, 'assets', fn);
		if (existsSync(p)) blob += readFileSync(p, 'utf8') + '\n';
		else errors.push(`composes-vs-model: ${s.name} model-asset '${fn}' not found`);
	}
	// strip comments (block `/* */` incl. `doc`, and line `//`) so a construct merely NAMED in prose
	// doesn't satisfy the check — only a real declaration in code counts.
	blob = blob.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
	for (const c of s.composes) {
		const sig = COMPOSES_CONSTRUCT[c];
		if (sig && !sig.re.test(blob))
			errors.push(`composes-vs-model: ${s.name} composes '${c}' but no ${sig.what} appears in its model-asset(s)`);
	}
}

// --- 4. every bundle's skills: entry resolves ---
if (existsSync(BUNDLES)) {
	for (const f of readdirSync(BUNDLES).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))) {
		const text = readFileSync(path.join(BUNDLES, f), 'utf8');
		const block = text.split(/^skills:\s*$/m)[1] || '';
		for (const line of block.split('\n')) {
			const mm = line.match(/^\s*-\s*([a-z0-9-]+)/);  // skip commented (#) / blank lines
			if (mm && !skills.has(mm[1])) errors.push(`bundle ${f}: lists '${mm[1]}' (no such skill)`);
		}
	}
}

// --- 6. canonical WorkGraph lifecycle + skill-selection routes stay aligned with this catalogue/bundle ---
try {
	const { lifecycle, selection } = loadWorkGraphLifecycle();
	for (const error of validateWorkGraphLifecycle(lifecycle, selection, { root: ROOT }))
		errors.push(`workgraph-lifecycle: ${error}`);
} catch (error) {
	errors.push(`workgraph-lifecycle: validator threw: ${error.message}`);
}

// --- report ---
const byLevel = [...skills.keys()].sort((a, b) => level.get(a) - level.get(b) || a.localeCompare(b));
console.log('skill graph — derived levels (L = longest prerequisite/composes path from a root):\n');
for (const name of byLevel) {
	const s = skills.get(name);
	const tags = [...s.prerequisite.map((p) => `prereq:${p}`), ...s.composes.map((c) => `composes:${c}`)];
	console.log(`  L${level.get(name)}  ${name}${tags.length ? '   (' + tags.join(', ') + ')' : ''}`);
}
console.log();
// Every skill directory must have a K* catalogue stub beside it, or it is loadable and
// invisible: absent from INDEX.md, unreachable by ID, and routed to by nothing.
for (const dir of readdirSync(SKILLS)) {
	const body = path.join(SKILLS, dir, 'SKILL.md');
	if (!existsSync(body)) continue;
	const stub = readdirSync(SKILLS).some((f) => /^K\d+-/.test(f) && f.endsWith(`-${dir}.md`));
	if (!stub) errors.push(`uncatalogued skill: skills/${dir}/ has no K* stub, so nothing can route to it`);
}

if (errors.length) { for (const e of errors) console.log(`FAIL  ${e}`); console.log(`\n${errors.length} error(s).`); process.exit(1); }
console.log(`PASS — ${skills.size} skills, graph acyclic, all edges + bundle entries resolve, composes-vs-model holds, WorkGraph lifecycle/selection conforms.`);
