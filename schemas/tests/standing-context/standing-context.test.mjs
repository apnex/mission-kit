// Validate the standing-context frontmatter contract, and the template that instantiates it.
//
// The document under test is whatever path STANDING_CONTEXT_DOC names, defaulting to the template
// shipped here. That indirection is the point: the contract travels with the knowledge base, and
// the instance it validates can live on any machine.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS = path.resolve(HERE, '../..');
const ROOT = path.resolve(SCHEMAS, '..');

const schema = JSON.parse(readFileSync(path.join(SCHEMAS, 'standing-context/v1alpha1/standing-context.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

// Minimal frontmatter reader: scalars and inline [a, b] lists, which is all this contract uses.
function frontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const out = {};
	for (const line of m[1].split('\n')) {
		const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		const [, key, raw] = kv;
		const value = raw.trim();
		if (value.startsWith('[')) {
			out[key] = value.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
		} else if (/^\d+$/.test(value)) {
			out[key] = Number(value);
		} else {
			out[key] = value.replace(/^["']|["']$/g, '');
		}
	}
	return out;
}

const docPath = process.env.STANDING_CONTEXT_DOC || path.join(ROOT, '_template-standing-context.md');
const fm = frontmatter(readFileSync(docPath, 'utf8'));

test('the document declares frontmatter, so the contract is discoverable', () => {
	assert.ok(fm, `${docPath} has no frontmatter block`);
});

test(`frontmatter conforms: ${path.basename(docPath)}`, () => {
	const ok = validate(fm);
	const why = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
	assert.ok(ok, `${docPath}: ${why}`);
});

test('the contract rejects what it is meant to reject', () => {
	const base = {
		kind: 'standing-context',
		schema: 'urn:mission-kit:schemas:standing-context:standing-context:v1alpha1',
		'knowledge-base': 'https://github.com/apnex/mission-kit',
	};
	assert.equal(validate(base), true, 'a minimal valid document must pass');
	assert.equal(validate({ ...base, kind: 'something-else' }), false, 'wrong kind must fail');
	assert.equal(validate({ ...base, 'knowledge-base': 'file:///local/path' }), false, 'a non-https knowledge base must fail');
	assert.equal(validate({ ...base, added: '2026-01-01' }), false, 'an undeclared field must fail');
	assert.equal(validate({ ...base, 'max-bytes': 10 }), false, 'an implausible size bound must fail');
	delete base.kind;
	assert.equal(validate(base), false, 'a missing discriminator must fail');
});
