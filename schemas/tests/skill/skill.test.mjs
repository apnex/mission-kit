// Validate every portable skill body, and the properties a JSON Schema cannot express alone.
//
// Three checks live here rather than in the schema because each needs context the frontmatter
// does not carry: whether the name matches its directory, whether the description front-loads its
// condition, and whether a body is exempt from that shaping because it is a scaffold or vendored.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS = path.resolve(HERE, '../..');
const ROOT = path.resolve(SCHEMAS, '..');
const SKILLS = path.join(ROOT, 'skills');

const schema = JSON.parse(readFileSync(path.join(SCHEMAS, 'skill/v1alpha1/skill.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

// A condition an agent can evaluate, stated before the first sentence ends.
const CONDITION = /^[^.!?]*\b(?:use\s+(?:when|at|before|to|this)|appl(?:y|ies)\s+(?:when|whenever)|when\s+you|run\s+(?:when|as))\b/i;

// Lenient YAML reader: flat scalars, inline lists, block scalars, and one level of nesting.
// Dependency-free on purpose, matching tools/. Deeper structures are not used by this contract.
function frontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const lines = m[1].split('\n');
	const out = {};
	let i = 0;
	while (i < lines.length) {
		const raw = lines[i];
		const kv = raw.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (!kv) { i++; continue; }
		const [, key, rest] = kv;
		const v = rest.trim();
		i++;
		if (v === '|' || v === '>') {                       // block scalar
			const buf = [];
			while (i < lines.length && (lines[i].trim() === '' || /^\s{2,}/.test(lines[i]))) buf.push(lines[i++].trim());
			out[key] = buf.join(' ').trim();
		} else if (v.startsWith('[')) {                     // inline list
			out[key] = v.replace(/^\[|\]$/g, '').split(',').map(strip).filter(Boolean);
		} else if (v === '') {                              // block list, or a nested map
			const items = [], child = {};
			while (i < lines.length && /^\s+\S/.test(lines[i])) {
				const li = lines[i].match(/^\s*-\s+(.*)$/);
				const ck = lines[i].match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/);
				if (li) items.push(strip(li[1]));
				else if (ck) child[ck[1]] = strip(ck[2]);
				i++;
			}
			out[key] = items.length ? items : child;
		} else {
			out[key] = strip(v);
		}
	}
	return out;
}
const strip = (s) => s.trim().replace(/^["']|["']$/g, '');


// A package may declare the public name its generated body publishes under.
function publicName(slug) {
	for (const f of readdirSync(path.join(SKILLS, slug))) {
		if (!f.endsWith('package.json')) continue;
		try {
			const j = JSON.parse(readFileSync(path.join(SKILLS, slug, f), 'utf8'));
			if (j.publicSkillName) return j.publicSkillName;
		} catch { /* not a manifest we understand */ }
	}
	return null;
}

function stubStatus(slug) {
	const stub = readdirSync(SKILLS).find((f) => /^K\d+-/.test(f) && f === `${f.match(/^K\d+-/)[0]}${slug}.md`);
	if (!stub) return null;
	const m = readFileSync(path.join(SKILLS, stub), 'utf8').match(/^status:\s*(\S+)/m);
	return m ? m[1] : null;
}

const bodies = readdirSync(SKILLS)
	.filter((d) => existsSync(path.join(SKILLS, d, 'SKILL.md')))
	.map((d) => ({ slug: d, text: readFileSync(path.join(SKILLS, d, 'SKILL.md'), 'utf8') }));

test('skill bodies were found, so a passing run is not vacuous', () => {
	assert.ok(bodies.length >= 25, `expected at least 25 skill bodies, found ${bodies.length}`);
});

for (const { slug, text } of bodies) {
	test(`body conforms: ${slug}`, () => {
		const fm = frontmatter(text);
		assert.ok(fm, `${slug}: no frontmatter`);
		const ok = validate(fm);
		assert.ok(ok, `${slug}: ${(validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`);
		// A skill normally loads under its directory name. A package may publish under a
		// different public name, but only by declaring it, so the divergence is deliberate
		// and greppable rather than a typo nothing catches.
		const declared = publicName(slug);
		assert.ok(fm.name === slug || fm.name === declared,
			`${slug}: name is "${fm.name}" but the directory is "${slug}"` +
			(declared ? ` and the declared publicSkillName is "${declared}"` : ' and no publicSkillName is declared'));
	});

	test(`description routes: ${slug}`, () => {
		// A scaffold is not expected to route, and vendored text is not ours to reshape.
		if (stubStatus(slug) === 'stub') return;
		if (/^\s*source:\s*https?:\/\//m.test(text)) return;
		const d = String((frontmatter(text) || {}).description || '');
		assert.ok(CONDITION.test(d), `${slug}: description states no use-condition in its first sentence: "${d.slice(0, 90)}"`);
	});
}

test('the contract rejects what it is meant to reject', () => {
	const base = { name: 'a-skill', description: 'Use when you need a description long enough to clear the minimum.' };
	assert.equal(validate(base), true, 'a minimal valid body must pass');
	assert.equal(validate({ ...base, id: 'K1' }), false, 'catalogue placement must not appear in a portable body');
	assert.equal(validate({ ...base, status: 'active' }), false, 'a status must not appear in a portable body');
	assert.equal(validate({ ...base, name: 'Bad Name' }), false, 'a name must be lowercase and hyphenated');
	assert.equal(validate({ ...base, description: 'too short' }), false, 'a stub description must fail');
	delete base.description;
	assert.equal(validate(base), false, 'a body without a description must fail');
});
