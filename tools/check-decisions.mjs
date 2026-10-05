#!/usr/bin/env node
// check-decisions - hold the decision register to the shape AR4 requires of it.
//
// Sovereign duty: the register's own integrity and no other. A ruling is changed only by a later
// row, so the register is only trustworthy if every row can be addressed, ordered and traced.
//
//   every id is four digits, unique, and in ascending order
//   every row has a kind (general | project), an authority, and a status
//   a status is ratified, proposed, or "superseded by <id>" naming a later row
//   every lineage reference (supersedes / amends) names an earlier row
//   a general row names entries in affects, and every named path exists
//   a project row names none
//   absorbed is yes | pending | contested for general rows, and - for project rows
//
// Whether an entry actually states its ruling is read, not checked: registration in an index is
// not absorption (AR4), and a script matching words would report the cheaper reading as the real one.
//
// Exit non-zero on any defect. Reports pending and contested rows without failing.
//
// Usage:  node tools/check-decisions.mjs [docs/DECISIONS.md]

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const file = path.join(ROOT, process.argv[2] || 'docs/DECISIONS.md');
if (!existsSync(file)) { console.log(`FAIL  missing  ${file}`); process.exit(1); }

const rows = readFileSync(file, 'utf8').split('\n')
	.filter((l) => /^\| \d{4} \|/.test(l))
	.map((l) => l.slice(1, -1).split(' | ').map((c) => c.trim()));

let fail = 0;
const bad = (id, msg) => { console.log(`FAIL  ${id}  ${msg}`); fail++; };
const ids = rows.map((r) => r[0]);
const pending = [], contested = [];

rows.forEach((r, i) => {
	const [id, date, ruling, kind, authority, status, lineage, affects, absorbed] = r;
	if (r.length !== 9) return bad(id, `has ${r.length} columns, expected 9`);
	if (ids.indexOf(id) !== i) bad(id, 'id is not unique');
	if (i > 0 && id <= ids[i - 1]) bad(id, 'id is out of order');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) bad(id, 'date is not YYYY-MM-DD');
	if (!ruling) bad(id, 'ruling is empty');
	if (!authority || authority === '-') bad(id, 'authority names no one');
	if (!['general', 'project'].includes(kind)) bad(id, `kind '${kind}' is not general or project`);
	const sup = /^superseded by (\d{4})$/.exec(status);
	if (!['ratified', 'proposed'].includes(status) && !sup) bad(id, `status '${status}' is not ratified, proposed or superseded by <id>`);
	if (sup && !(ids.includes(sup[1]) && sup[1] > id)) bad(id, `superseded by ${sup[1]}, which is not a later row`);
	if (lineage !== '-') {
		const m = /^(supersedes|amends) ([\d, ]+)$/.exec(lineage);
		if (!m) bad(id, `lineage '${lineage}' is not 'supersedes|amends <ids>'`);
		else for (const ref of m[2].split(',').map((s) => s.trim())) if (!(ids.includes(ref) && ref < id)) bad(id, `lineage names ${ref}, which is not an earlier row`);
	}
	if (kind === 'general') {
		const paths = [...affects.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
		if (!paths.length) bad(id, 'a general ruling names no entry in affects');
		for (const p of paths) if (!existsSync(path.join(ROOT, p))) bad(id, `affects names ${p}, which does not exist`);
		if (!['yes', 'pending', 'contested'].includes(absorbed)) bad(id, `absorbed '${absorbed}' is not yes, pending or contested`);
		if (absorbed === 'pending') pending.push(id);
		if (absorbed === 'contested') contested.push(id);
	} else if (kind === 'project') {
		if (affects !== '-') bad(id, 'a project decision names entries in affects');
		if (absorbed !== '-') bad(id, 'a project decision has an absorbed value');
	}
});

console.log(`${rows.length} rulings; ${rows.filter((r) => r[3] === 'general').length} general, ${rows.filter((r) => r[3] === 'project').length} project.`);
if (pending.length) console.log(`pending absorption: ${pending.join(', ')}`);
if (contested.length) console.log(`contested: ${contested.join(', ')}`);
if (fail) { console.log(`${fail} register defect(s).`); process.exit(1); }
console.log('the register is well formed.');
