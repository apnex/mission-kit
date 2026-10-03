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
const CATALOGUE_DIRS = ['axioms', 'style', 'methods', 'sets', 'traits', 'rules', 'practices', 'roles', 'patterns', 'domains', 'work-types', 'skills', 'schemas', 'entities', 'components', 'artifacts'];

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

// Delta-1 stage 1. Each probe is the defect the new layers must refuse; each was removed from the
// schema once to confirm this test goes red without it.
test('a rule must declare the trace a check could test', () => {
	const rule = { id: 'RU1', category: 'rule', title: 't', status: 'active', 'hydrate-when': 'You are about to defer a unit of tracked work', related: ['A4'] };
	assert.equal(validate(rule), false, 'a rule with no trace must be refused');
	assert.equal(validate({ ...rule, trace: 'the deferral record carries a revival trigger field' }), true, 'a rule with a trace must be accepted');
	assert.equal(validate({ ...rule, trace: 'short' }), false, 'a trace too short to state an observation must be refused');
});

test('the new prefixes are accepted, and a malformed one is refused', () => {
	const base = { title: 't', status: 'active', 'hydrate-when': 'You are about to author a new entry in a collection', related: ['A4'] };
	assert.equal(validate({ ...base, id: 'PC1', category: 'practice' }), true, 'PC1 practice must be accepted');
	assert.equal(validate({ ...base, id: 'RUX1', category: 'rule', trace: 'the deferral record carries a revival trigger field' }), false, 'a malformed rule id must be refused');
	assert.equal(validate({ ...base, id: 'M9', category: 'method' }), true, 'a method entry must be accepted');
});

// Delta-2 stage 1. A spanning set must declare members, and only a set may.
test('a set must declare members, and only a set may', () => {
	const set = { id: 'ST1', category: 'set', title: 't', status: 'active', 'hydrate-when': 'You are about to communicate with a human of limited context', related: ['ST0'] };
	assert.equal(validate(set), false, 'a set with no members must be refused');
	assert.equal(validate({ ...set, members: [] }), false, 'a set with an empty members list must be refused');
	assert.equal(validate({ ...set, members: ['S15'] }), true, 'a set with members must be accepted');
	assert.equal(validate({ id: 'S99', category: 'style', title: 't', status: 'active', 'hydrate-when': 'You are about to write a document someone will read', members: ['S1'] }), false, 'members on a non-set entry must be refused');
});

