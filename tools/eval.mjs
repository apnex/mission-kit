#!/usr/bin/env node
// eval - measure whether cold agents read this corpus as intended, before and after a change.
//
// Sovereign duty: the deterministic half of a reasoning-document evaluation (M2, "Reasoning
// documents") and no other. Readers and scorers are agents; this tool never calls one, so it
// depends on no agent runtime. It prepares what they read, collects what they write, blinds the
// scorer, computes the result, and refuses a regression.
//
// Why it exists. Every evaluation in docs/audits/ was run by hand: prompts pasted, answers held in
// one session, and every run scored by the author of the change, knowing which version it was.
// Measured, no evaluation had ever been re-run after a later change, so nothing could catch a
// change that improved its own probes and broke an earlier one. This tool makes a run repeatable
// from the record, takes scoring away from the author, and turns old probes into a regression gate.
//
// Commands:
//   export  --out DIR [--ref REF]               copy the corpus without docs/ into a read-only opaque dir
//   prepare --suites a,b --corpus L=PATH ... --readers N --out RUN
//                                               write one prompt per (corpus, group, reader)
//   status  --run RUN                           which answers and scores are still missing
//   blind   --run RUN [--seed S]                shuffle answers under opaque ids, one scorer prompt
//                                               per suite, mapping kept out of scorer prompts in sealed/
//   score   --run RUN                           unblind, validate, write RESULT.json and RESULT.md
//   compare --base RESULT.json[:LABEL] --head RESULT.json[:LABEL] [--tolerance T]
//                                               exit 1 if any probe's head mean falls below base
//
// Suites live in docs/evals/<suite>/suite.json - instance content about this corpus, so under
// docs/, which export strips so no export carries a key; only a reader's prompt keeps it to its export.
//
// Usage:  node tools/eval.mjs <command> [options]

import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const die = (msg, code = 2) => { process.stderr.write(`eval: ${msg}\n`); process.exit(code); };

const VALUE_FLAGS = new Set(["out", "ref", "suites", "corpus", "readers", "run", "seed", "base", "head", "tolerance"]);
function args(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (!a.startsWith("--")) { out._.push(a); continue; }
		const k = a.slice(2);
		if (!VALUE_FLAGS.has(k)) die(`unknown flag --${k}`);
		const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
		if (v === true && VALUE_FLAGS.has(k)) die(`--${k} requires a value`);
		if (k in out) out[k] = [].concat(out[k], v); else out[k] = v;
	}
	return out;
}
const list = (v) => [].concat(v ?? []).flatMap((x) => String(x).split(",")).filter(Boolean);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJSON = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
const hex = (s, n = 6) => createHash("sha256").update(s).digest("hex").slice(0, n);

// Seeded so a blind can be reproduced from the record; the seed is written into the run.
function rng(seed) {
	let a = parseInt(hex(String(seed), 8), 16) >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
function shuffle(xs, rand) {
	const a = xs.slice();
	for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
	return a;
}

function loadSuite(id) {
	// EVAL_SUITES_DIR exists for the behaviour tests, which must not depend on the live suites.
	const p = path.join(process.env.EVAL_SUITES_DIR || path.join(root, "docs", "evals"), id, "suite.json");
	if (!fs.existsSync(p)) die(`no suite ${id} at ${path.relative(root, p)}`);
	const s = readJSON(p);
	for (const k of ["id", "mode", "probes"]) if (!(k in s)) die(`suite ${id} lacks ${k}`);
	if (s.id !== id) die(`suite file ${id} declares id ${s.id}`);
	if (s.mode === "file" && !s.file) die(`suite ${id} is file mode with no file`);
	for (const pr of s.probes) for (const k of ["id", "question", "key", "rubric"]) if (!pr[k]) die(`suite ${id} probe lacks ${k}`);
	return s;
}

// --- export ------------------------------------------------------------------------------------
// The directory name is random, so the path a reader is handed says nothing about which version it
// holds. Earlier hand runs named corpora mk-base and mk-after, and every reader saw the word.
// Every exported file and directory is marked read-only so a reader sharing the export cannot write
// notes into it (B123), and prepare records its tree digest so score refuses a tampered export.
function lockTree(dir) {
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name);
		const st = fs.lstatSync(full);
		if (st.isSymbolicLink()) continue;
		if (st.isDirectory()) lockTree(full);
		else fs.chmodSync(full, st.mode & ~0o222);
	}
	fs.chmodSync(dir, fs.lstatSync(dir).mode & ~0o222);
}

