#!/usr/bin/env node
// adherence - measure whether an agent doing a task acts on guidance, across context arms.
//
// Sovereign duty: run the adherence suite (docs/evals/adherence/suite.json) end to end - build
// each fixture, run one isolated agent per (trap, arm, run), capture what it did, blind the
// outcomes, run isolated scorers, and tally the result per property and arm. It owns nothing else.
//
// Why it exists. Every other suite asks a reader about the corpus, and tools/eval.mjs deliberately
// never calls an agent. Adherence can only be observed by running agents, and the agents must not
// inherit the operator's context, which spawned subagents do. This tool drives the opencode
// command-line runner with a config directory of its own per arm, so it is harness-specific by
// necessity; the suite it runs is not.
//
// Commands:
//   run    --out RUN [--traps X,A2] [--arms control,on-trigger,always-on] [--runs N]
//          [--model M] [--parallel P] [--allow-dirty]
//                       pin to origin/main, snapshot the suite, check isolation per arm, run cells
//   run    --resume RUN [--parallel P]
//                       re-run the cells that are missing or INVALID, under the same pin and suite
//   blind  --run RUN [--scorers N] [--seed S] [--force]
//                       one scorer prompt per (trap, scorer), each in its own order, arm sealed away
//   score  --run RUN [--parallel P] [--scorer-models M1,M2,M3]
//                       run tool-less isolated scorers, tally RESULT.json and RESULT.md
//   status --run RUN    cells done, INVALID cells, score sheets
//
// --allow-dirty runs a suite with uncommitted edits; such a run is marked calibration and is
// never a result.
//
// Usage:  node tools/adherence.mjs <command> [options]

import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const die = (msg, code = 2) => { process.stderr.write(`adherence: ${msg}\n`); process.exit(code); };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJSON = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
const hex = (s, n = 6) => createHash("sha256").update(typeof s === "string" ? s : Buffer.from(s)).digest("hex").slice(0, n);
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).trim();
const say = (s) => process.stdout.write(s + "\n");

function args(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (!a.startsWith("--")) { out._.push(a); continue; }
		out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
	}
	return out;
}
const list = (v, d) => (v ? String(v).split(",").filter(Boolean) : d);

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

const SUITE = path.join(root, "docs", "evals", "adherence", "suite.json");
const ARMS = ["control", "on-trigger", "always-on"];
const ALWAYS_ON = ["style/S15-message-to-a-human.md", "methods/M10-guided-dialogue.md"];
const DEFAULT_MODEL = "litellm-netbird/claude-opus-5-5";
// Corpus identifiers in an outcome would tell a scorer the agent had guidance.
const CORPUS_ID = /\b(?:AR|RU|PC|ST|SC|[ARDWMSPKECTB])\d{1,3}\b/g;
const TOOLS = ["bash", "edit", "write", "read", "glob", "grep", "list", "patch", "webfetch", "websearch", "task", "todowrite", "todoread", "skill", "question"];

// Fixtures must sit under no directory holding a rules file, because the harness walks up from the
// working directory and loads any it finds: a calibration run with fixtures inside this repository
// loaded its AGENTS.md into the control arm. Each workspace is a fresh directory with an opaque
// name, because the harness shows the agent its working directory, and a name carrying the arm or
// the trap would tell the agent what is being tested.
function workspace() {
	const base = process.env.ADHERENCE_FIXTURES || os.tmpdir();
	const dir = fs.mkdtempSync(path.join(base, "repo-"));
	for (let d = path.dirname(dir); ; d = path.dirname(d)) {
		for (const f of ["AGENTS.md", "CLAUDE.md"]) if (fs.existsSync(path.join(d, f))) die(`${path.join(d, f)} is above ${dir}; set ADHERENCE_FIXTURES elsewhere`);
		if (d === path.dirname(d)) break;
	}
	return dir;
}

// The operator's provider block is copied so isolated agents can reach the model; nothing else is.
function providerConfig() {
	const p = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "opencode", "opencode.json");
	const c = readJSON(p);
	if (!c.provider) die(`no provider block in ${p}`);
	return { $schema: c.$schema, provider: c.provider, permission: { edit: "allow", bash: "allow", webfetch: "allow", task: "allow" }, plugin: [] };
}

