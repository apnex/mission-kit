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

// The layer set is not declared here. It is read from the corpus twice, from two places that are
// maintained for other reasons, and the two are held against each other.
//
//   order  - the root charter's layer table, which is the authored reading order
//   set    - the directories that carry a charter, which is what makes a layer self-describing
//
// A list here would be a third statement of a fact the corpus already makes twice, and it was:
// it had drifted into a different sequence of the same thirteen layers, and nothing noticed while
// the ledger was flat and its order invisible. Adding a layer is now an edit to the corpus and
// never to this tool. A prefix is not needed at all - it was only ever used to rank entries for
// sorting, which the layer order does directly.

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

// The authored reading order: the root charter's layer table, minus the mechanism layers, which
// declare '-' for a prefix and appear in no ledger.
function layersFromCharter() {
	const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
	return [...readme.matchAll(/^\| *`?([A-Z-]+)`? *\| *\[`([a-z-]+)\/`\]/gm)]
		.filter((m) => m[1] !== '-').map((m) => m[2]);
}

// What is actually on disk: a directory carrying a charter, which is a README declaring both an id
// and a category. That predicate is only exact because every layer has a charter; before they did,
// it would have found four of thirteen.
function layersOnDisk() {
	return readdirSync(ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
		.map((d) => d.name)
		.filter((name) => {
			const readme = path.join(ROOT, name, 'README.md');
			if (!existsSync(readme)) return false;
			const fm = frontmatter(readFileSync(readme, 'utf8'));
			return Boolean(fm && fm.id && fm.category);
		});
}

// Held against each other before anything is read. A layer in one and not the other is a layer
// whose entries would silently not be collected, or a heading with nothing under it, and the
// ledger would look correct either way.
const LAYERS = layersFromCharter();
const onDisk = layersOnDisk();
const missing = onDisk.filter((d) => !LAYERS.includes(d));
const phantom = LAYERS.filter((d) => !onDisk.includes(d));
if (missing.length || phantom.length) {
	for (const d of missing) console.error(`FAIL  layer set  ${d}/ carries a charter but the root README layer table does not list it`);
	for (const d of phantom) console.error(`FAIL  layer set  the root README layer table lists ${d}/, which carries no charter`);
	console.error('\nThe charter table and the directories that carry charters must name the same layers.');
	process.exit(1);
}

// Collect every entry that declares an id, from the category directory that owns it.
function collect() {
	const entries = [];
	for (const dir of LAYERS) {
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
				entries.push({ ...fm, dir, rel });
			}
		}
	}
	return entries;
}