function unlockTree(dir) {
	if (!fs.existsSync(dir)) return;
	const st = fs.lstatSync(dir);
	if (st.isSymbolicLink()) return;
	fs.chmodSync(dir, st.mode | (st.isDirectory() ? 0o700 : 0o600));
	if (!st.isDirectory()) return;
	for (const name of fs.readdirSync(dir)) unlockTree(path.join(dir, name));
}

function hasWritable(dir) {
	const st = fs.lstatSync(dir);
	if (st.isSymbolicLink()) return false;
	if ((st.mode & 0o222) !== 0) return true;
	if (!st.isDirectory()) return false;
	for (const name of fs.readdirSync(dir)) if (hasWritable(path.join(dir, name))) return true;
	return false;
}

function treeDigest(dir) {
	const h = createHash("sha256");
	const visit = (cur, relPrefix) => {
		for (const name of fs.readdirSync(cur).sort()) {
			const full = path.join(cur, name);
			const rel = relPrefix ? `${relPrefix}/${name}` : name;
			const st = fs.lstatSync(full);
			if (st.isDirectory()) { h.update(`D:${rel}\0`); visit(full, rel); }
			else if (st.isSymbolicLink()) { const t = Buffer.from(fs.readlinkSync(full)); h.update(`L:${rel}:${t.length}\0`); h.update(t); }
			else { const b = fs.readFileSync(full); h.update(`F:${rel}:${b.length}\0`); h.update(b); }
		}
	};
	visit(dir, "");
	return h.digest("hex");
}

function cmdExport(o) {
	if (!o.out) die("export needs --out DIR");
	const dir = path.join(path.resolve(String(o.out)), "c-" + randomBytes(4).toString("hex"));
	fs.mkdirSync(dir, { recursive: true });
	let files;
	if (o.ref) {
		const ref = String(o.ref);
		const tar = execFileSync("git", ["-C", root, "archive", ref], { maxBuffer: 1 << 30 });
		execFileSync("tar", ["-x", "-C", dir], { input: tar });
		fs.rmSync(path.join(dir, "docs"), { recursive: true, force: true });
		files = "git archive " + execFileSync("git", ["-C", root, "rev-parse", "--short", ref]).toString().trim();
	} else {
		const tracked = execFileSync("git", ["-C", root, "ls-files", "-co", "--exclude-standard"]).toString()
			.split("\n").filter((f) => f && !f.startsWith("docs/") && fs.existsSync(path.join(root, f)));
		for (const f of tracked) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.copyFileSync(path.join(root, f), path.join(dir, f)); }
		files = "working tree at " + execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"]).toString().trim() + (execFileSync("git", ["-C", root, "status", "--porcelain"]).toString().trim() ? " plus uncommitted changes" : "");
	}
	if (fs.existsSync(path.join(dir, "docs"))) die("export left docs/ in place");
	lockTree(dir);
	process.stdout.write(`${dir}\t${files}\n`);
}

