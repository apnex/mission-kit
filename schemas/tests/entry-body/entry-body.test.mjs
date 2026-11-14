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
import { readFileSync, readdirSync } from 'node:fs';
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

test('every SC* contract stub and every apiVersion/kind resource schema is registered in catalog.json', () => {
	const schemaPaths = new Set(catalog.schemas.map((s) => s.path));
	const stubs = readdirSync(SCHEMAS).filter((f) => /^SC[1-9]\d*-.+\.md$/.test(f)).sort();
	assert.ok(stubs.length >= 6, `expected at least 6 SC* stubs, found ${stubs.length}`);
	for (const stub of stubs) {
		const text = readFileSync(path.join(SCHEMAS, stub), 'utf8');
		const m = text.match(/Canonical contract:\s*\[`[^`]+`\]\(([^)]+\.schema\.json)\)/);
		assert.ok(m, `${stub} does not declare a Canonical contract .schema.json link`);
		assert.ok(schemaPaths.has(m[1]), `${stub} canonical contract '${m[1]}' is missing from catalog.json schemas`);
	}

	let resourceSchemasChecked = 0;
	for (const entry of catalog.schemas) {
		if (entry.role !== 'resource') continue;
		const schemaObj = readJson(entry.path);
		const apiVersion = schemaObj.properties?.apiVersion?.const;
		const kind = schemaObj.properties?.kind?.const;
		if (!apiVersion || !kind) continue;
		resourceSchemasChecked++;
		const matches = catalog.resources.filter(
			(r) => r.apiVersion === apiVersion && r.kind === kind && r.schemaId === entry.id,
		);
		assert.equal(
			matches.length,
			1,
			`resource schema ${entry.id} (${apiVersion}/${kind}) must appear exactly once in catalog.json resources`,
		);
	}
	assert.ok(
		resourceSchemasChecked >= 3,
		`expected at least 3 resource schemas with apiVersion/kind, checked ${resourceSchemasChecked}`,
	);
});
