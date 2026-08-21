#!/usr/bin/env node
// generate-index - derive INDEX.md and the category tables from entry frontmatter.
//
// An index maintained by hand omits whatever nobody remembered to add, and nothing detects the
// omission. Three entries went missing that way before this existed. Deriving the index from the
// entries makes that class impossible rather than merely fixed: the entry is the only place a fact
// is written, and every table is a projection of it.
//
// Generated regions are delimited, so hand-written prose in the same file survives untouched:
//
//   <!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
//   <!-- END GENERATED -->
//
// A file with no markers is left alone, which is how roles/, domains/ and work-types/ opt out of
// carrying a local table.
//
// Exit non-zero in --check mode when a generated region is stale. That is the half that makes the
// guarantee hold: generation without a failing check is a convention, not a mechanism.
//
// Usage:  node tools/generate-index.mjs           rewrite every generated region
//         node tools/generate-index.mjs --check   fail if any region is out of date

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->';
const END = '<!-- END GENERATED -->';

// dir -> ID prefix. Order here is the order categories appear in the flat ledger.
const CATEGORIES = [
	['axioms', 'A'], ['style', 'S'], ['methodology', 'M'], ['roles', 'R'],
	['patterns', 'P'], ['domains', 'D'], ['work-types', 'W'], ['skills', 'K'],
	['schemas', 'SC'], ['entities', 'E'], ['components', 'C'], ['artifacts', 'AR'],
	['backlog', 'MREQ'],
];

function frontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const out = {};
	for (const raw of m[1].split('\n')) {
		const kv = raw.replace(/\s+#.*$/, '').match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
	}
	return out;
}

// Collect every entry that declares an id, from the category directory that owns it.
function collect() {
	const entries = [];
	for (const [dir, prefix] of CATEGORIES) {
		const abs = path.join(ROOT, dir);
		if (!existsSync(abs)) continue;
		for (const file of readdirSync(abs)) {
			// An entry is a file in the category directory. A skill's portable SKILL.md is not
			// an entry: it carries no catalogue placement, because an id, a status and a
			// ledger title are meaningless once the skill is lifted into another repository.
			// The K* stub beside it is the entry, and it points at the body.
			const candidates = file.endsWith('.md') ? [`${dir}/${file}`] : [];
			for (const rel of candidates) {
				const fm = frontmatter(readFileSync(path.join(ROOT, rel), 'utf8'));
				if (!fm || !fm.id) continue;
				entries.push({ ...fm, prefix, dir, rel });
			}
		}
	}
	return entries;
}

// Sort by category order, then numerically inside it, so A9 precedes A10.
const num = (id) => Number((id.match(/(\d+)$/) || [0, 0])[1]);
function ordered(entries) {
	const rank = new Map(CATEGORIES.map(([, p], i) => [p, i]));
	return [...entries].sort((a, b) =>
		(rank.get(a.prefix) - rank.get(b.prefix)) || (num(a.id) - num(b.id)));
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').trim();

function ledgerTable(entries) {
	const rows = ordered(entries).map((e) =>
		`| [${e.id}](${e.rel}) | ${cell(e.category)} | ${cell(e.title)} | ${cell(e.status)} | ${cell(e['hydrate-when'])} |`);
	return ['| ID | Category | Title | Status | Hydrate when |', '|---|---|---|---|---|', ...rows].join('\n');
}

function categoryTable(entries, dir) {
	const rows = ordered(entries.filter((e) => e.dir === dir)).map((e) =>
		`| [${e.id}](${path.relative(e.dir, e.rel)}) | ${cell(e.title)} | ${cell(e.status)} | ${cell(e['hydrate-when'])} |`);
	return ['| ID | Title | Status | Hydrate when |', '|---|---|---|---|', ...rows].join('\n');
}

// Replace the delimited region, or report that the file does not opt in.
function splice(file, table) {
	const abs = path.join(ROOT, file);
	if (!existsSync(abs)) return null;
	const text = readFileSync(abs, 'utf8');
	const b = text.indexOf(BEGIN);
	const e = text.indexOf(END);
	if (b === -1 || e === -1) return { file, opted: false, text, next: text };
	const next = text.slice(0, b) + BEGIN + '\n' + table + '\n' + text.slice(e);
	return { file, opted: true, text, next };
}

// An id addresses an entry, so two entries holding one id means the corpus cannot address either.
// Nothing downstream notices: the ledger renders both rows, every `related:` edge naming the id
// becomes ambiguous, and check-entry-body keys its exemptIds on (category, id), so exempting one
// of the pair silently exempts the other and a gate stops gating. Refuse to emit, for the same
// reason an empty index is refused: an artifact that encodes the defect is worse than none.
function collisions(entries) {
	const byId = new Map();
	for (const e of entries) byId.set(e.id, [...(byId.get(e.id) ?? []), e.rel]);
	return [...byId].filter(([, files]) => files.length > 1);
}

const check = process.argv.includes('--check');
const entries = collect();
if (!entries.length) { console.error('FAIL  no entries found; refusing to write an empty index'); process.exit(1); }

const duplicated = collisions(entries);
if (duplicated.length) {
	for (const [id, files] of duplicated) console.error(`FAIL  duplicate id  ${id} is declared by ${files.join(' and ')}`);
	console.error(`\n${duplicated.length} duplicate id(s); refusing to index a corpus that cannot address its own entries.`);
	process.exit(1);
}

const targets = [['INDEX.md', ledgerTable(entries)]];
for (const [dir] of CATEGORIES) {
	const readme = `${dir}/README.md`;
	if (existsSync(path.join(ROOT, readme))) targets.push([readme, categoryTable(entries, dir)]);
}

let stale = 0, written = 0, skipped = 0;
for (const [file, table] of targets) {
	const r = splice(file, table);
	if (!r) continue;
	if (!r.opted) { skipped++; continue; }
	if (r.text === r.next) continue;
	if (check) { console.log(`FAIL  stale  ${file}`); stale++; }
	else { writeFileSync(path.join(ROOT, file), r.next); console.log(`wrote  ${file}`); written++; }
}

console.log();
console.log(`${entries.length} entries, ${targets.length - skipped} generated region(s), ${skipped} file(s) without markers.`);
if (check && stale) { console.log(`${stale} region(s) out of date. Run tools/generate-index.mjs.`); process.exit(1); }
if (check) console.log('all generated regions are current.');