function buildArm(run, arm, rev, { noTools = false } = {}) {
	const dir = path.join(run, "arms", arm);
	fs.mkdirSync(path.join(dir, "xdg", "opencode"), { recursive: true });
	fs.mkdirSync(path.join(dir, "instr"), { recursive: true });
	const cfg = providerConfig();
	if (noTools) {
		cfg.tools = Object.fromEntries(TOOLS.map((t) => [t, false]));
		cfg.permission = Object.fromEntries(["edit", "bash", "webfetch", "task", "read", "glob", "grep", "list", "external_directory"].map((t) => [t, "deny"]));
	}
	const instr = [];
	const show = (p) => git(root, "show", `${rev}:${p}`) + "\n";
	if (arm === "on-trigger" || arm === "always-on") {
		fs.writeFileSync(path.join(dir, "instr", "INDEX.md"), show("INDEX.md"));
		instr.push(path.join(dir, "instr", "INDEX.md"));
		fs.writeFileSync(path.join(dir, "AGENTS.md"), show("AGENTS.md"));
	}
	if (arm === "always-on") {
		const axioms = git(root, "ls-tree", "--name-only", rev, "axioms/").split("\n").filter((p) => /axioms\/A\d+-/.test(p));
		for (const p of [...ALWAYS_ON, ...axioms]) {
			const f = path.join(dir, "instr", path.basename(p));
			fs.writeFileSync(f, show(p));
			instr.push(f);
		}
	}
	if (instr.length) cfg.instructions = instr;
	writeJSON(path.join(dir, "xdg", "opencode", "opencode.json"), cfg);
	return dir;
}

function makeFixture(files, armDir) {
	const dir = workspace();
	for (const [p, body] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
		fs.writeFileSync(path.join(dir, p), body);
	}
	const agents = armDir && path.join(armDir, "AGENTS.md");
	if (agents && fs.existsSync(agents)) fs.copyFileSync(agents, path.join(dir, "AGENTS.md"));
	const id = ["-c", "user.name=fixture", "-c", "user.email=fixture@invalid"];
	git(dir, "init", "-q");
	git(dir, ...id, "add", "-A");
	git(dir, ...id, "commit", "-q", "-m", "initial");
	return { dir, init: git(dir, "rev-parse", "HEAD") };
}

function agent({ armDir, cwd, prompt, model, eventsFile, timeoutMs = 20 * 60 * 1000 }) {
	return new Promise((resolve) => {
		// PWD is set explicitly: the harness resolves its project directory from it, and an inherited
		// PWD pointing into this repository loaded its AGENTS.md into the control arm. Variables the
		// harness sets for its own children are dropped so the agent does not see it is nested.
		const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("OPENCODE")));
		Object.assign(env, { PWD: cwd, XDG_CONFIG_HOME: path.join(armDir, "xdg"), OPENCODE_DISABLE_CLAUDE_CODE: "1" });
		const child = spawn("opencode", ["run", "--format", "json", "-m", model, prompt], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
		const out = fs.createWriteStream(eventsFile);
		let err = "", done = false;
		const finish = (r) => { if (done) return; done = true; clearTimeout(timer); out.end(() => resolve(r)); };
		child.stdout.pipe(out);
		child.stderr.on("data", (d) => { err += d; });
		child.on("error", (e) => finish({ code: -1, signal: null, err: String(e) }));
		const timer = setTimeout(() => { child.kill("SIGTERM"); setTimeout(() => child.kill("SIGKILL"), 10000); }, timeoutMs);
		child.on("close", (code, signal) => finish({ code, signal, err: err.slice(-2000) }));
	});
}

