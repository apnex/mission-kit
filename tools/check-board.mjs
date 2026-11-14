#!/usr/bin/env node
// check-board - hold docs/BOARD.md and docs/BACKLOG.md to the R1-R8 reconciliation contract.
//
// Sovereign duty: board-and-backlog reconciliation and derived-view generation, and no other.
// docs/BOARD.md is the plan - mutable, reorderable, short. docs/BACKLOG.md is the record -
// append-and-close, nothing deleted. The board states a five-rule contract binding the two, and
// until this script existed every rule was prose that nothing checked.
//
// That was not hypothetical. Within two commits of the board being written it carried a milestone
// out of plan order, a finding arguing that a closed row was still open, and an item citing no row
// at all - and that item was the one whose duty was to mechanise this contract. A person found all
// three by asking. A script finds them on every change.
//
// What it checks, and the defect each catches:
//
//   R1  every board item cites a backlog row          an orphaned plan item
//   R2  every cited row exists                        a citation to nothing
//   R3  every row has scores, evidence and trigger    a row the views cannot order or revive
//   R7  the ledger and held list match the record     a hand copy drifting from the scores
//   R4  no closed row is planned in a live item       the record and the plan disagreeing
//   R5  milestones appear in ascending order          an accidental priority nobody chose
//   R6  a DONE milestone or item leaves no orphan row finished work claiming more than it closed
//   R8  "Where we are" agrees with the milestones     a narrative still pointing at finished work
//
// It reads both files as written rather than a separate declaration, because the files ARE the
// declaration; a second copy of the board's structure would be the drift this exists to prevent.
//
// Usage:  node tools/check-board.mjs [--write] [--root DIR]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// --root lets a project adopting the artifact set check its own board with this script, rather than
// copying it: a second copy of the contract would drift from this one.
const rootArg = process.argv.indexOf("--root");
if (rootArg > -1 && (!process.argv[rootArg + 1] || process.argv[rootArg + 1].startsWith("--"))) {
	console.error("FAIL  usage  --root requires a directory path");
	process.exit(2);
}
const root = rootArg > -1 ? process.argv[rootArg + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");
const boardPath = join(root, "docs/BOARD.md");
const backlogPath = join(root, "docs/BACKLOG.md");

// A corpus with no board has nothing to reconcile. Absence is not a failure here; it is the
// bootstrap state, and a check that refused it would block the commit that creates the board.
if (!existsSync(boardPath) || !existsSync(backlogPath)) {
	console.log("clean: no board and backlog pair to reconcile.");
	process.exit(0);
}

const board = readFileSync(boardPath, "utf8");
const backlog = readFileSync(backlogPath, "utf8");

const failures = [];
const fail = (rule, msg) => failures.push(`FAIL  ${rule}  ${msg}`);

// --- the record -------------------------------------------------------------------------------

// A backlog row is a table row whose first cell is a bolded B-id. CLOSED anywhere in it marks the
// disposition; everything else is open. Parked and Retired sections hold rows of the same shape.
// Columns: id | impact | principle | finding | evidence | state. Splitting masks inline code spans
// so unescaped pipes inside backticks stay inside their cell and an empty trailing cell stays column 6.
const maskCode = (s) => s.replace(/(`+)(?!`)[^\n]*?\1(?!`)/g, (m) => "_".repeat(m.length));
const splitCells = (line) => {
	const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
	const masked = maskCode(inner);
	const out = [];
	let start = 0;
	for (let i = 0; i < masked.length; i++) {
		if (masked[i] === "|" && masked[i - 1] !== "\\") {
			out.push(inner.slice(start, i).trim());
			start = i + 1;
		}
	}
	out.push(inner.slice(start).trim());
	return out;
};
const esc = (t) => t.replace(/\|/g, "\\|").trim();
const trigger = (st) => {
	const masked = maskCode(st);
	const m = /(?:^|[\s*])(?:TRIGGER:|Revival trigger:)\**\s*/i.exec(masked) ?? /(?:^|[\s*])TRIGGER\b:?\**\s*/.exec(masked);
	return esc((m ? st.slice(m.index + m[0].length) : st).replace(/\*\*/g, ""));
};
const rows = new Map();
for (const line of backlog.split("\n")) {
	const m = line.match(/^\|\s*\*\*(B\d+)\*\*\s*\|/);
	if (!m) continue;
	const c = splitCells(line);
	const title = (c[3] || "").match(/\*\*(.+?)\*\*/);
	rows.set(m[1], {
		cols: c.length,
		closed: /\bCLOSED\b/.test(line),
		impact: c[1], principle: c[2],
		title: title ? title[1] : (c[3] || "").slice(0, 120),
		evidence: c[4] ?? "",
		state: c[5] ?? "",
	});
}

// --- the plan ---------------------------------------------------------------------------------

// Walk the board once, tracking which milestone we are inside and whether we are in Held, so an
// item row is attributed to the milestone heading above it.
const items = [];
const milestones = [];
const held = new Set();
let current = null;
let inHeld = false;

for (const line of board.split("\n")) {
	const h = line.match(/^##\s+(M(\d+))\b.*?`([A-Z]+)`/);
	if (h) {
		current = { id: h[1], n: Number(h[2]), status: h[3] };
		milestones.push(current);
		inHeld = false;
		continue;
	}
	if (/^##\s+Held\b/.test(line)) {
		current = null;
		inHeld = true;
		continue;
	}
	if (/^##\s/.test(line)) {
		current = null;
		inHeld = false;
		continue;
	}

	if (inHeld) {
		const m = line.match(/^\|\s*\*\*(B\d+)\*\*\s*\|/);
		if (m) held.add(m[1]);
		continue;
	}

	const it = line.match(/^\|\s*(M\d+\.\d+[a-z]?)\s*\|/);
	if (it && current) {
		const c = splitCells(line);
		const cited = [...(c[2] ?? line).matchAll(/`(B\d+)`/g)].map((x) => x[1]);
		items.push({ id: it[1], milestone: current, cited, done: /`DONE`/.test(c[3] ?? "") });
	}
}

// --- R1, R2: every item cites, and every citation resolves ------------------------------------

for (const item of items) {
	if (item.cited.length === 0) {
		fail("R1", `${item.id} cites no backlog row`);
		continue;
	}
	for (const b of item.cited) {
		if (!rows.has(b)) fail("R2", `${item.id} cites ${b}, which is not a backlog row`);
	}
}

// --- R3: every open row is planned or held - held is derived, not listed by hand --------------
//
// A row is planned when a live item in an open milestone cites it, and held otherwise. Holding is
// therefore a fact read from the plan, and the held list is generated; R3 checks that every row
// carries the six-column shape, scores and evidence, and that every open row carries a trigger.

const plannedIn = new Map();
for (const item of items) {
	if (item.milestone.status === "DONE" || item.done) continue;
	for (const b of item.cited) if (!plannedIn.has(b)) plannedIn.set(b, item.id);
}
for (const [b, r] of rows) {
	if (r.cols !== 6) fail("R3", `${b} has ${r.cols} columns, expected 6`);
	if (!/^S[1-5]$/.test(r.impact ?? "")) fail("R3", `${b} has impact '${r.impact}', not S1-S5`);
	if (!/^A\d+ (mandate|signal)( - A\d+)?$/.test(r.principle ?? "")) fail("R3", `${b} has principle '${r.principle}', not 'A<n> mandate|signal' with an optional secondary axiom`);
	if (!r.evidence || r.evidence === "-") fail("R3", `${b} cites no evidence`);
	const trig = trigger(r.state);
	if (!r.closed && (!r.state || r.state === "-" || !trig || /^later\.?$/i.test(trig))) {
		fail("R3", `${b} is open with no observable revival trigger`);
	}
}

// --- R4: a closed row is not planned as live work ---------------------------------------------

for (const item of items) {
	if (item.milestone.status === "DONE" || item.done) continue;
	for (const b of item.cited) {
		if (rows.get(b)?.closed) {
			fail("R4", `${item.id} in ${item.milestone.id} (${item.milestone.status}) plans ${b}, which is CLOSED`);
		}
	}
}

// --- R5: document order is plan order ---------------------------------------------------------

for (let i = 1; i < milestones.length; i++) {
	if (milestones[i].n < milestones[i - 1].n) {
		fail("R5", `${milestones[i].id} appears after ${milestones[i - 1].id}; the board's order is its plan`);
	}
}

// --- R6: a finished milestone or item delivered what it cites ---------------------------------

for (const item of items) {
	if (item.milestone.status !== "DONE" && !item.done) continue;
	for (const b of item.cited) {
		const r = rows.get(b);
		// A DONE milestone or item may legitimately leave a row open when the row's remaining work
		// moved to another live item; that is only lawful if a live item still plans the row.
		if (r && !r.closed && !plannedIn.has(b)) {
			fail("R6", `${item.id} (${item.milestone.id}) is DONE but ${b} is still open and planned in no live item`);
		}
	}
}

// --- R8: the narrative agrees with the milestones ---------------------------------------------
//
// "Where we are" is written by hand, so it can say one thing while the milestones say another; on
// 2026-10-20 it still marked M4 as current four days after M4 was done. In its text block, a
// milestone marked "<- HERE" must not be DONE, and a status written beside a milestone must be the
// status its heading carries. A board without the section is not checked.

const where = board.match(/^## Where we are\b[\s\S]*?(?=^## |(?![\s\S]))/m)?.[0] ?? "";
for (const line of where.split("\n")) {
	const m = line.match(/^\s*(?:next:\s*)?(M\d+)\b/);
	if (!m) continue;
	const ms = milestones.find((x) => x.id === m[1]);
	if (!ms) { fail("R8", `"Where we are" names ${m[1]}, which has no milestone heading`); continue; }
	if (/<-\s*HERE/.test(line) && ms.status === "DONE") fail("R8", `"Where we are" marks ${m[1]} as current, but ${m[1]} is DONE`);
	const st = line.match(/\b(TODO|WIP|BLOCKED|DONE|DROPPED)\b/);
	if (st && st[1] !== ms.status) fail("R8", `"Where we are" gives ${m[1]} as ${st[1]}, but its heading says ${ms.status}`);
}

// --- R7: the ledger and the held list are generated from the record ---------------------------
//
// Order is on the higher of the two scores, never a blend: a mandate breach ranks as S2 and an
// enforcement signal as S4, ties go to the mandate, then to impact. Run with --write to regenerate.

const rank = (r) => {
	const imp = Number(r.impact.slice(1));
	const pr = /mandate/.test(r.principle) ? 2 : 4;
	return [Math.min(imp, pr), /mandate/.test(r.principle) ? 0 : 1, imp];
};
const cmp = (a, b) => { const x = rank(a[1]), y = rank(b[1]); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return Number(a[0].slice(1)) - Number(b[0].slice(1)); };
const open = [...rows].filter(([, r]) => !r.closed && /^S[1-5]$/.test(r.impact ?? "") && /^A\d+ /.test(r.principle ?? "")).sort(cmp);
const ledger = ["| Row | Impact | Principle | Planned in | Finding |", "|---|---|---|---|---|",
	...open.map(([b, r]) => `| \`${b}\` | ${r.impact} | ${r.principle} | ${plannedIn.get(b) ?? "held"} | ${esc(r.title)} |`)].join("\n");
const heldRows = open.filter(([b]) => !plannedIn.has(b));
const heldTable = ["| Row | Impact | Principle | Finding | Revival trigger |", "|---|---|---|---|---|",
	...heldRows.map(([b, r]) => `| \`${b}\` | ${r.impact} | ${r.principle} | ${esc(r.title)} | ${trigger(r.state)} |`)].join("\n");

let next = board;
const regions = [["ledger", ledger], ["held", heldTable]];
for (const [name, body] of regions) {
	const B = `<!-- BEGIN GENERATED: ${name}. Run tools/check-board.mjs --write; do not edit by hand. -->`, E = `<!-- END GENERATED: ${name} -->`;
	const i = next.indexOf(B), j = next.indexOf(E);
	if (i === -1 || j === -1) { fail("R7", `docs/BOARD.md has no generated ${name} region`); continue; }
	next = next.slice(0, i) + B + "\n" + body + "\n" + next.slice(j);
}
if (process.argv.includes("--write")) {
	if (next !== board) writeFileSync(boardPath, next);
} else if (next !== board && !failures.some((f) => f.includes("R7"))) {
	fail("R7", "the generated ledger or held list is out of date; run tools/check-board.mjs --write");
}

// --- report -----------------------------------------------------------------------------------

if (failures.length) {
	for (const f of failures) console.log(f);
	console.log(`\n${failures.length} failure(s): the board and the backlog disagree.`);
	process.exit(1);
}

console.log(
	`clean: ${items.length} item(s) across ${milestones.length} milestone(s) reconcile with ${rows.size} backlog row(s); ${heldRows.length} held, generated.`,
);
process.exit(0);
