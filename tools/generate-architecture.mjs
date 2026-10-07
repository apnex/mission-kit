#!/usr/bin/env node
// generate-architecture - derive the structural sections of docs/ARCHITECTURE.md from the corpus.
//
// Sovereign duty: the current architecture's structure, derived and no other. AR1 forbids a
// hand-authored current projection, because a hand-written statement of where a system is drifts
// from the system. For a corpus the running system is the repository itself, so the structure is
// read from it: the layers from the root README's table, each layer's duty and the layers it draws
// on from its charter, its population from its directory, and the gate's checks from check-all.sh.
// The reasoning sections - identity, justification, alignment, risks - stay authored.
//
// Regions are delimited <!-- BEGIN GENERATED: architecture-<name> ... --> / <!-- END GENERATED:
// architecture-<name> -->.
//
// Usage:  node tools/generate-architecture.mjs           regenerate
//         node tools/generate-architecture.mjs --check   exit non-zero if a region is stale

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = path.join(ROOT, 'docs/ARCHITECTURE.md');
const check = process.argv.includes('--check');
if (!existsSync(target)) { console.log('no docs/ARCHITECTURE.md; nothing to derive.'); process.exit(0); }

const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const fm = (text) => {
	const m = /^---\n([\s\S]*?)\n---/.exec(text); if (!m) return {};
	const o = {}; for (const l of m[1].split('\n')) { const kv = /^([\w-]+):\s*(.*)$/.exec(l); if (kv) o[kv[1]] = kv[2].trim(); }
	return o;
};
const list = (v) => String(v || '').replace(/[[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean);

// The layer table in the root README is the authored list of layers; everything else is read.
const layers = [...read('README.md').matchAll(/^\| *`?([A-Z-]+)`? *\| *\[`([a-z-]+)\/`\]\([^)]*\) *\| *(.*?) *\|$/gm)]
	.map((m) => ({ prefix: m[1], dir: m[2], blurb: m[3] }));
const knowledge = layers.filter((l) => l.prefix !== '-');
const prefixOf = (id) => (/^([A-Z]+)\d/.exec(id) || [])[1];

const rowsKnowledge = knowledge.map((l) => {
	const charter = path.join(l.dir, 'README.md');
	const c = existsSync(path.join(ROOT, charter)) ? fm(read(charter)) : {};
	const duty = String(c.title || '').split(' - ').slice(1).join(' - ') || l.blurb;
	const members = readdirSync(path.join(ROOT, l.dir)).filter((f) => f.endsWith('.md') && f !== 'README.md')
		.filter((f) => { const e = fm(read(path.join(l.dir, f))); return e.id && e.status !== 'superseded'; }).length;
	const draws = [...new Set(list(c.related).map(prefixOf).filter((p) => p && p !== l.prefix))]
		.filter((p) => knowledge.some((k) => k.prefix === p)).map((p) => `\`${p}\``).join(', ') || '-';
	return `| \`${l.dir}/\` | \`${l.prefix}\` | ${duty.replace(/\|/g, '/')} | ${members} | ${draws} |`;
});
const tablesKnowledge = ['| Layer | Prefix | Duty, from its charter | Members | Draws on, from its charter |', '|---|---|---|---|---|', ...rowsKnowledge].join('\n');

const other = layers.filter((l) => l.prefix === '-').map((l) => {
	const n = l.dir === 'tools' ? readdirSync(path.join(ROOT, 'tools')).filter((f) => /\.(mjs|sh)$/.test(f)).length : null;
	return `| \`${l.dir}/\` | ${l.blurb.replace(/\|/g, '/')}${n !== null ? ` ${n} scripts.` : ''} |`;
});
const tableOther = ['| Layer | Duty |', '|---|---|', ...other].join('\n');

const checks = [...read('tools/check-all.sh').matchAll(/^run "([^"]+)" (.*)$/gm)]
	.map((m) => { const t = (/tools\/([\w.-]+)/.exec(m[2]) || [])[1] || 'schemas test suite'; return `| ${m[1]} | \`${t}\` |`; });
const tableChecks = ['| The gate holds | By |', '|---|---|', ...checks, '| every changed markdown file keeps the style rules a script can hold | the `s*` tools, on changed files |'].join('\n');

let text = readFileSync(target, 'utf8');
const next0 = text;
let missing = 0;
for (const [name, body] of [['layers', tablesKnowledge], ['other-layers', tableOther], ['checks', tableChecks]]) {
	const B = `<!-- BEGIN GENERATED: architecture-${name}. Run tools/generate-architecture.mjs; do not edit by hand. -->`;
	const E = `<!-- END GENERATED: architecture-${name} -->`;
	const i = text.indexOf(B), j = text.indexOf(E);
	if (i === -1 || j === -1) { console.log(`FAIL  docs/ARCHITECTURE.md has no ${name} region`); missing++; continue; }
	text = text.slice(0, i) + B + '\n' + body + '\n' + text.slice(j);
}
if (missing) process.exit(1);
if (check) {
	if (text !== next0) { console.log('FAIL  the derived sections of docs/ARCHITECTURE.md are stale; run tools/generate-architecture.mjs'); process.exit(1); }
	console.log(`architecture: ${knowledge.length} knowledge layers, ${other.length} others and ${checks.length} gate checks derived and current.`);
} else {
	if (text !== next0) writeFileSync(target, text);
	console.log(`architecture: ${knowledge.length} knowledge layers, ${other.length} others and ${checks.length} gate checks derived.`);
}