// Sort by category order, then numerically inside it, so A9 precedes A10.
const num = (id) => Number((id.match(/(\d+)$/) || [0, 0])[1]);
function ordered(entries) {
	const rank = new Map(LAYERS.map((dir, i) => [dir, i]));
	return [...entries].sort((a, b) =>
		(rank.get(a.dir) - rank.get(b.dir)) || (num(a.id) - num(b.id)));
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').trim();

// A layer's display name is its directory name. The charter's title must begin with the same word,
// so the heading has two independent derivations gated against each other rather than one nobody
// can check. See headingDisagreements.
const headingOf = (dir) => dir[0].toUpperCase() + dir.slice(1);

// Status is emitted only where some row is not active. Nearly every entry is, so a column
// restating it is ballast in a file that loads into every session.
function table(entries, linkFrom) {
	const withStatus = entries.some((e) => e.status !== 'active');
	const head = withStatus
		? ['| ID | Title | Status | Hydrate when |', '|---|---|---|---|']
		: ['| ID | Title | Hydrate when |', '|---|---|---|'];
	const rows = entries.map((e) => {
		const href = linkFrom ? path.relative(linkFrom, e.rel) : e.rel;
		const cells = [`[${e.id}](${href})`, cell(e.title)];
		if (withStatus) cells.push(cell(e.status));
		cells.push(cell(e['hydrate-when']));
		return `| ${cells.join(' | ')} |`;
	});
	return [...head, ...rows].join('\n');
}

// One section per layer, charter first because its id ends in 0. There is no Category column: the
// heading states the layer once per layer instead of once per entry, and each row's link already
// names the directory. `layer`, `category` and `prefix` are distinct - see E2.
function ledgerSections(entries) {
	return LAYERS
		.map((dir) => [dir, ordered(entries.filter((e) => e.dir === dir))])
		.filter(([, es]) => es.length)
		.map(([dir, es]) => `## ${headingOf(dir)}\n\n${table(es, null)}`)
		.join('\n\n---\n\n');
}

function categoryTable(entries, dir) {
	return table(ordered(entries.filter((e) => e.dir === dir)), dir);
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

// A citation that resolves to nothing is worse than an absent one, because it reads as routing.
// Nothing else reports these: skill-graph resolves `prerequisite` and `composes` between SKILL.md
// bodies and never reads catalogue frontmatter, and the schema validates one file at a time, so a
// cross-file reference is outside what any single-file contract can see. Checked here because
// collect() is already the only inventory of which ids exist. Blocking is not onerous: the root
// charter already requires a retired entry's pointers to be repaired in the same commit.
const EDGE_FIELDS = ['related', 'supersedes', 'related-axioms'];
function danglingEdges(entries) {
	const known = new Set(entries.map((e) => e.id));
	const out = [];
	for (const e of entries)
		for (const field of EDGE_FIELDS)
			for (const target of String(e[field] ?? '').replace(/[[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean))
				if (!known.has(target)) out.push({ rel: e.rel, field, target });
	return out;
}

const dangling = danglingEdges(entries);
if (dangling.length) {
	for (const d of dangling) console.error(`FAIL  dangling edge  ${d.rel}: ${d.field} names ${d.target}, which is not an entry`);
	console.error(`\n${dangling.length} dangling edge(s); refusing to index a corpus whose own citations do not resolve.`);
	process.exit(1);
}

// Every layer must have a charter, and the charter's title must begin with the layer's own name.
// The charter is what makes a layer self-describing: its id carries the prefix, its title the
// heading, its trigger the route in. A layer without one cannot be discovered from its directory,
// and a charter titled out of step with its directory silently renames the section.
function headingDisagreements(entries) {
	const out = [];
	for (const dir of LAYERS) {
		const charter = entries.find((e) => e.rel === `${dir}/README.md`);
		if (!charter) { out.push(`${dir}/ has no charter; ${dir}/README.md must declare an id and a category`); continue; }
		const first = String(charter.title).split(' - ')[0].trim();
		if (first !== headingOf(dir))
			out.push(`${dir}/README.md is titled "${first} - ...", so its heading would read "${first}" rather than "${headingOf(dir)}"`);
	}
	return out;
}


const headingProblems = headingDisagreements(entries);
if (headingProblems.length) {
	for (const p of headingProblems) console.error(`FAIL  charter  ${p}`);
	console.error(`\n${headingProblems.length} charter problem(s); a layer's heading is derived from it, so it must agree.`);
	process.exit(1);
}

// An entry's category must match the layer that owns it. The value is the entry's own claim about
// where it lives, and the two can disagree: an entry sitting in patterns/ while declaring
// `category: methodology` passed every gate before this existed. Nothing else can catch it.
// check-entry-body reads the declared category deliberately, so a misfiled entry is held to the
// wrong shape rather than reported, and only four of thirteen categories are body-governed, so the
// other nine misfile in silence. The ledger stopped rendering the value once the layer moved to the
// section heading, which removed the last place a human might have noticed.
function misfiled(entries) {
	const out = [];
	for (const dir of LAYERS) {
		const charter = entries.find((e) => e.rel === `${dir}/README.md`);
		if (!charter) continue; // headingDisagreements already reports a layer with no charter
		for (const e of entries.filter((x) => x.dir === dir && x.category !== charter.category))
			out.push({ rel: e.rel, declared: e.category, expected: charter.category });
	}
	return out;
}

const wrongLayer = misfiled(entries);
if (wrongLayer.length) {
	for (const w of wrongLayer)
		console.error(`FAIL  misfiled  ${w.rel} declares category '${w.declared}', but its layer's charter declares '${w.expected}'`);
	console.error(`\n${wrongLayer.length} misfiled entr(ies); an entry's category names the layer that owns it.`);
	process.exit(1);
}


const targets = [['INDEX.md', ledgerSections(entries)]];
for (const dir of LAYERS) {
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
