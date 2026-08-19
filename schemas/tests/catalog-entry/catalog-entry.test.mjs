// Validate every ID-prefixed catalogue entry's frontmatter against the catalogue-entry schema.
//
// The point of this test is not that the entries are currently valid. It is that a purged
// bookkeeping field cannot come back: the schema sets additionalProperties to false, so
// reintroducing added, provenance, source-tele or retrieved fails here rather than
// accumulating unread in 87 files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS = path.resolve(HERE, '../..');
const ROOT = path.resolve(SCHEMAS, '..');

// skills/ holds K* catalogue stubs alongside skill directories; only the stubs are entries,
// and the directory bodies are filtered out below because they declare no id.
const CATALOGUE_DIRS = ['axioms', 'style', 'methodology', 'roles', 'patterns', 'domains', 'work-types', 'backlog', 'skills', 'schemas'];

const schema = JSON.parse(readFileSync(path.join(SCHEMAS, 'catalog-entry/v1alpha1/catalog-entry.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

// Lenient frontmatter reader: flat scalars, inline [a, b] lists, and block lists.
// Dependency-free on purpose, matching tools/skill-graph.mjs.
function frontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const out = {};
	let key = null;
	for (const raw of m[1].split('\n')) {
		const line = raw.replace(/\s+#.*$/, '');
		if (!line.trim()) continue;
		const block = line.match(/^\s*-\s+(.*)$/);
		if (block && key) { (out[key] ||= []).push(strip(block[1])); continue; }
		const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		key = kv[1];
		const value = kv[2].trim();
		if (value === '') { out[key] = []; continue; }
		if (value.startsWith('[')) {
			out[key] = value.replace(/^\[|\]$/g, '').split(',').map(strip).filter(Boolean);
			continue;
		}
		out[key] = scalar(strip(value));
		key = null;
	}
	return out;
}
const strip = (s) => s.trim().replace(/^["']|["']$/g, '');
// YAML scalars are typed: an unquoted true/false is a boolean, not the string "true".
const scalar = (s) => (s === 'true' ? true : s === 'false' ? false : s);

function entries() {
	const found = [];
	for (const dir of CATALOGUE_DIRS) {
		const abs = path.join(ROOT, dir);
		if (!existsSync(abs)) continue;
		for (const f of readdirSync(abs)) {
			if (!f.endsWith('.md')) continue;
			const text = readFileSync(path.join(abs, f), 'utf8');
			const fm = frontmatter(text);
			if (fm && fm.id) found.push({ file: `${dir}/${f}`, fm });
		}
	}
	return found;
}

const all = entries();

test('the catalogue is non-empty, so a passing run is not vacuous', () => {
	assert.ok(all.length >= 80, `expected at least 80 entries, found ${all.length}`);
});

for (const { file, fm } of all) {
	test(`frontmatter conforms: ${file}`, () => {
		const ok = validate(fm);
		const why = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
		assert.ok(ok, `${file}: ${why}`);
	});
}

test('purged bookkeeping fields are rejected, not merely absent', () => {
	for (const banned of ['added', 'provenance', 'source-tele', 'retrieved', 'upstream-sha256', 'local-deviation']) {
		const probe = { id: 'A0', category: 'axiom', title: 't', status: 'active', 'applies-to': ['x'], related: ['A1'], [banned]: 'x' };
		assert.equal(validate(probe), false, `schema must reject the field ${banned}`);
	}
});
