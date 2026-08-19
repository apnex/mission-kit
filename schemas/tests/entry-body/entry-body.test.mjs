// entry-body contract tests.
//
// Two things are worth asserting and they are different claims. The declaration must satisfy its
// own schema, which is structure. And every category it governs must be a category the catalogue
// entry contract admits, which is agreement between two contracts that are free to drift apart.
//
// The second is the one that would have caught a governed category being renamed in one file and
// not the other, which no amount of validating either file alone can see.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const SCHEMAS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(readFileSync(path.join(SCHEMAS, rel), 'utf8'));

const catalog = readJson('catalog.json');
const ajv = new Ajv2020({ strict: false });
for (const entry of catalog.schemas) ajv.addSchema(readJson(entry.path));

const declaration = readJson('entry-body/v1alpha1/entry-body.json');
const validate = ajv.getSchema('urn:mission-kit:schemas:entry-body:entry-body:v1alpha1');

test('entry-body schema is registered in the catalog', () => {
	assert.ok(validate, 'entry-body schema did not resolve from catalog.json');
});

test('the declaration conforms to its schema', () => {
	assert.ok(validate(declaration), JSON.stringify(validate.errors));
});

test('every governed category is one the catalogue entry contract admits', () => {
	const admitted = readJson('catalog-entry/v1alpha1/catalog-entry.schema.json')
		.properties.category.enum;
	for (const c of declaration.spec.categories) {
		assert.ok(admitted.includes(c.category),
			`entry-body governs '${c.category}', which catalog-entry does not admit`);
	}
});

test('no category is declared twice', () => {
	const names = declaration.spec.categories.map((c) => c.category);
	assert.equal(new Set(names).size, names.length, `duplicate category in ${names.join(', ')}`);
});

test('every governed category states why its shape is what it is', () => {
	for (const c of declaration.spec.categories) {
		assert.ok(c.rationale && c.rationale.trim().length > 0,
			`category '${c.category}' declares sections with no rationale`);
	}
});