// --- prepare -----------------------------------------------------------------------------------
function readerPrompt(group, corpusPath, answerPath) {
	const s0 = group.suites[0];
	const lines = [];
	if (s0.mode === "file") {
		lines.push(`Read exactly one file: ${path.join(corpusPath, s0.file)}. Do not open any other file and do not follow links. Do not use outside knowledge of any corpus.`);
		lines.push("", "Answer using only that file, quoting it.");
	} else {
		lines.push(`You are an engineering agent who has just been given a knowledge corpus and nothing else. Read only files under ${corpusPath}. Its entry point is INDEX.md; open whatever you need.`);
		if (!group.suites.some((x) => x.instructions)) lines.push("", "Answer using the corpus, citing files and text.");
	}
	// A suite whose answers are artifacts in their own right - a message to a human, say - replaces
	// the default answering instructions, which demand short cited answers that would distort it.
	const custom = group.suites.find((x) => x.instructions);
	if (custom) lines.push(custom.instructions);
	else lines.push(`If it does not settle something, say "NOT SETTLED" and label any guess "GUESS:". Never present a guess as if the text said it. Under eight sentences per question.`);
	lines.push("", "Do not edit any file except the one answer file named at the end. Do not run git.");
	for (const s of group.suites) if (s.preamble) lines.push("", s.preamble);
	lines.push("", "Questions:");
	for (const s of group.suites) for (const p of s.probes) lines.push("", `### ${s.id}.${p.id}`, p.question);
	lines.push("", "Write your answers to this file, and nothing else:", `  ${answerPath}`);
	lines.push("Put each answer under its heading exactly as given above (a line starting with ###), then a final heading `### OBSERVATIONS` noting anything ambiguous, inconsistent or wrong you met, or \"none\".");
	lines.push("When the file is written, reply with only the word DONE.");
	return lines.join("\n") + "\n";
}

function cmdPrepare(o) {
	const suites = list(o.suites).map(loadSuite);
	const corpora = list(o.corpus).map((c) => { const i = c.indexOf("="); if (i < 1) die(`--corpus wants LABEL=PATH, got ${c}`); return { label: c.slice(0, i), path: path.resolve(c.slice(i + 1)) }; });
	const readers = Number(o.readers ?? 3);
	if (!suites.length || !corpora.length || !o.out || !(readers > 0)) die("prepare needs --suites, --corpus, --readers and --out");
	for (const c of corpora) {
		if (!fs.existsSync(path.join(c.path, "INDEX.md"))) die(`corpus ${c.label} has no INDEX.md`);
		if (fs.existsSync(path.join(c.path, "docs"))) die(`corpus ${c.label} contains docs/ - export would carry keys; use export`);
		if (hasWritable(c.path)) die(`corpus ${c.label} is writable - a reader could alter it; use export`);
		c.digest = treeDigest(c.path);
	}
	const run = path.resolve(String(o.out));
	for (const p of ["prompts", "scorers", "sealed", "TASKS.md"]) unlockTree(path.join(run, p));
	for (const d of ["prompts", "answers", "scorers", "scores", "sealed"]) fs.mkdirSync(path.join(run, d), { recursive: true });
	for (const d of ["prompts", "scorers"]) for (const f of fs.readdirSync(path.join(run, d))) fs.rmSync(path.join(run, d, f), { force: true });
	const groups = new Map();
	for (const s of suites) {
		const g = s.mode === "file" ? `${s.id}` : (s.group ?? s.id);
		if (!groups.has(g)) groups.set(g, { id: g, suites: [] });
		const grp = groups.get(g);
		if (grp.suites.length && (grp.suites[0].mode === "file" || s.mode === "file")) die(`group ${g} mixes a file-mode suite with others`);
		grp.suites.push(s);
	}
	const salt = String(o.seed ?? randomBytes(8).toString("hex"));
	const prompts = [];
	for (const c of corpora) for (const g of groups.values()) for (let r = 1; r <= readers; r++) {
		const pid = "r-" + hex(`${salt}:${c.label}:${g.id}:${r}`);
		const answer = path.join(run, "answers", `${pid}.txt`);
		fs.writeFileSync(path.join(run, "prompts", `${pid}.txt`), readerPrompt(g, c.path, answer));
		prompts.push({ pid, label: c.label, group: g.id, reader: r, probes: g.suites.flatMap((s) => s.probes.map((p) => `${s.id}.${p.id}`)) });
	}
	const promptsDigest = treeDigest(path.join(run, "prompts"));
	// The manifest names each prompt's corpus; sealed/ keeps it out of prompts/ and scorers/, though
	// only their prompts keep agents from opening it (B124). Prompts, TASKS.md, scorers/ and sealed/
	// are marked read-only with digests verified at score (B127).
	writeJSON(path.join(run, "sealed", "manifest.json"), {
		created: new Date().toISOString(), suites: suites.map((s) => s.id), readers,
		corpora, prompts, promptsDigest,
	});
	const order = shuffle(prompts, rng(salt));
	const tasksPath = path.join(run, "TASKS.md");
	fs.writeFileSync(tasksPath, [
		"<!-- GENERATED FILE by tools/eval.mjs prepare; do not edit by hand. -->", "# Reader tasks", "",
		"Give each fresh agent exactly one line below, as its whole instruction. Order is shuffled.", "",
		...order.map((p) => `- Read ${path.join(run, "prompts", p.pid + ".txt")} and follow it exactly. Read nothing else in ${run}.`), "",
	].join("\n"));
	for (const d of ["prompts", "scorers", "sealed"]) lockTree(path.join(run, d));
	fs.chmodSync(tasksPath, fs.lstatSync(tasksPath).mode & ~0o222);
	process.stdout.write(`${run}\t${prompts.length} reader prompts\n`);
}

