#!/usr/bin/env node
// eval-human - measure a communication change on a human, not on an agent.
//
// Sovereign duty: run one person through paired messages and record their picks, and nothing else.
// The agent harness (eval.mjs) measures how agents read the corpus; it cannot measure whether a
// message works for the human it is written for, because an agent judging an agent's message is one
// measurement family. This tool asks the human directly, in the cheapest form a human can answer:
// two versions of one message, in random order, and a single key for which helps more.
//
// Commands:
//   run     SUITE_DIR [--out RUN_DIR] [--seed S]   present each pair; record picks to RUN_DIR
//   summary RUN_DIR                                 per-move wins for the version with the move
//
// A suite is SUITE_DIR/suite.json: { id, items: [ { id, move, scenario, with, without } ] }.
// "with" is the message written applying the move; "without" is written without it. The human is
// never told which is which, and the display order is random per item.
//
// Usage:  node tools/eval-human.mjs run docs/evals/human/<suite>

import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const die = (m, c = 2) => { process.stderr.write(`eval-human: ${m}\n`); process.exit(c); };
const rule = (label) => `--- ${label} ${"-".repeat(Math.max(3, 62 - label.length))}`;

function flipFor(seed, id) { return parseInt(createHash("sha256").update(`${seed}:${id}`).digest("hex").slice(0, 2), 16) % 2 === 1; }

// Reads answers one line at a time, whether from a terminal or a pipe, so the same code path is
// what the behaviour test exercises.
function lineReader() {
	const rl = readline.createInterface({ input: process.stdin, terminal: false });
	const queue = [], waiting = [];
	let closed = false;
	rl.on("line", (l) => { if (waiting.length) waiting.shift()(l); else queue.push(l); });
	rl.on("close", () => { closed = true; while (waiting.length) waiting.shift()(null); });
	return {
		next: () => queue.length ? Promise.resolve(queue.shift()) : closed ? Promise.resolve(null) : new Promise((r) => waiting.push(r)),
		close: () => rl.close(),
	};
}

async function ask(reader, prompt, valid) {
	for (;;) {
		process.stdout.write(prompt);
		const l = await reader.next();
		if (l === null) return null;
		const v = l.trim().toLowerCase();
		if (valid.includes(v)) return v;
		process.stdout.write(`  please type one of: ${valid.filter(Boolean).join(" ")}${valid.includes("") ? " (or Enter to skip)" : ""}\n`);
	}
}

async function cmdRun(argv) {
	const dir = argv._[1] ?? die("run needs SUITE_DIR");
	const suite = JSON.parse(fs.readFileSync(path.join(dir, "suite.json"), "utf8"));
	for (const it of suite.items) for (const k of ["id", "move", "scenario", "with", "without"]) if (!it[k]) die(`item lacks ${k}`);
	const seed = String(argv.seed ?? randomBytes(6).toString("hex"));
	const out = path.resolve(String(argv.out ?? path.join(path.dirname(path.resolve(dir)), "runs", `${suite.id}-${new Date().toISOString().slice(0, 10)}-${seed.slice(0, 6)}`)));
	fs.mkdirSync(out, { recursive: true });
	const reader = lineReader();
	const answers = [];
	process.stdout.write(`\n${suite.items.length} items. For each, pick the message that helps you more.\nType a, b or = and press Enter. Ctrl-D stops early; answers so far are kept.\n`);
	for (const [n, it] of suite.items.entries()) {
		const flip = flipFor(seed, it.id);
		const shown = { a: flip ? "with" : "without", b: flip ? "without" : "with" };
		process.stdout.write(`\nItem ${n + 1} of ${suite.items.length}\n\nScenario: ${it.scenario}\n\n${rule("A")}\n${it[shown.a]}\n\n${rule("B")}\n${it[shown.b]}\n\n`);
		const pick = await ask(reader, "Which helps you more?   [a] A   [b] B   [=] same\n> ", ["a", "b", "="]);
		if (pick === null) break;
		let tag = "";
		if (pick !== "=") {
			tag = await ask(reader, "What was wrong with the other? (optional)\n  [1] point buried  [2] too long  [3] unclear label  [4] other\n> ", ["1", "2", "3", "4", ""]);
			if (tag === null) tag = "";
		}
		const chose = pick === "=" ? "same" : shown[pick];
		answers.push({ item: it.id, move: it.move, shownA: shown.a, pick, chose, tag: { "1": "point buried", "2": "too long", "3": "unclear label", "4": "other" }[tag] ?? null });
	}
	reader.close();
	const result = { suite: suite.id, seed, created: new Date().toISOString(), complete: answers.length === suite.items.length, answers };
	fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n");
	process.stdout.write(`\nSaved ${answers.length} answer(s) to ${out}/result.json. Thank you.\n`);
}

function cmdSummary(argv) {
	const dir = argv._[1] ?? die("summary needs RUN_DIR");
	const r = JSON.parse(fs.readFileSync(path.join(dir, "result.json"), "utf8"));
	const by = {};
	for (const a of r.answers) {
		const m = (by[a.move] ??= { with: 0, without: 0, same: 0, tags: {} });
		m[a.chose]++;
		if (a.tag && a.chose === "with") m.tags[a.tag] = (m.tags[a.tag] ?? 0) + 1;
	}
	process.stdout.write(`suite ${r.suite}, ${r.answers.length} answer(s)${r.complete ? "" : " - incomplete"}\n`);
	for (const [move, m] of Object.entries(by)) {
		const tags = Object.entries(m.tags).map(([k, v]) => `${k} x${v}`).join(", ");
		process.stdout.write(`  ${move}: with the move ${m.with}, without ${m.without}, same ${m.same}${tags ? `  - faults named in the version without: ${tags}` : ""}\n`);
	}
}

const argv = { _: [] };
for (let i = 2; i < process.argv.length; i++) {
	const a = process.argv[i];
	if (a.startsWith("--")) argv[a.slice(2)] = process.argv[i + 1]?.startsWith("--") ? true : process.argv[++i];
	else argv._.push(a);
}
const cmd = { run: cmdRun, summary: cmdSummary }[argv._[0]];
if (!cmd) die("usage: eval-human.mjs run SUITE_DIR | summary RUN_DIR");
await cmd(argv);
