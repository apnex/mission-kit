#!/usr/bin/env node
// skill-graph — lint the SKILL.md catalogue as a DAG and derive levels.
//
// The catalogue is a hierarchy expressed as EDGES, not numbered names. Each canonical SKILL.md may declare,
// in its `metadata`, `prerequisite:` (vertical: read-first) and `composes:` (a specialist system over the
// primitives it is built from). This lint makes those edges load-bearing instead of narrative:
//   - every prerequisite / composes target resolves to a real skill;
//   - the graph is acyclic;
//   - "level" is DERIVED (longest path from a root), never stored in a name;
//   - every bundle's `skills:` entry resolves.
// Exit non-zero on any broken edge or cycle. Dependency-free (no YAML lib); lenient frontmatter parse.
//
// Usage:  node tools/skill-graph.mjs            (from the mission-kit root)

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
	return { name, prerequisite: edges('prerequisite'), composes: edges('composes') };
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
	skills.set(parsed.name, parsed);
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

// --- report ---
const byLevel = [...skills.keys()].sort((a, b) => level.get(a) - level.get(b) || a.localeCompare(b));
console.log('skill graph — derived levels (L = longest prerequisite/composes path from a root):\n');
for (const name of byLevel) {
	const s = skills.get(name);
	const tags = [...s.prerequisite.map((p) => `prereq:${p}`), ...s.composes.map((c) => `composes:${c}`)];
	console.log(`  L${level.get(name)}  ${name}${tags.length ? '   (' + tags.join(', ') + ')' : ''}`);
}
console.log();
if (errors.length) { for (const e of errors) console.log(`FAIL  ${e}`); console.log(`\n${errors.length} error(s).`); process.exit(1); }
console.log(`PASS — ${skills.size} skills, graph acyclic, all edges + bundle entries resolve.`);
