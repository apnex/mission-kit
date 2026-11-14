#!/usr/bin/env node
// check-component-edges - verify bidirectional component edge agreement and status invariants.
//
// Sovereign duty: components/ edge consistency (Consumes <-> Consumed-by, Contains <-> Contained-by,
// draft consumer boundary per 0116, and inactive tombstone zero-edge isolation per M13) and no other.
// Resolves B112: nothing previously checked that a component's Consumes and its peers' Consumed-by agree.
//
// Usage:  node tools/check-component-edges.mjs [--dir DIR]

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let compDir = path.join(ROOT, 'components');
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
	if (args[i] === '--dir') {
		if (!args[i + 1]) { console.error('FAIL  usage  --dir requires a directory path'); process.exit(2); }
		compDir = path.resolve(args[++i]);
	} else {
		console.error(`FAIL  usage  unknown argument '${args[i]}'`);
		process.exit(2);
	}
}

if (!existsSync(compDir)) {
	console.error(`FAIL  missing  component directory does not exist: ${compDir}`);
	process.exit(1);
}

function parseFrontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return {};
	const out = {};
	for (const line of m[1].split('\n')) {
		const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
	}
	return out;
}

function parseEdges(text) {
	const norm = text.replace(/\r\n/g, '\n');
	const secMatch = norm.match(/(?:^|\n)## Edges[ \t]*\n([\s\S]*?)(?=\n## |\s*$)/);
	const result = { Contains: [], 'Contained-by': [], Consumes: [], 'Consumed-by': [] };
	if (!secMatch) return result;
	const body = secMatch[1];
	const chunks = body.split(/(?=^\*\*(?:Contains|Contained-by|Consumes|Consumed-by)\*\*[ \t]*-)/m);
	for (const chunk of chunks) {
		const m = chunk.match(/^\*\*(Contains|Contained-by|Consumes|Consumed-by)\*\*[ \t]*-[ \t]*([\s\S]*)$/);
		if (!m) continue;
		const label = m[1];
		for (const x of m[2].matchAll(/\[`(C\d+)`\]\(/g)) {
			if (!result[label].includes(x[1])) result[label].push(x[1]);
		}
	}
	return result;
}

const files = readdirSync(compDir)
	.filter((f) => /^C[1-9][0-9]*-.*\.md$/.test(f))
	.sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

const components = new Map();
const errors = [];

for (const file of files) {
	const text = readFileSync(path.join(compDir, file), 'utf8');
	const fm = parseFrontmatter(text);
	const id = fm.id;
	if (!id || !/^C[1-9][0-9]*$/.test(id)) {
		errors.push(`${file}: missing valid C<N> frontmatter id`);
		continue;
	}
	if (components.has(id)) {
		errors.push(`${file}: duplicate component id '${id}' (already declared in ${components.get(id).file})`);
		continue;
	}
	const status = fm.status || 'active';
	const edges = parseEdges(text);
	components.set(id, { id, file, status, edges });
}

if (components.size === 0) {
	console.error(`FAIL  empty  no component entries found in ${compDir}`);
	process.exit(1);
}

const edgeFields = ['Consumes', 'Consumed-by', 'Contains', 'Contained-by'];
let edgeCount = 0;

for (const [id, comp] of components) {
	const inactive = comp.status === 'retired' || comp.status === 'superseded';

	for (const field of edgeFields) {
		for (const target of comp.edges[field]) {
			edgeCount++;
			if (target === id) {
				errors.push(`${comp.file} (${id}): self-loop in ${field} -> ${target}`);
				continue;
			}
			const peer = components.get(target);
			if (!peer) {
				errors.push(`${comp.file} (${id}): dangling component reference in ${field} -> ${target}`);
				continue;
			}
			if (inactive) {
				errors.push(`${comp.file} (${id}): status '${comp.status}' must isolate with zero edges, found ${field} -> ${target}`);
			} else if (peer.status === 'retired' || peer.status === 'superseded') {
				errors.push(`${comp.file} (${id}): ${field} targets '${peer.status}' component ${target} (${peer.file})`);
			}
		}
	}

	// Symmetry: Consumes <-> Consumed-by and Contains <-> Contained-by
	for (const target of comp.edges.Consumes) {
		const peer = components.get(target);
		if (!peer) continue;
		if (!peer.edges['Consumed-by'].includes(id)) {
			errors.push(`${comp.file} (${id}): Consumes ${target}, but ${peer.file} (${target}) omits ${id} from Consumed-by`);
		}
		// Per ruling 0116: active components do not depend on draft components.
		if (comp.status === 'active' && peer.status === 'draft') {
			errors.push(`${comp.file} (${id}): active component declares Consumes -> draft ${target} (${peer.file})`);
		}
	}
	for (const target of comp.edges['Consumed-by']) {
		const peer = components.get(target);
		if (!peer) continue;
		if (!peer.edges.Consumes.includes(id)) {
			errors.push(`${comp.file} (${id}): Consumed-by names ${target}, but ${peer.file} (${target}) omits ${id} from Consumes`);
		}
	}
	for (const target of comp.edges.Contains) {
		const peer = components.get(target);
		if (!peer) continue;
		if (!peer.edges['Contained-by'].includes(id)) {
			errors.push(`${comp.file} (${id}): Contains ${target}, but ${peer.file} (${target}) omits ${id} from Contained-by`);
		}
		if (comp.status === 'active' && peer.status === 'draft') {
			errors.push(`${comp.file} (${id}): active component declares Contains -> draft ${target} (${peer.file})`);
		}
	}
	for (const target of comp.edges['Contained-by']) {
		const peer = components.get(target);
		if (!peer) continue;
		if (!peer.edges.Contains.includes(id)) {
			errors.push(`${comp.file} (${id}): Contained-by names ${target}, but ${peer.file} (${target}) omits ${id} from Contains`);
		}
	}
}

if (errors.length > 0) {
	for (const e of errors) console.log(`FAIL  edges  ${e}`);
	console.log(`\n${errors.length} component edge defect(s).`);
	process.exit(1);
}

console.log(`component edges: ${components.size} component(s), ${edgeCount} directed edge reference(s) symmetric and valid.`);