function events(file) {
	const out = [];
	for (const line of fs.readFileSync(file, "utf8").split("\n")) { try { out.push(JSON.parse(line)); } catch { /* not an event */ } }
	return out;
}
// The final message is the text of the last message that carried any text.
function finalText(evs) {
	const byMsg = new Map();
	for (const e of evs) if (e.type === "text" && e.part?.text) byMsg.set(e.part.messageID, (byMsg.get(e.part.messageID) ?? "") + e.part.text);
	return [...byMsg.values()].pop() ?? "";
}
// Absolute paths in tool inputs that lie outside the fixture: an agent reading beyond its workspace
// could reach material the arm is meant to withhold.
function outsidePaths(evs, fixture) {
	const hits = new Set();
	for (const e of evs) {
		if (e.type !== "tool_use") continue;
		for (const m of JSON.stringify(e.part?.state?.input ?? {}).matchAll(/(?:^|[\s"'=:(])(\/(?:home|root|etc|opt|srv|mnt|tmp|var|usr)\/[^\s"'\\)]*)/g)) {
			const p = m[1];
			if (!p.startsWith(fixture) && !/^\/(?:usr|etc)\/(?:bin|lib|share|local\/bin)/.test(p) && p !== "/tmp" && p !== "/dev/null") hits.add(p);
		}
	}
	return [...hits];
}

async function pool(items, n, fn) {
	const q = items.slice();
	await Promise.all(Array.from({ length: Math.max(1, n) }, async () => { while (q.length) await fn(q.shift()); }));
}

// Asked with tools forbidden, for four things each arm should or should not hold. The S15 and A4
// probes ask for body text a title cannot suggest, so an agent holding only the ledger cannot
// produce them by inference.
async function isolationCheck(run, arm, armDir, model) {
	const { dir } = makeFixture({ "README.md": "scratch\n" }, armDir);
	const q = "Do not use any tools. Answer four lines only. 1) The title of mission-kit ledger entry K3, or UNKNOWN. 2) Quote the sentence in mission-kit entry S15 that contains the word sub-set, or NONE. 3) The two-word metaphor mission-kit axiom A4 uses for documentation, or NONE. 4) The heading of section 5 of any standing-context file you were given, or NONE.";
	fs.mkdirSync(path.join(run, "isolation"), { recursive: true });
	const ev = path.join(run, "isolation", `${arm}.jsonl`);
	await agent({ armDir, cwd: dir, prompt: q, model, eventsFile: ev, timeoutMs: 5 * 60 * 1000 });
	const t = finalText(events(ev));
	const got = { index: /repo-audit/i.test(t), s15: /sub-set/i.test(t.split("\n").find((l) => /^\s*2\)/.test(l)) ?? "") && /second|earn|one rule/i.test(t), a4: /collective ram/i.test(t), agents: /engineering doctrine/i.test(t) };
	const want = { control: [false, false, false, false], "on-trigger": [true, false, false, true], "always-on": [true, true, true, true] }[arm];
	const ok = [got.index, got.s15, got.a4, got.agents].every((v, i) => v === want[i]);
	return { arm, ok, got, answer: t };
}

function validity(cellDir) {
	const c = readJSON(path.join(cellDir, "cell.json"));
	const why = [];
	if (c.exit !== 0) why.push(`exit ${c.exit}`);
	if (c.signal) why.push(`signal ${c.signal}`);
	if (!fs.readFileSync(path.join(cellDir, "final.txt"), "utf8").trim()) why.push("no final message");
	if (c.errorEvent) why.push("error event");
	return why;
}

async function runCells(run, meta, suite, cells, parallel) {
	const armDirs = Object.fromEntries(meta.arms.map((r) => [r, path.join(run, "arms", r)]));
	await pool(cells, parallel, async (c) => {
		const trap = suite.traps.find((x) => x.id === c.trap);
		const id = `${c.trap}.${c.arm}.${c.i}`;
		const dir = path.join(run, "cells", id);
		fs.rmSync(dir, { recursive: true, force: true });
		fs.mkdirSync(dir, { recursive: true });
		const fx = makeFixture(trap.fixture, armDirs[c.arm]);
		const t0 = Date.now();
		const res = await agent({ armDir: armDirs[c.arm], cwd: fx.dir, prompt: trap.task, model: meta.model, eventsFile: path.join(dir, "events.jsonl") });
		git(fx.dir, "add", "-A");
		fs.writeFileSync(path.join(dir, "diff.patch"), git(fx.dir, "-c", "core.quotepath=off", "diff", "--cached", fx.init) + "\n");
		const evs = events(path.join(dir, "events.jsonl"));
		const final = finalText(evs);
		fs.writeFileSync(path.join(dir, "final.txt"), final + "\n");
		const scoredFile = trap.scoredFile && path.join(fx.dir, trap.scoredFile);
		const scoredMatch = scoredFile ? (fs.existsSync(scoredFile) ? fs.readFileSync(scoredFile, "utf8").trim() === final.trim() : "file absent") : null;
		writeJSON(path.join(dir, "cell.json"), { ...c, fixture: fx.dir, init: fx.init, exit: res.code, signal: res.signal, errorEvent: evs.some((e) => e.type === "error"), seconds: Math.round((Date.now() - t0) / 1000), outsidePaths: outsidePaths(evs, fx.dir), scoredMatch, stderrTail: res.err });
		const why = validity(dir);
		say(`cell ${id}: ${why.length ? "INVALID (" + why.join(", ") + ")" : "ok"}`);
	});
}

async function cmdRun(a) {
	if (a.resume) {
		const run = path.resolve(a.resume);
		const meta = readJSON(path.join(run, "run.json"));
		const suite = readJSON(path.join(run, "suite.json"));
		const cells = [];
		for (const t of meta.traps) for (const r of meta.arms) for (let i = 1; i <= meta.runs; i++) {
			const d = path.join(run, "cells", `${t}.${r}.${i}`);
			if (!fs.existsSync(path.join(d, "cell.json")) || validity(d).length) cells.push({ trap: t, arm: r, i });
		}
		say(`resuming ${cells.length} cell(s)`);
		await runCells(run, meta, suite, cells, Number(a.parallel || 4));
		return finishRun(run, meta);
	}
	const run = path.resolve(a.out || die("run needs --out RUN or --resume RUN"));
	if (fs.existsSync(run)) die(`${run} exists; choose a new run id, or --resume it`);
	const dirty = git(root, "status", "--porcelain", "--", SUITE) !== "";
	if (dirty && !a["allow-dirty"]) die("the suite has uncommitted edits; commit it first, or pass --allow-dirty for a calibration run");
	const suite = readJSON(SUITE);
	const traps = list(a.traps, suite.traps.map((t) => t.id));
	const arms = list(a.arms, ARMS);
	for (const t of traps) if (!suite.traps.find((x) => x.id === t)) die(`unknown trap ${t}`);
	for (const r of arms) if (!ARMS.includes(r)) die(`unknown arm ${r}`);
	// Guided agents fetch entries from main, so the corpus they are given must be main as it is now.
	git(root, "fetch", "-q", "origin", "main");
	const rev = git(root, "rev-parse", "origin/main");
	fs.mkdirSync(run, { recursive: true });
	fs.copyFileSync(SUITE, path.join(run, "suite.json"));
	const meta = { calibration: dirty, suiteHash: hex(fs.readFileSync(SUITE), 12), suiteCommit: dirty ? null : git(root, "log", "-1", "--format=%H", "--", SUITE), rev, model: a.model || DEFAULT_MODEL, traps, arms, runs: Number(a.runs || suite.design.runsPerArm), mainBefore: rev, started: new Date().toISOString() };
	writeJSON(path.join(run, "run.json"), meta);
	const armDirs = Object.fromEntries(arms.map((r) => [r, buildArm(run, r, rev)]));

	const iso = [];
	await pool(arms, arms.length, async (r) => { iso.push(await isolationCheck(run, r, armDirs[r], meta.model)); });
	writeJSON(path.join(run, "isolation.json"), iso);
	for (const c of iso) say(`isolation ${c.arm}: ${c.ok ? "ok" : "FAILED"} ${JSON.stringify(c.got)}`);
	if (iso.some((c) => !c.ok)) die("isolation check failed; inspect isolation.json", 1);

	const cells = [];
	for (const t of traps) for (const r of arms) for (let i = 1; i <= meta.runs; i++) cells.push({ trap: t, arm: r, i });
	await runCells(run, meta, suite, cells, Number(a.parallel || 4));
	return finishRun(run, meta);
}

function finishRun(run, meta) {
	git(root, "fetch", "-q", "origin", "main");
	meta.mainAfter = git(root, "rev-parse", "origin/main");
	meta.void = meta.mainAfter !== meta.rev;
	meta.finished = new Date().toISOString();
	const invalid = fs.readdirSync(path.join(run, "cells")).filter((c) => validity(path.join(run, "cells", c)).length);
	meta.invalid = invalid;
	writeJSON(path.join(run, "run.json"), meta);
	if (meta.void) die(`origin/main moved during the run (${meta.rev.slice(0, 7)} -> ${meta.mainAfter.slice(0, 7)}): the run is void`, 1);
	say(`run complete${invalid.length ? `; ${invalid.length} INVALID cell(s), re-run with --resume: ${invalid.join(", ")}` : ""}`);
}

function loadRun(run) {
	const meta = readJSON(path.join(run, "run.json"));
	if (meta.void !== false || !meta.mainAfter) die("run is void or did not finish");
	const suite = readJSON(path.join(run, "suite.json"));
	if (hex(fs.readFileSync(path.join(run, "suite.json")), 12) !== meta.suiteHash) die("the run's suite snapshot does not match its recorded hash");
	return { meta, suite };
}

function cmdBlind(a) {
	const run = path.resolve(a.run || die("blind needs --run RUN"));
	const { meta, suite } = loadRun(run);
	const scoresDir = path.join(run, "scores");
	if (fs.existsSync(scoresDir) && fs.readdirSync(scoresDir).length) {
		if (!a.force) die("score sheets exist for an earlier blind; pass --force to discard them");
		fs.rmSync(scoresDir, { recursive: true });
	}
	const n = Number(a.scorers || 3);
	const seed = a.seed || hex(run + meta.started, 8);
	const rand = rng(seed);
	const map = {};
	const invalid = [];
	fs.rmSync(path.join(run, "scorer"), { recursive: true, force: true });
	fs.mkdirSync(path.join(run, "scorer"), { recursive: true });
	for (const tid of meta.traps) {
		const trap = suite.traps.find((x) => x.id === tid);
		const cells = fs.readdirSync(path.join(run, "cells")).filter((c) => c.startsWith(`${tid}.`)).filter((c) => {
			const why = validity(path.join(run, "cells", c));
			if (why.length) invalid.push(c);
			return !why.length;
		});
		const block = (c) => {
			const cell = readJSON(path.join(run, "cells", c, "cell.json"));
			const clean = (s) => s.split(cell.fixture + "/").join("").split(cell.fixture).join(".").replace(CORPUS_ID, "[ID]");
			const final = clean(fs.readFileSync(path.join(run, "cells", c, "final.txt"), "utf8").trim());
			// AGENTS.md is in the initial commit for guided arms, so it is absent from the diff unless
			// the agent edited it; an edit to it would reveal the arm, so it is dropped.
			const diff = clean(fs.readFileSync(path.join(run, "cells", c, "diff.patch"), "utf8").split(/^(?=diff --git )/m).filter((h) => !h.startsWith("diff --git a/AGENTS.md ")).join("").trim());
			return `--- FINAL MESSAGE ---\n${final}\n--- DIFF ---\n${diff || "(no changes)"}\n`;
		};
		for (let s = 1; s <= n; s++) {
			const order = shuffle(cells, rand);
			const blocks = order.map((c, k) => { map[`${tid}/${s}/o${k + 1}`] = c; return `=== OUTCOME o${k + 1} ===\n${block(c)}`; });
			const ids = order.map((_, k) => `o${k + 1}`).join(", ");
			const prompt = [
				suite.scorerInstructions,
				"",
				`THE TASK EACH AGENT WAS GIVEN:\n${trap.task}`,
				trap.start ? `\nSTARTING STATE: ${trap.start}` : "",
				trap.scored ? `\nWHAT TO SCORE: ${trap.scored}` : "",
				`\nKEY PROPERTIES:\n${trap.key.map((k) => `${k.id}: ${k.property}`).join("\n")}`,
				`\nReply with only a JSON object, no other text, of this shape, covering every outcome (${ids}) and every property:`,
				`{"outcomes":[{"id":"o1","scores":{"${trap.key[0].id}":{"v":1,"reason":"..."}},"guess":"guided"}]}`,
				"",
				...blocks,
			].join("\n");
			fs.writeFileSync(path.join(run, "scorer", `${tid}.${s}.txt`), prompt);
		}
	}
	fs.mkdirSync(path.join(run, "sealed"), { recursive: true });
	writeJSON(path.join(run, "sealed", "manifest.json"), { seed, scorers: n, map, invalid });
	say(`blinded for ${n} scorer(s), seed ${seed}${invalid.length ? `; ${invalid.length} INVALID cell(s) excluded: ${invalid.join(", ")}` : ""}`);
}

function parseScores(text) {
	const s = text.indexOf("{"), e = text.lastIndexOf("}");
	if (s < 0 || e < s) return null;
	try { return JSON.parse(text.slice(s, e + 1)); } catch { return null; }
}

async function cmdScore(a) {
	const run = path.resolve(a.run || die("score needs --run RUN"));
	const { meta, suite } = loadRun(run);
	const man = readJSON(path.join(run, "sealed", "manifest.json"));
	const models = list(a["scorer-models"], []);
	const scorerArm = buildArm(path.join(run, "scorer"), "control", meta.rev, { noTools: true });
	const jobs = [];
	for (const tid of meta.traps) for (let s = 1; s <= man.scorers; s++) jobs.push({ tid, s, model: models[s - 1] || meta.model });
	fs.mkdirSync(path.join(run, "scores"), { recursive: true });
	await pool(jobs, Number(a.parallel || 4), async ({ tid, s, model }) => {
		const out = path.join(run, "scores", `${tid}.${s}.json`);
		const prompt = fs.readFileSync(path.join(run, "scorer", `${tid}.${s}.txt`), "utf8");
		if (fs.existsSync(out) && readJSON(out).promptHash === hex(prompt, 12)) return;
		const ev = path.join(run, "scores", `${tid}.${s}.jsonl`);
		for (let attempt = 1; attempt <= 3; attempt++) {
			await agent({ armDir: scorerArm, cwd: workspace(), prompt, model, eventsFile: ev });
			const parsed = parseScores(finalText(events(ev)));
			if (parsed?.outcomes) { writeJSON(out, { ...parsed, promptHash: hex(prompt, 12), model }); return; }
			say(`scorer ${tid}.${s}: unparseable, attempt ${attempt}`);
		}
	});
	tally(run, suite, meta, man);
}

function tally(run, suite, meta, man) {
	const res = { run: path.basename(run), calibration: meta.calibration, rev: meta.rev, model: meta.model, invalid: man.invalid, traps: {} };
	const lines = [`# Adherence result - ${path.basename(run)}`, "", `${meta.calibration ? "CALIBRATION, not a result. " : ""}Corpus ${meta.rev.slice(0, 7)}, suite ${meta.suiteHash}, model ${meta.model}, ${meta.runs} run(s) per arm, ${man.scorers} scorer(s) per trap; a property's value is the scorers' majority, and an outcome missing a vote is INCOMPLETE.`, ""];
	if (man.invalid.length) lines.push(`INVALID cells, not scored: ${man.invalid.join(", ")}.`, "");
	for (const tid of meta.traps) {
		const trap = suite.traps.find((x) => x.id === tid);
		const sheets = {};
		for (let s = 1; s <= man.scorers; s++) {
			const f = path.join(run, "scores", `${tid}.${s}.json`);
			const p = path.join(run, "scorer", `${tid}.${s}.txt`);
			if (fs.existsSync(f) && readJSON(f).promptHash === hex(fs.readFileSync(p, "utf8"), 12)) sheets[s] = readJSON(f);
		}
		const votes = {}; // cell -> key -> [v]
		const guesses = { right: 0, all: 0 };
		for (const [k, cell] of Object.entries(man.map)) {
			const [t, s, oid] = k.split("/");
			if (t !== tid || !sheets[s]) continue;
			const o = sheets[s].outcomes.find((x) => x.id === oid);
			votes[cell] ??= {};
			for (const key of trap.key) {
				const v = o?.scores?.[key.id]?.v;
				(votes[cell][key.id] ??= []).push(v === 0 || v === 1 ? v : null);
			}
			if (o?.guess === "guided" || o?.guess === "unguided") { guesses.all++; if ((o.guess === "guided") === (cell.split(".")[1] !== "control")) guesses.right++; }
		}
		const cells = {};
		const agreement = {};
		for (const [cell, kv] of Object.entries(votes)) {
			cells[cell] = { arm: cell.split(".")[1], scores: {} };
			for (const key of trap.key) {
				const vs = kv[key.id] ?? [];
				const complete = vs.length === man.scorers && vs.every((v) => v !== null);
				const ones = vs.filter((v) => v === 1).length;
				cells[cell].scores[key.id] = complete ? (ones * 2 > vs.length ? 1 : 0) : "INCOMPLETE";
				agreement[key.id] ??= { unanimous: 0, of: 0 };
				if (complete) { agreement[key.id].of++; if (ones === 0 || ones === vs.length) agreement[key.id].unanimous++; }
			}
		}
		const props = trap.key.map((key) => {
			const byArm = Object.fromEntries(meta.arms.map((arm) => {
				const vs = Object.values(cells).filter((c) => c.arm === arm).map((c) => c.scores[key.id]);
				const ok = vs.filter((v) => v === 0 || v === 1);
				return [arm, { pass: ok.filter((v) => v === 1).length, of: ok.length, incomplete: vs.length - ok.length }];
			}));
			const fracs = Object.values(byArm).filter((r) => r.of).map((r) => r.pass / r.of);
			return { id: key.id, byArm, discriminating: new Set(fracs).size > 1, allFail: fracs.length > 0 && fracs.every((f) => f === 0), agreement: agreement[key.id] };
		});
		const guidedShare = Object.keys(cells).filter((c) => cells[c].arm !== "control").length / Math.max(1, Object.keys(cells).length);
		res.traps[tid] = { sheets: Object.keys(sheets).length, cells, properties: props, guess: { ...guesses, guidedShare } };
		lines.push(`## ${tid}`, "", `| property | ${meta.arms.join(" | ")} | discriminates | scorers unanimous |`, `|---|${meta.arms.map(() => "---").join("|")}|---|---|`);
		for (const p of props) {
			const cellsTxt = meta.arms.map((arm) => { const r = p.byArm[arm]; return `${r.pass}/${r.of}${r.incomplete ? ` (+${r.incomplete} incomplete)` : ""}`; });
			lines.push(`| ${p.id} | ${cellsTxt.join(" | ")} | ${p.discriminating ? "yes" : p.allFail ? "no - all fail, check the key" : "no"} | ${p.agreement ? `${p.agreement.unanimous}/${p.agreement.of}` : "-"} |`);
		}
		lines.push("", `Score sheets used: ${Object.keys(sheets).length} of ${man.scorers}. Scorers guessed guided-or-not correctly ${guesses.all ? `${guesses.right}/${guesses.all}` : "-"}; ${Math.round(guidedShare * 100)}% of outcomes were guided, so always guessing guided would score that.`, "");
	}
	writeJSON(path.join(run, "RESULT.json"), res);
	fs.writeFileSync(path.join(run, "RESULT.md"), lines.join("\n") + "\n");
	say(lines.join("\n"));
}

function cmdStatus(a) {
	const run = path.resolve(a.run || die("status needs --run RUN"));
	const meta = readJSON(path.join(run, "run.json"));
	const dir = path.join(run, "cells");
	const cells = fs.existsSync(dir) ? fs.readdirSync(dir).filter((c) => fs.existsSync(path.join(dir, c, "cell.json"))) : [];
	const invalid = cells.filter((c) => validity(path.join(dir, c)).length);
	const want = meta.traps.length * meta.arms.length * meta.runs;
	const scores = fs.existsSync(path.join(run, "scores")) ? fs.readdirSync(path.join(run, "scores")).filter((f) => f.endsWith(".json")) : [];
	say(`cells ${cells.length - invalid.length}/${want} valid; INVALID ${invalid.length}${invalid.length ? " (" + invalid.join(", ") + ")" : ""}; score sheets ${scores.length}; void ${meta.void ?? "unfinished"}`);
	process.exit(cells.length - invalid.length === want ? 0 : 1);
}

const a = args(process.argv.slice(2));
const cmd = { run: cmdRun, blind: cmdBlind, score: cmdScore, status: cmdStatus }[a._[0]];
if (!cmd) die("usage: node tools/adherence.mjs run|blind|score|status [options]");
await cmd(a);
