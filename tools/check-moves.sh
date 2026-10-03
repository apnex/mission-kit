#!/usr/bin/env bash
# check-moves - hold a superseded entry to its successor, so a move cannot strand a reference.
#
# Sovereign duty: superseded-entry integrity and no other. When an entry moves it takes a new id and
# the old one stays, marked superseded, pointing at its successor. That is only safe if three
# things hold, each checked here:
#
#   every superseded entry names, in related, a successor that exists and supersedes it
#   every successor's supersedes names an entry that exists and is marked superseded
#   no active entry outside docs/ cites a superseded id - live guidance must point at the live entry
#
# Written for Delta-1, which moved seven entries; it holds every later move the same way.
#
# Usage:  tools/check-moves.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
node - <<'JS'
const fs = require('fs'), path = require('path'), cp = require('child_process');
// _template.md is a fillable skeleton, not an entry; generated index regions list superseded rows by design.
const files = cp.execSync('git ls-files -co --exclude-standard', { encoding: 'utf8' }).split('\n')
	.filter((f) => f.endsWith('.md') && f !== '_template.md' && !f.startsWith('docs/') && !f.includes('node_modules') && fs.existsSync(f));
const fm = (t) => { const m = t.match(/^---\n([\s\S]*?)\n---/); if (!m) return null; const o = {};
	for (const l of m[1].split('\n')) { const k = l.replace(/\s+#.*$/, '').match(/^([\w-]+):\s*(.*)$/); if (k) o[k[1]] = k[2].trim(); } return o; };
const list = (v) => (v || '').replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
const entries = {};
for (const f of files) { const m = fm(fs.readFileSync(f, 'utf8')); if (m && m.id && m.category) entries[m.id] = { ...m, file: f }; }
let fail = 0;
const no = (m) => { console.log('FAIL  moves  ' + m); fail++; };
const superseded = Object.values(entries).filter((e) => e.status === 'superseded');
for (const e of superseded) {
	const succ = list(e.related).map((id) => entries[id]).filter((s) => s && list(s.supersedes).includes(e.id));
	if (!succ.length) no(`${e.file}: superseded ${e.id} names no existing successor that supersedes it`);
}
for (const e of Object.values(entries)) for (const old of list(e.supersedes)) {
	if (!entries[old]) no(`${e.file}: supersedes ${old}, which does not exist`);
	else if (entries[old].status !== 'superseded') no(`${e.file}: supersedes ${old}, which is not marked superseded`);
}
const dead = new Set(superseded.map((e) => e.id));
for (const f of files) {
	const t = fs.readFileSync(f, 'utf8'); const m = fm(t);
	if (m && m.status === 'superseded') continue;
	const body = t.replace(/^---\n[\s\S]*?\n---/, (h) => h.replace(/^supersedes:.*$/m, '')).replace(/<!-- BEGIN GENERATED[\s\S]*?<!-- END GENERATED -->/g, '');
	for (const id of dead) if (new RegExp(`(?<![A-Za-z0-9-])${id}(?![0-9A-Za-z])`).test(body)) no(`${f}: cites superseded ${id}`);
}
console.log(fail ? `\n${fail} move failure(s).` : `moves: ${superseded.length} superseded entr(ies), each pointing at a live successor; no live entry cites one.`);
process.exit(fail ? 1 : 0);
JS
