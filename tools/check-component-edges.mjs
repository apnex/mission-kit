#!/usr/bin/env node
// check-component-edges - hold registered components' declared Edges to bidirectional agreement.
//
// Sovereign duty: component edge agreement across components/ and no other. C0 and 0096 give every
// component entry four edge declarations under ## Edges - Contains, Contained-by, Consumes and
// Consumed-by - because Consumed-by also names unregistered consuming applications and so cannot be
// purely generated from peer frontmatter. Two hand-written sides of one relation drift (B112).
//
//   every registered component (C1..Cn) carries Contains, Contained-by, Consumes and Consumed-by
//   every peer component named on an edge declaration line is linked, exists, and is not self
//   no declaration line says "nothing" while also naming a peer component
//   A's Consumes names B if and only if B's Consumed-by names A
//   A's Contains names B if and only if B's Contained-by names A
//
// Exit non-zero on any disagreement. Does not judge whether Contract prose omits a dependency from
// both sides at once (82115e6): that requires reading the contracts.
//
// Usage:  node tools/check-component-edges.mjs [--root DIR]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const rootIdx = argv.indexOf("--root");
const root = rootIdx >= 0 && argv[rootIdx + 1]
	? path.resolve(argv[rootIdx + 1])
	: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const compDir = path.join(root, "components");
if (!existsSync(compDir)) {
	console.log("no components/ directory; nothing to check.");
	process.exit(0);
}

const KINDS = ["Contains", "Contained-by", "Consumes", "Consumed-by"];
const PAIRS = [
	["Consumes", "Consumed-by"],
	["Contains", "Contained-by"],
];

function parseFrontmatter(text) {
	const m = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
	if (!m) return {};
	const out = {};
	for (const line of m[1].split("\n")) {
		const kv = /^([\w-]+):\s*(.*)$/.exec(line);
		if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
	}
	return out;
}

const entries = new Map();
const failures = [];
const report = (kind, msg) => failures.push(`FAIL  ${kind.padEnd(18)} ${msg}`);

for (const file of readdirSync(compDir).filter((f) => f.endsWith(".md") && f !== "README.md").sort()) {
	const rel = `components/${file}`;
	const text = readFileSync(path.join(compDir, file), "utf8");
	const fm = parseFrontmatter(text);
	if (fm.category !== "component" || !fm.id || fm.id === "C0") continue;
	if (fm.status === "superseded" || fm.status === "retired") continue;
	entries.set(fm.id, { id: fm.id, file, rel, text, edges: new Map() });
}

for (const entry of entries.values()) {
	const idx = entry.text.search(/^## Edges$/m);
	if (idx < 0) {
		report("missing section", `${entry.rel} (${entry.id}) has no '## Edges'`);
		continue;
	}
	const after = entry.text.slice(idx + "## Edges".length).replace(/^\r?\n/, "");
	const nextH2 = after.search(/^## /m);
	const sec = nextH2 >= 0 ? after.slice(0, nextH2) : after;

	for (const kind of KINDS) {
		const re = new RegExp(`^\\*\\*${kind}\\*\\*\\s*-\\s*(.*)$`, "m");
		const m = re.exec(sec);
		if (!m) {
			report("missing edge", `${entry.rel} (${entry.id}) has no '**${kind}** -' line in ## Edges`);
			entry.edges.set(kind, new Set());
			continue;
		}
		const declLine = m[1].replace(/\\\s*$/, "").trim();
		const targets = new Set();
		const linkRe = /\[`?(C[1-9]\d*)`?\]\(([^)]+)\)/g;
		let lm;
		while ((lm = linkRe.exec(declLine)) !== null) {
			targets.add(lm[1]);
			const targetFile = path.basename(lm[2].split("#")[0]);
			const peer = entries.get(lm[1]);
			if (peer && targetFile !== peer.file) {
				report("wrong link", `${entry.rel} (${entry.id}) ${kind} links ${lm[1]} to ${lm[2]}, expected ${peer.file}`);
			}
		}
		const stripped = declLine.replace(/\[`?C[1-9]\d*`?\]\([^)]+\)/g, "");
		for (const bare of stripped.matchAll(/\b(C[1-9]\d*)\b/g)) {
			report("unlinked edge", `${entry.rel} (${entry.id}) ${kind} names ${bare[1]} without a markdown link`);
		}
		if (/^nothing\b/i.test(declLine) && targets.size > 0) {
			report("contradictory", `${entry.rel} (${entry.id}) ${kind} says 'nothing' and also names ${[...targets].join(", ")}`);
		}
		entry.edges.set(kind, targets);
	}
}

for (const entry of entries.values()) {
	for (const [kind, targets] of entry.edges.entries()) {
		for (const t of targets) {
			if (t === entry.id) {
				report("self-edge", `${entry.rel} (${entry.id}) ${kind} names itself`);
				continue;
			}
			if (!entries.has(t)) {
				report("unknown component", `${entry.rel} (${entry.id}) ${kind} names ${t}, which is not a registered component`);
			}
		}
	}
}

for (const [forward, reverse] of PAIRS) {
	for (const a of entries.values()) {
		for (const bId of a.edges.get(forward) ?? []) {
			const b = entries.get(bId);
			if (!b || bId === a.id) continue;
			const rev = b.edges.get(reverse);
			if (rev && !rev.has(a.id)) {
				report("asymmetric edge", `${a.id} ${forward} names ${bId}, and ${bId} ${reverse} does not name ${a.id}`);
			}
		}
		for (const bId of a.edges.get(reverse) ?? []) {
			const b = entries.get(bId);
			if (!b || bId === a.id) continue;
			const fwd = b.edges.get(forward);
			if (fwd && !fwd.has(a.id)) {
				report("asymmetric edge", `${a.id} ${reverse} names ${bId}, and ${bId} ${forward} does not name ${a.id}`);
			}
		}
	}
}

if (failures.length > 0) {
	for (const f of failures) console.log(f);
	console.log(`\n${failures.length} component-edge failure(s).`);
	process.exit(1);
}

let edgePairs = 0;
for (const a of entries.values()) {
	edgePairs += (a.edges.get("Consumes")?.size ?? 0) + (a.edges.get("Contains")?.size ?? 0);
}
console.log(`component edges: ${entries.size} component(s) declare all four edge lines and agree across ${edgePairs} peer edge(s).`);
