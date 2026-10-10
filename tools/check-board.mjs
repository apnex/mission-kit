#!/usr/bin/env node
//
// The board and the backlog agree with each other.
//
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
//   R3  every row carries impact and principle scores  a row the generated views cannot order
//   R7  the ledger and held list match the record      a hand copy drifting from the scores
//   R4  no closed row is planned in an open milestone the record and the plan disagreeing
//   R5  milestones appear in ascending order          an accidental priority nobody chose
//   R6  a DONE milestone cites no open row            a milestone claiming more than it delivered
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
// Columns: id | impact | principle | finding | evidence | state. The scores are declared once, on
// the row; the board's ledger and held list are generated from them, so the two cannot disagree.
const cellsOf = (line) => line.replace(/^\|\s*/, "").replace(/\s*\|\s*$/, "").split(/\s+(?<!\\)\|\s+/);
const rows = new Map();
for (const line of backlog.split("\n")) {
	const m = line.match(/^\|\s*\*\*(B\d+)\*\*\s*\|/);
	if (!m) continue;
	const c = cellsOf(line);
	const title = (c[3] || "").match(/\*\*(.+?)\*\*/);
	rows.set(m[1], {
		closed: /\bCLOSED\b/.test(line),
		impact: c[1], principle: c[2],
		title: title ? title[1] : (c[3] || "").slice(0, 120),
		state: c[c.length - 1] || "",
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
		const cited = [...line.matchAll(/`(B\d+)`/g)].map((x) => x[1]);
		items.push({ id: it[1], milestone: current, cited });
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
// therefore a fact read from the plan, and the held list is generated; R3 now checks that every row
// carries the scores the generated views order by.

const itemLine = (id) => board.split("\n").find((l) => l.startsWith(`| ${id} `)) ?? "";
const plannedIn = new Map();
for (const item of items) {
	if (item.milestone.status === "DONE" || /`DONE`/.test(itemLine(item.id))) continue;
	for (const b of item.cited) if (!plannedIn.has(b)) plannedIn.set(b, item.id);
}
for (const [b, r] of rows) {
	if (!/^S[1-5]$/.test(r.impact ?? "")) fail("R3", `${b} has impact '${r.impact}', not S1-S5`);
	if (!/^A\d+ (mandate|signal)( - A\d+)?$/.test(r.principle ?? "")) fail("R3", `${b} has principle '${r.principle}', not 'A<n> mandate|signal' with an optional secondary axiom`);
}

// --- R4: a closed row is not planned as live work ---------------------------------------------

for (const item of items) {
	if (item.milestone.status === "DONE") continue;
	for (const b of item.cited) {
		if (rows.get(b)?.closed && !/`DONE`/.test(board.split("\n").find((l) => l.startsWith(`| ${item.id} `)) ?? "")) {
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

// --- R6: a finished milestone delivered what it cites -----------------------------------------

for (const item of items) {
	if (item.milestone.status !== "DONE") continue;
	for (const b of item.cited) {
		const r = rows.get(b);
		// A DONE milestone may legitimately leave a row open when the row's remaining work moved to
		// another milestone; that is only lawful if the row is still planned somewhere live.
		if (r && !r.closed) {
			const elsewhere = items.some((o) => o.milestone.status !== "DONE" && o.cited.includes(b));
			if (!elsewhere) fail("R6", `${item.id} sits in DONE ${item.milestone.id} but ${b} is still open and planned nowhere else`);
		}
	}
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
const esc = (t) => t.replace(/\|/g, "\\|").trim();
const trigger = (st) => { const m = st.match(/TRIGGER:?\**\s*(.*)$/i); return esc((m ? m[1] : st).replace(/\*\*/g, "")); };
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