// Answers are agents' evidence, kept as .txt so no style rule ever rewrites what was scored.
// --- answers and scores ------------------------------------------------------------------------
function splitAnswers(text, probeIds) {
	const out = {};
	const parts = text.split(/^###\s+/m).slice(1);
	for (const part of parts) {
		const nl = part.indexOf("\n");
		const head = (nl < 0 ? part : part.slice(0, nl)).trim();
		const body = nl < 0 ? "" : part.slice(nl + 1).trim();
		const id = head.split(/\s/)[0];
		if (probeIds.includes(id)) out[id] = body;
		else if (/^OBSERVATIONS/i.test(head)) out.OBSERVATIONS = body;
	}
	return out;
}

function cmdStatus(o) {
	const run = path.resolve(String(o.run ?? die("status needs --run")));
	const m = readJSON(path.join(run, "sealed", "manifest.json"));
	const missing = m.prompts.filter((p) => !fs.existsSync(path.join(run, "answers", `${p.pid}.txt`)));
	process.stdout.write(`answers: ${m.prompts.length - missing.length}/${m.prompts.length}\n`);
	for (const p of missing) process.stdout.write(`  missing answers/${p.pid}.txt\n`);
	if (fs.existsSync(path.join(run, "sealed", "blind.json"))) {
		const b = readJSON(path.join(run, "sealed", "blind.json"));
		for (const s of b.suites) {
			const f = path.join(run, "scores", `${s}.txt`);
			process.stdout.write(`  scores/${s}.txt ${fs.existsSync(f) ? "present" : "missing"}\n`);
		}
	}
	process.exit(missing.length ? 1 : 0);
}

function cmdBlind(o) {
	const run = path.resolve(String(o.run ?? die("blind needs --run")));
	const m = readJSON(path.join(run, "sealed", "manifest.json"));
	const seed = String(o.seed ?? randomBytes(8).toString("hex"));
	const rand = rng(seed);
	const items = [];
	const absent = [];
	for (const p of m.prompts) {
		const f = path.join(run, "answers", `${p.pid}.txt`);
		if (!fs.existsSync(f)) die(`answers/${p.pid}.txt missing - run status`);
		const parts = splitAnswers(fs.readFileSync(f, "utf8"), p.probes);
		for (const probe of p.probes) {
			if (!(probe in parts) || !parts[probe]) { absent.push({ pid: p.pid, probe }); continue; }
			// A suite may name a marker after which the reader explains itself - which corpus entries
			// shaped the answer. That text can name an entry only one corpus version has, so it would tell
			// the scorer which version wrote the answer; it is cut here and stays in answers/.
			const strip = loadSuite(probe.split(".")[0]).stripFrom;
			let text = parts[probe];
			if (strip && text.includes(strip)) text = text.slice(0, text.indexOf(strip)).trim();
			if (!text) { absent.push({ pid: p.pid, probe }); continue; }
			items.push({ item: "a-" + hex(`${seed}:${p.pid}:${probe}`, 8), pid: p.pid, probe, text });
		}
	}
	const bySuite = new Map();
	for (const it of items) { const s = it.probe.split(".")[0]; if (!bySuite.has(s)) bySuite.set(s, []); bySuite.get(s).push(it); }
	for (const d of ["scorers", "sealed"]) unlockTree(path.join(run, d));
	for (const f of fs.readdirSync(path.join(run, "scorers"))) fs.rmSync(path.join(run, "scorers", f), { force: true });
	for (const [sid, its] of bySuite) {
		const suite = loadSuite(sid);
		const lines = [
			`You are scoring answers to a comprehension test against an answer key. Read only this file. Do not open any other file under ${run}.`,
			"", suite.scorerInstructions ?? "Score each answer 0, 1 or 2 against the probe's key and rubric. An answer that labels its conclusion a guess, or says the text does not settle it, scores at most 1 unless the rubric says otherwise. Judge the answer, not its length or confidence.",
			"", "You do not know which answers came from which reader or document version, and must not try to infer it.",
			"", `Write one JSON object per line, for every answer id below and no others, to this file: ${path.join(run, "scores", sid + ".txt")}`,
			'Each line exactly: {"item": "<answer id>", "score": 0|1|2, "reason": "<one sentence>"}', "When written, reply with only DONE.",
		];
		for (const p of suite.probes) {
			const pid = `${sid}.${p.id}`;
			const mine = shuffle(its.filter((i) => i.probe === pid), rand);
			if (!mine.length) continue;
			lines.push("", "=".repeat(70), `PROBE ${pid}`, "", "Question:", p.question, "", "Key:", p.key, "", "Rubric:", p.rubric);
			for (const it of mine) lines.push("", `--- answer ${it.item} ---`, it.text);
		}
		fs.writeFileSync(path.join(run, "scorers", `${sid}.txt`), lines.join("\n") + "\n");
	}
	const scorersDigest = treeDigest(path.join(run, "scorers"));
	writeJSON(path.join(run, "sealed", "blind.json"), { seed, suites: [...bySuite.keys()], items: items.map(({ text, ...k }) => k), absent, scorersDigest });
	for (const d of ["scorers", "sealed"]) lockTree(path.join(run, d));
	process.stdout.write(`${items.length} answers blinded across ${bySuite.size} scorer prompts; ${absent.length} absent (scored 0)\n`);
	for (const s of bySuite.keys()) process.stdout.write(`  scorer: Read ${path.join(run, "scorers", s + ".txt")} and follow it exactly.\n`);
}

function collectScoreObjects(v, out) {
	if (!v || typeof v !== "object") return;
	if (Array.isArray(v)) { for (const x of v) collectScoreObjects(x, out); return; }
	if (typeof v.item === "string") { out.push(v); return; }
	for (const x of Object.values(v)) collectScoreObjects(x, out);
}

function parseScores(text) {
	const out = [];
	for (let i = 0; i < text.length; i++) {
		if (text[i] !== "{") continue;
		let depth = 0, inStr = false, esc = false, end = -1;
		for (let j = i; j < text.length; j++) {
			const ch = text[j];
			if (inStr) {
				if (esc) esc = false;
				else if (ch === "\\") esc = true;
				else if (ch === "\"") inStr = false;
				continue;
			}
			if (ch === "\"") inStr = true;
			else if (ch === "{") depth++;
			else if (ch === "}") {
				depth--;
				if (depth === 0) { end = j; break; }
			}
		}
		if (end < 0) continue;
		try {
			collectScoreObjects(JSON.parse(text.slice(i, end + 1)), out);
			i = end;
		} catch { /* stray brace in prose; continue scanning */ }
	}
	return out;
}

function cmdScore(o) {
	const run = path.resolve(String(o.run ?? die("score needs --run")));
	const m = readJSON(path.join(run, "sealed", "manifest.json"));
	const b = readJSON(path.join(run, "sealed", "blind.json"));
	const byItem = new Map(b.items.map((i) => [i.item, i]));
	const got = new Map();
	const errors = [];
	for (const c of m.corpora) {
		if (!c.digest) continue;
		if (!fs.existsSync(c.path)) { errors.push(`corpus ${c.label} missing at ${c.path}`); continue; }
		if (treeDigest(c.path) !== c.digest) errors.push(`corpus ${c.label} changed after prepare`);
	}
	if (m.promptsDigest) {
		const pdir = path.join(run, "prompts");
		if (!fs.existsSync(pdir)) errors.push("prompts/ missing");
		else if (treeDigest(pdir) !== m.promptsDigest) errors.push("prompts/ changed after prepare");
	}
	if (b.scorersDigest) {
		const sdir = path.join(run, "scorers");
		if (!fs.existsSync(sdir)) errors.push("scorers/ missing");
		else if (treeDigest(sdir) !== b.scorersDigest) errors.push("scorers/ changed after blind");
	}
	for (const s of b.suites) {
		const f = path.join(run, "scores", `${s}.txt`);
		if (!fs.existsSync(f)) { errors.push(`scores/${s}.txt missing`); continue; }
		for (const sc of parseScores(fs.readFileSync(f, "utf8"))) {
			if (!byItem.has(sc.item)) { errors.push(`unknown item ${sc.item} in scores/${s}.txt`); continue; }
			if (got.has(sc.item)) { errors.push(`item ${sc.item} scored twice`); continue; }
			if (![0, 1, 2].includes(sc.score)) { errors.push(`item ${sc.item} has score ${JSON.stringify(sc.score)}`); continue; }
			got.set(sc.item, sc);
		}
	}
	for (const i of b.items) if (!got.has(i.item)) errors.push(`item ${i.item} (${i.probe}) not scored`);
	if (errors.length) { for (const e of errors) process.stderr.write(`eval: ${e}\n`); die(`${errors.length} scoring defect(s); RESULT not written`, 1); }
	const promptOf = new Map(m.prompts.map((p) => [p.pid, p]));
	const rows = [];
	for (const i of b.items) { const p = promptOf.get(i.pid); const sc = got.get(i.item); rows.push({ label: p.label, reader: p.reader, pid: i.pid, probe: i.probe, score: sc.score, reason: sc.reason ?? "" }); }
	for (const a of b.absent) { const p = promptOf.get(a.pid); rows.push({ label: p.label, reader: p.reader, pid: a.pid, probe: a.probe, score: 0, reason: "no answer under this heading" }); }
	const labels = [...new Set(m.corpora.map((c) => c.label))];
	const probes = [...new Set(m.prompts.flatMap((p) => p.probes))];
	const mean = {};
	for (const pr of probes) { mean[pr] = {}; for (const l of labels) { const xs = rows.filter((r) => r.probe === pr && r.label === l).map((r) => r.score); mean[pr][l] = xs.length ? +(xs.reduce((a, c) => a + c, 0) / xs.length).toFixed(2) : null; } }
	const total = {};
	for (const l of labels) total[l] = +probes.reduce((a, pr) => a + (mean[pr][l] ?? 0), 0).toFixed(2);
	const result = { created: new Date().toISOString(), seed: b.seed, corpora: m.corpora, readers: m.readers, probes, max: probes.length * 2, mean, total, rows };
	// A probe where most readers of one corpus hedge - mark it not settled, or guess - points first at an
	// ambiguity in the corpus, not at the key. Twice in this corpus a consistent hedge was filed as a key
	// defect and was in fact the source failing to say which of two rules governs. Listed beside the
	// scores so the source is checked before the key is blamed.
	const HEDGE = /NOT SETTLED|GUESS:/;
	const hedges = [];
	for (const pr of probes) for (const l of labels) {
		const ps = m.prompts.filter((p) => p.label === l && p.probes.includes(pr));
		const n = ps.filter((p) => { const f = path.join(run, "answers", `${p.pid}.txt`); return fs.existsSync(f) && HEDGE.test(splitAnswers(fs.readFileSync(f, "utf8"), p.probes)[pr] ?? ""); }).length;
		if (ps.length && n * 2 > ps.length) hedges.push({ probe: pr, label: l, hedged: n, readers: ps.length });
	}
	result.consistentHedges = hedges;
	writeJSON(path.join(run, "RESULT.json"), result);
	// Generated, so style exempts it: the defect, if any, belongs to this tool, not to a hand edit.
	const md = ["<!-- GENERATED FILE by tools/eval.mjs score; do not edit by hand. -->", "# Result", "", `Readers per corpus: ${m.readers}. Scored blind by a separate agent; mapping in \`sealed/\`.`, "",
		`| Probe | ${labels.join(" | ")} |`, `|---|${labels.map(() => "---").join("|")}|`,
		...probes.map((pr) => `| ${pr} | ${labels.map((l) => mean[pr][l]).join(" | ")} |`),
		`| **Total / ${result.max}** | ${labels.map((l) => `**${total[l]}**`).join(" | ")} |`, "",
		// Generated beside every number, so a headline lifted from this table carries its limits with it.
		"## What this measures", "",
		`- Agents reading a corpus, scored against keys an author wrote, by agents of the same family: one measurement family, not ${m.readers} independent ones, and not a human judgement.`,
		"- Every reader also received the harness's always-on context, so a comparison against no corpus is confounded; a comparison between two corpora is not.",
		`- ${m.readers} readers per corpus: a difference of one reader on one probe moves its mean by ${(2 / m.readers).toFixed(2)}.`, "",
		"## Consistent hedges - check the source before the key", "",
		...(hedges.length ? hedges.map((h) => `- ${h.probe} (${h.label}): ${h.hedged} of ${h.readers} readers marked it not settled or guessed. Presume the corpus fails to say which rule governs until shown otherwise.`) : ["- none"]), ""];
	fs.writeFileSync(path.join(run, "RESULT.md"), md.join("\n"));
	process.stdout.write(md.join("\n"));
}

// --- compare -----------------------------------------------------------------------------------
function side(spec) {
	const s = String(spec); const i = s.lastIndexOf(":");
	const [file, label] = i > 1 && !s.slice(i + 1).includes("/") ? [s.slice(0, i), s.slice(i + 1)] : [s, null];
	const r = readJSON(path.resolve(file));
	const l = label ?? (r.corpora.length === 1 ? r.corpora[0].label : die(`${file} has several corpora; name one with :LABEL`));
	if (!r.corpora.some((c) => c.label === l)) die(`${file} has no corpus ${l}`);
	return { r, l, name: `${path.basename(path.dirname(path.resolve(file)))}:${l}` };
}
function cmdCompare(o) {
	if (!o.base || !o.head) die("compare needs --base and --head");
	const base = side(o.base), head = side(o.head);
	const tol = Number(o.tolerance ?? 0);
	const regress = [], better = [];
	for (const pr of base.r.probes) {
		const bv = base.r.mean[pr]?.[base.l];
		if (bv == null) continue;
		const hv = head.r.mean[pr]?.[head.l];
		if (hv == null) { regress.push(`${pr}: ${bv} -> absent`); continue; }
		if (hv < bv - tol) regress.push(`${pr}: ${bv} -> ${hv}`);
		else if (hv > bv) better.push(`${pr}: ${bv} -> ${hv}`);
	}
	process.stdout.write(`${base.name} -> ${head.name}, tolerance ${tol}\n`);
	for (const x of better) process.stdout.write(`  better   ${x}\n`);
	for (const x of regress) process.stdout.write(`  REGRESS  ${x}\n`);
	process.stdout.write(regress.length ? `${regress.length} regression(s)\n` : "no regressions\n");
	process.exit(regress.length ? 1 : 0);
}

const o = args(process.argv.slice(2));
const cmd = o._[0];
const table = { export: cmdExport, prepare: cmdPrepare, status: cmdStatus, blind: cmdBlind, score: cmdScore, compare: cmdCompare };
if (!table[cmd]) die("usage: eval.mjs export|prepare|status|blind|score|compare [options] - see the header");
table[cmd](o);
