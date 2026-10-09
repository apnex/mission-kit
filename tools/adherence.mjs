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
//   run    --out RUN [--traps X,A2] [--arms control,on-trigger,always-on] [--families c,g,o]
//          [--runs N] [--parallel P] [--allow-dirty]
//                       pin to origin/main, snapshot the suite, check isolation per arm and
//                       family, run one cell per (trap, arm, family, run)
//   run    --resume RUN [--parallel P]
//                       re-run the cells that are missing or INVALID, under the same pin and suite
//   blind  --run RUN [--seed S] [--force]
//                       scorer prompts per (trap, scorer family), each holding only outcomes from
//                       the other families, in an order of their own, arm and family sealed away
//   score  --run RUN [--parallel P]
//                       run isolated scorers, tally RESULT.json and RESULT.md
//   status --run RUN    cells done, INVALID cells, score sheets
//
// --allow-dirty runs a suite with uncommitted edits; such a run is marked calibration and is
// never a result.
//
// Families: c = Claude and g = Gemini, both through opencode and the operator's LiteLLM provider;
// o = GPT through the Codex command-line runner. Each outcome is scored by the two families other
// than its agent's, so no family judges its own work.
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
const FAMILIES = {
	c: { name: "claude", model: "litellm-netbird/claude-opus-5-5" },
	g: { name: "gemini", model: "litellm-netbird/gemini-3.8-flash" },
	o: { name: "gpt", model: "codex:gpt-6-astra", effort: "high" },
};
const CHUNK = 6; // outcomes per scorer prompt, so no prompt nears the per-argument size limit
// Corpus identifiers in an outcome would tell a scorer the agent had guidance.
const CORPUS_ID = /\b(?:AR|RU|PC|ST|SC|[ARDWMSPKECTB])\d{1,3}\b/g;
const TOOLS = ["bash", "edit", "write", "read", "glob", "grep", "list", "patch", "webfetch", "websearch", "task", "todowrite", "todoread", "skill", "question"];

// Fixtures must sit under no directory holding a rules file, because the harness walks up from the
// working directory and loads any it finds: a calibration run with fixtures inside this repository
// loaded its AGENTS.md into the control arm. Each workspace is a fresh directory with an opaque
// name, because the harness shows the agent its working directory, and a name carrying the arm or
// the trap would tell the agent what is being tested.
// Not under /tmp: a reboot there lost another project's run records.
const WORK = process.env.ADHERENCE_FIXTURES || path.join(os.homedir(), "adherence-eval-work");
// Paths an agent must never touch: the workspace holding this repository, and the run records.
// Harness guards do not cover absolute paths inside shell commands, so a cell that touches one is
// detected afterwards and marked INVALID.
const FORBIDDEN = [path.dirname(root)];
function workspace(prefix = "repo-") {
	fs.mkdirSync(WORK, { recursive: true });
	const dir = fs.mkdtempSync(path.join(WORK, prefix));
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
	// read is allowed outright: opencode's default asks before reading .env files, a non-interactive
	// run rejects the ask, and a Gemini agent given the A2 fixture stopped there with no reply.
	// external_directory is denied rather than left to ask: a refused ask ends a non-interactive
	// session with no reply, while a denial returns an error the agent can work around.
	return { $schema: c.$schema, provider: c.provider, permission: { edit: "allow", bash: "allow", read: "allow", webfetch: "allow", task: "allow", external_directory: "deny" }, plugin: [] };
}

// An arm's config lives outside this repository under an opaque name, because both harnesses show
// the agent the paths of its instruction files: the first full run kept them under the run
// directory, and guided agents read the arm's name, the evaluation, and the local corpus from it.
function buildArm(run, arm, rev, { noTools = false } = {}) {
	const dir = workspace("cfg-");
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
	// Codex has no list of instruction files; the same files go into developer_instructions in a
	// private CODEX_HOME, which holds nothing else but a copy of the operator's login. It reads
	// AGENTS.md from the working directory itself, as opencode does.
	const home = path.join(dir, "codex-home");
	fs.mkdirSync(home, { recursive: true });
	const auth = path.join(os.homedir(), ".codex", "auth.json");
	if (fs.existsSync(auth)) { fs.copyFileSync(auth, path.join(home, "auth.json")); fs.chmodSync(path.join(home, "auth.json"), 0o600); }
	const text = instr.map((f) => `<file name="${path.basename(f)}">\n${fs.readFileSync(f, "utf8")}</file>`).join("\n\n");
	fs.writeFileSync(path.join(home, "config.toml"), text ? `developer_instructions = ${JSON.stringify(text)}\n` : "");
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

function agent({ armDir, cwd, prompt, model, eventsFile, timeoutMs = 20 * 60 * 1000, readOnly = false }) {
	return new Promise((resolve) => {
		// PWD is set explicitly: the harness resolves its project directory from it, and an inherited
		// PWD pointing into this repository loaded its AGENTS.md into the control arm. Variables the
		// harnesses set for their own children are dropped so the agent does not see it is nested.
		const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("OPENCODE") && !k.startsWith("CODEX")));
		let cmd, argv;
		fs.rmSync(`${eventsFile}.last.txt`, { force: true });
		if (model.startsWith("codex:")) {
			// --ignore-rules skips execution-policy files only; AGENTS.md in the working directory is
			// still read, which the on-trigger arm relies on (probed before this runner used Codex).
			// Network is opened in the sandbox so guided agents can fetch entries, as opencode agents can.
			Object.assign(env, { PWD: cwd, CODEX_HOME: path.join(armDir, "codex-home") });
			cmd = "codex";
			argv = ["exec", "--json", "--ephemeral", "--skip-git-repo-check", "--ignore-rules", "-m", model.slice(6),
				"-c", `model_reasoning_effort="${FAMILIES.o.effort}"`, "-c", 'approval_policy="never"', "-c", "sandbox_workspace_write.network_access=true",
				"--sandbox", readOnly ? "read-only" : "workspace-write", "-C", cwd, "-o", `${eventsFile}.last.txt`, prompt];
		} else {
			Object.assign(env, { PWD: cwd, XDG_CONFIG_HOME: path.join(armDir, "xdg"), OPENCODE_DISABLE_CLAUDE_CODE: "1" });
			cmd = "opencode";
			argv = ["run", "--format", "json", "-m", model, prompt];
		}
		const child = spawn(cmd, argv, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
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
// The final message: Codex writes it to a file; for opencode, the last message that carried text.
function finalTextOf(eventsFile) {
	const last = `${eventsFile}.last.txt`;
	return fs.existsSync(last) ? fs.readFileSync(last, "utf8") : finalText(events(eventsFile));
}
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
		const input = e.type === "tool_use" ? e.part?.state?.input : e.item?.type === "command_execution" ? e.item.command : e.item?.type === "file_change" ? e.item : null;
		if (!input) continue;
		for (const m of JSON.stringify(input).replaceAll("~/", os.homedir() + "/").matchAll(/(?:^|[\s"'=:(])(\/(?:home|root|etc|opt|srv|mnt|tmp|var|usr)\/[^\s"'\\)]*)/g)) {
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

// Asked with tools forbidden, for four things each arm should or should not hold. Answers are
// matched on their text, not on line numbering, which one model dropped in a correct answer. The S15 and A4
// probes ask for body text a title cannot suggest, so an agent holding only the ledger cannot
// produce them by inference.
async function isolationCheck(run, arm, fam, armDir) {
	const model = FAMILIES[fam].model;
	const { dir } = makeFixture({ "README.md": "scratch\n" }, armDir);
	const q = "Do not use any tools. Answer four lines only. 1) The title of mission-kit ledger entry K3, or UNKNOWN. 2) Quote the sentence in mission-kit entry S15 that contains the word sub-set, or NONE. 3) The two-word metaphor mission-kit axiom A4 uses for documentation, or NONE. 4) The heading of section 5 of any standing-context file you were given, or NONE.";
	fs.mkdirSync(path.join(run, "isolation"), { recursive: true });
	const ev = path.join(run, "isolation", `${arm}.${fam}.jsonl`);
	await agent({ armDir, cwd: dir, prompt: q, model, eventsFile: ev, timeoutMs: 5 * 60 * 1000, readOnly: true });
	const t = finalTextOf(ev);
	const got = { index: /repo-audit/i.test(t), s15: /sub-set/i.test(t) && /second|earn|one rule/i.test(t), a4: /collective ram/i.test(t), agents: /engineering doctrine/i.test(t) };
	const want = { control: [false, false, false, false], "on-trigger": [true, false, false, true], "always-on": [true, true, true, true] }[arm];
	let ok = [got.index, got.s15, got.a4, got.agents].every((v, i) => v === want[i]) && /\S/.test(t);
	// A guided agent must also be able to reach an entry the ledger points to, by fetching it.
	if (arm !== "control") {
		const { dir: d2 } = makeFixture({ "README.md": "scratch\n" }, armDir);
		const ev2 = path.join(run, "isolation", `${arm}.${fam}.reach.jsonl`);
		await agent({ armDir, cwd: d2, prompt: "Using the address the mission-kit ledger gives, fetch mission-kit entry S15 and quote the one sentence in it that contains the word sub-set. Reply with that sentence only.", model, eventsFile: ev2, timeoutMs: 5 * 60 * 1000 });
		got.reach = /sub-set/i.test(finalTextOf(ev2));
		ok = ok && got.reach;
	}
	return { arm, fam, ok, got, answer: t };
}

// Forbidden: the workspace holding this repository, or another fixture or config under the work
// directory. Looking for a rules file in the work directory itself is allowed - Codex agents do it,
// and nothing is there - and is still recorded in outsidePaths.
function forbiddenOf(paths, armDir) {
	const other = new RegExp(`^${WORK.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?:repo|cfg)-`);
	return (paths ?? []).filter((p) => FORBIDDEN.some((f) => p.startsWith(f)) || (other.test(p) && !p.startsWith(armDir)));
}
function validity(cellDir) {
	const c = readJSON(path.join(cellDir, "cell.json"));
	const meta = readJSON(path.join(cellDir, "..", "..", "run.json"));
	const forbidden = forbiddenOf(c.outsidePaths, meta.armDirs?.[c.arm] ?? "\0");
	const why = [];
	if (c.exit !== 0) why.push(`exit ${c.exit}`);
	if (c.signal) why.push(`signal ${c.signal}`);
	if (!fs.readFileSync(path.join(cellDir, "final.txt"), "utf8").trim()) why.push("no final message");
	if (c.errorEvent) why.push("error event");
	if (forbidden.length) why.push(`touched ${forbidden[0]}`);
	return why;
}

async function runCells(run, meta, suite, cells, parallel) {
	const armDirs = meta.armDirs;
	await pool(cells, parallel, async (c) => {
		const trap = suite.traps.find((x) => x.id === c.trap);
		const id = `${c.trap}.${c.arm}.${c.fam}.${c.i}`;
		const dir = path.join(run, "cells", id);
		// A re-run keeps why earlier attempts were INVALID: re-running only failures selects which
		// attempts count, so the number per arm is reported in case it is uneven.
		let prior = [];
		if (fs.existsSync(path.join(dir, "cell.json"))) prior = [...(readJSON(path.join(dir, "cell.json")).priorInvalid ?? []), validity(dir).join(", ")];
		fs.rmSync(dir, { recursive: true, force: true });
		fs.mkdirSync(dir, { recursive: true });
		const fx = makeFixture(trap.fixture, armDirs[c.arm]);
		const t0 = Date.now();
		const ev = path.join(dir, "events.jsonl");
		const res = await agent({ armDir: armDirs[c.arm], cwd: fx.dir, prompt: trap.task, model: FAMILIES[c.fam].model, eventsFile: ev });
		git(fx.dir, "add", "-A");
		fs.writeFileSync(path.join(dir, "diff.patch"), git(fx.dir, "-c", "core.quotepath=off", "diff", "--cached", fx.init) + "\n");
		const evs = events(ev);
		const final = finalTextOf(ev);
		fs.writeFileSync(path.join(dir, "final.txt"), final + "\n");
		const scoredFile = trap.scoredFile && path.join(fx.dir, trap.scoredFile);
		const scoredMatch = scoredFile ? (fs.existsSync(scoredFile) ? fs.readFileSync(scoredFile, "utf8").trim() === final.trim() : "file absent") : null;
		writeJSON(path.join(dir, "cell.json"), { ...c, fixture: fx.dir, init: fx.init, exit: res.code, signal: res.signal, model: FAMILIES[c.fam].model, errorEvent: evs.some((e) => e.type === "error" || e.type === "turn.failed"), seconds: Math.round((Date.now() - t0) / 1000), outsidePaths: outsidePaths(evs, fx.dir), scoredMatch, priorInvalid: prior, stderrTail: res.err });
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
		for (const t of meta.traps) for (const r of meta.arms) for (const f of Object.keys(meta.families)) for (let i = 1; i <= meta.runs; i++) {
			const d = path.join(run, "cells", `${t}.${r}.${f}.${i}`);
			if (!fs.existsSync(path.join(d, "cell.json")) || validity(d).length) cells.push({ trap: t, arm: r, fam: f, i });
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
	const families = list(a.families, Object.keys(FAMILIES));
	for (const f of families) if (!FAMILIES[f]) die(`unknown family ${f}`);
	for (const t of traps) if (!suite.traps.find((x) => x.id === t)) die(`unknown trap ${t}`);
	for (const r of arms) if (!ARMS.includes(r)) die(`unknown arm ${r}`);
	// Guided agents fetch entries from main, so the corpus they are given must be main as it is now.
	git(root, "fetch", "-q", "origin", "main");
	const rev = git(root, "rev-parse", "origin/main");
	fs.mkdirSync(run, { recursive: true });
	fs.copyFileSync(SUITE, path.join(run, "suite.json"));
	const meta = { calibration: dirty, suiteHash: hex(fs.readFileSync(SUITE), 12), suiteCommit: dirty ? null : git(root, "log", "-1", "--format=%H", "--", SUITE), rev, families: Object.fromEntries(families.map((f) => [f, FAMILIES[f]])), traps, arms, runs: Number(a.runs || suite.design.runsPerArm), mainBefore: rev, started: new Date().toISOString() };
	writeJSON(path.join(run, "run.json"), meta);
	const armDirs = Object.fromEntries(arms.map((r) => [r, buildArm(run, r, rev)]));
	meta.armDirs = armDirs;
	writeJSON(path.join(run, "run.json"), meta);

	const iso = [];
	const pairs = arms.flatMap((r) => families.map((f) => [r, f]));
	await pool(pairs, Number(a.parallel || 4), async ([r, f]) => { iso.push(await isolationCheck(run, r, f, armDirs[r])); });
	writeJSON(path.join(run, "isolation.json"), iso);
	for (const c of iso) say(`isolation ${c.arm} ${c.fam}: ${c.ok ? "ok" : "FAILED"} ${JSON.stringify(c.got)}`);
	if (iso.some((c) => !c.ok)) die("isolation check failed; inspect isolation.json", 1);

	const cells = [];
	for (const t of traps) for (const r of arms) for (const f of families) for (let i = 1; i <= meta.runs; i++) cells.push({ trap: t, arm: r, fam: f, i });
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
	const fams = Object.keys(meta.families);
	if (fams.length < 3) die("cross-family scoring needs three families in the run");
	const seed = a.seed || hex(run + meta.started, 8);
	const rand = rng(seed);
	const map = {};
	const prompts = [];
	const invalid = [];
	fs.rmSync(path.join(run, "scorer"), { recursive: true, force: true });
	fs.mkdirSync(path.join(run, "scorer"), { recursive: true });
	const block = (c) => {
		const cell = readJSON(path.join(run, "cells", c, "cell.json"));
		const clean = (x) => x.split(cell.fixture + "/").join("").split(cell.fixture).join(".").replace(CORPUS_ID, "[ID]");
		const final = clean(fs.readFileSync(path.join(run, "cells", c, "final.txt"), "utf8").trim());
		// AGENTS.md is in the initial commit for guided arms, so it is absent from the diff unless the
		// agent edited it; an edit to it would reveal the arm, so it is dropped.
		const diff = clean(fs.readFileSync(path.join(run, "cells", c, "diff.patch"), "utf8").split(/^(?=diff --git )/m).filter((h) => !h.startsWith("diff --git a/AGENTS.md ")).join("").trim());
		return `--- FINAL MESSAGE ---\n${final}\n--- DIFF ---\n${diff || "(no changes)"}\n`;
	};
	for (const tid of meta.traps) {
		const trap = suite.traps.find((x) => x.id === tid);
		const cells = fs.readdirSync(path.join(run, "cells")).filter((c) => c.startsWith(`${tid}.`)).filter((c) => {
			const why = validity(path.join(run, "cells", c));
			if (why.length) invalid.push(c);
			return !why.length;
		});
		// Each scorer family sees only the outcomes of the other two families, in its own order.
		for (const sf of fams) {
			const order = shuffle(cells.filter((c) => c.split(".")[2] !== sf), rand);
			for (let k = 0; k * CHUNK < order.length; k++) {
				const chunk = order.slice(k * CHUNK, (k + 1) * CHUNK);
				const name = `${tid}.${sf}.${k + 1}`;
				const blocks = chunk.map((c, n) => { map[`${name}/o${n + 1}`] = c; return `=== OUTCOME o${n + 1} ===\n${block(c)}`; });
				const ids = chunk.map((_, n) => `o${n + 1}`).join(", ");
				const prompt = [
					suite.scorerInstructions,
					"",
					`THE TASK EACH AGENT WAS GIVEN:\n${trap.task}`,
					trap.start ? `\nSTARTING STATE: ${trap.start}` : "",
					trap.scored ? `\nWHAT TO SCORE: ${trap.scored}` : "",
					`\nKEY PROPERTIES:\n${trap.key.map((x) => `${x.id}: ${x.property}`).join("\n")}`,
					`\nReply with only a JSON object, no other text, of this shape, covering every outcome (${ids}) and every property:`,
					`{"outcomes":[{"id":"o1","scores":{"${trap.key[0].id}":{"v":1,"reason":"..."}},"guess":"guided"}]}`,
					"",
					...blocks,
				].join("\n");
				fs.writeFileSync(path.join(run, "scorer", `${name}.txt`), prompt);
				prompts.push({ name, trap: tid, family: sf });
			}
		}
	}
	fs.mkdirSync(path.join(run, "sealed"), { recursive: true });
	writeJSON(path.join(run, "sealed", "manifest.json"), { seed, prompts, map, invalid: [...new Set(invalid)] });
	say(`blinded ${prompts.length} scorer prompt(s), seed ${seed}${invalid.length ? `; INVALID cells excluded: ${[...new Set(invalid)].join(", ")}` : ""}`);
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
	const scorerArm = buildArm(path.join(run, "scorer"), "control", meta.rev, { noTools: true });
	fs.mkdirSync(path.join(run, "scores"), { recursive: true });
	await pool(man.prompts, Number(a.parallel || 4), async ({ name, family }) => {
		const out = path.join(run, "scores", `${name}.json`);
		const prompt = fs.readFileSync(path.join(run, "scorer", `${name}.txt`), "utf8");
		if (fs.existsSync(out) && readJSON(out).promptHash === hex(prompt, 12)) return;
		const ev = path.join(run, "scores", `${name}.jsonl`);
		const model = meta.families[family].model;
		for (let attempt = 1; attempt <= 3; attempt++) {
			const cwd = workspace();
			await agent({ armDir: scorerArm, cwd, prompt, model, eventsFile: ev, readOnly: true });
			const parsed = parseScores(finalTextOf(ev));
			if (parsed?.outcomes) { writeJSON(out, { ...parsed, promptHash: hex(prompt, 12), model, outsidePaths: outsidePaths(events(ev), cwd) }); return; }
			say(`scorer ${name}: unparseable, attempt ${attempt}`);
		}
	});
	tally(run, suite, meta, man);
}

// Each outcome has two votes per property, from the two families that did not produce it. A
// property's value for an outcome is their mean - 0, 0.5 or 1 - so a split is shown, not hidden.
function tally(run, suite, meta, man) {
	const fams = Object.keys(meta.families);
	const res = { run: path.basename(run), calibration: meta.calibration, rev: meta.rev, families: meta.families, invalid: man.invalid, traps: {} };
	const lines = [`# Adherence result - ${path.basename(run)}`, "",
		`${meta.calibration ? "CALIBRATION, not a result. " : ""}Corpus ${meta.rev.slice(0, 7)}, suite ${meta.suiteHash}, ${meta.runs} run(s) per arm and family. Agents: ${fams.map((f) => `${f} = ${meta.families[f].model}`).join(", ")}.`,
		"Each outcome is scored by the two families other than its agent's; a cell is the mean pass rate over outcomes, where an outcome's value is the mean of its two votes. An outcome missing a vote is INCOMPLETE and left out.", ""];
	if (man.invalid.length) lines.push(`INVALID cells, not scored: ${man.invalid.join(", ")}.`, "");
	const sheets = {};
	for (const p of man.prompts) {
		const f = path.join(run, "scores", `${p.name}.json`);
		if (fs.existsSync(f) && readJSON(f).promptHash === hex(fs.readFileSync(path.join(run, "scorer", `${p.name}.txt`), "utf8"), 12)) sheets[p.name] = readJSON(f);
	}
	const wanderers = Object.entries(sheets).filter(([, sh]) => sh.outsidePaths?.length).map(([n]) => n);
	for (const tid of meta.traps) {
		const trap = suite.traps.find((x) => x.id === tid);
		const votes = {};
		const guesses = { right: 0, all: 0, guided: 0 };
		for (const [k, cell] of Object.entries(man.map)) {
			const [name, oid] = k.split("/");
			if (!name.startsWith(`${tid}.`)) continue;
			votes[cell] ??= {};
			const o = sheets[name]?.outcomes?.find((x) => x.id === oid);
			for (const key of trap.key) {
				const v = o?.scores?.[key.id]?.v;
				(votes[cell][key.id] ??= []).push(v === 0 || v === 1 ? v : null);
			}
			if (o?.guess === "guided" || o?.guess === "unguided") {
				guesses.all++;
				if (o.guess === "guided") guesses.guided++;
				if ((o.guess === "guided") === (cell.split(".")[1] !== "control")) guesses.right++;
			}
		}
		const cells = {};
		const agreement = {};
		for (const [cell, kv] of Object.entries(votes)) {
			const [, arm, fam] = cell.split(".");
			cells[cell] = { arm, fam, scores: {} };
			for (const key of trap.key) {
				const vs = kv[key.id] ?? [];
				const complete = vs.length === 2 && vs.every((v) => v !== null);
				cells[cell].scores[key.id] = complete ? (vs[0] + vs[1]) / 2 : "INCOMPLETE";
				agreement[key.id] ??= { agree: 0, of: 0 };
				if (complete) { agreement[key.id].of++; if (vs[0] === vs[1]) agreement[key.id].agree++; }
			}
		}
		const rate = (filter, kid) => {
			const vs = Object.values(cells).filter(filter).map((c) => c.scores[kid]);
			const ok = vs.filter((v) => typeof v === "number");
			return { mean: ok.length ? ok.reduce((x, y) => x + y, 0) / ok.length : null, of: ok.length, incomplete: vs.length - ok.length };
		};
		const props = trap.key.map((key) => {
			const byArm = Object.fromEntries(meta.arms.map((arm) => [arm, rate((c) => c.arm === arm, key.id)]));
			const byArmFam = Object.fromEntries(meta.arms.map((arm) => [arm, Object.fromEntries(fams.map((f) => [f, rate((c) => c.arm === arm && c.fam === f, key.id)]))]));
			const means = Object.values(byArm).filter((r) => r.of).map((r) => r.mean);
			return { id: key.id, guidance: key.guidance, inAgents: key.inAgents, byArm, byArmFam, discriminating: new Set(means).size > 1, allFail: means.length > 0 && means.every((m) => m === 0), agreement: agreement[key.id] };
		});
		const nCells = Object.keys(cells).length;
		const guidedShare = Object.values(cells).filter((c) => c.arm !== "control").length / Math.max(1, nCells);
		res.traps[tid] = { cells, properties: props, guess: { ...guesses, guidedShare } };
		const fmt = (r) => (r.of ? `${r.mean.toFixed(2)} (${r.of})` : "-") + (r.incomplete ? ` +${r.incomplete} inc` : "");
		lines.push(`## ${tid}`, "", "All families:", "", `| property | ${meta.arms.join(" | ")} | discriminates | cross-family votes agree |`, `|---|${meta.arms.map(() => "---").join("|")}|---|---|`);
		for (const p of props) lines.push(`| ${p.id} | ${meta.arms.map((arm) => fmt(p.byArm[arm])).join(" | ")} | ${p.discriminating ? "yes" : p.allFail ? "no - all fail, check the key" : "no"} | ${p.agreement ? `${p.agreement.agree}/${p.agreement.of}` : "-"} |`);
		lines.push("", "By agent family (arm: " + fams.join(" / ") + "):", "", `| property | ${meta.arms.join(" | ")} |`, `|---|${meta.arms.map(() => "---").join("|")}|`);
		for (const p of props) lines.push(`| ${p.id} | ${meta.arms.map((arm) => fams.map((f) => { const r = p.byArmFam[arm][f]; return r.of ? r.mean.toFixed(2) : "-"; }).join(" / ")).join(" | ")} |`);
		lines.push("", `Scorers guessed guided-or-not correctly ${guesses.all ? `${guesses.right}/${guesses.all}` : "-"}, guessing guided ${guesses.guided} times; ${Math.round(guidedShare * 100)}% of outcomes were guided.`, "");
	}
	lines.push(`Score sheets used: ${Object.keys(sheets).length} of ${man.prompts.length}.${wanderers.length ? ` Scorers that touched paths outside their workspace: ${wanderers.join(", ")}.` : ""}`, "");
	const reruns = {};
	for (const c of fs.readdirSync(path.join(run, "cells"))) {
		const n = (readJSON(path.join(run, "cells", c, "cell.json")).priorInvalid ?? []).length;
		if (n) { const k = c.split(".").slice(1, 3).join("."); reruns[k] = (reruns[k] ?? 0) + n; }
	}
	if (Object.keys(reruns).length) lines.push(`INVALID attempts re-run, by arm.family: ${Object.entries(reruns).map(([k, v]) => `${k} ${v}`).join(", ")}.`, "");
	const outside = fs.readdirSync(path.join(run, "cells")).filter((c) => (readJSON(path.join(run, "cells", c, "cell.json")).outsidePaths ?? []).length);
	if (outside.length) lines.push(`Agents that touched paths outside their fixture: ${outside.join(", ")}.`, "");
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
	const want = meta.traps.length * meta.arms.length * Object.keys(meta.families).length * meta.runs;
	const scores = fs.existsSync(path.join(run, "scores")) ? fs.readdirSync(path.join(run, "scores")).filter((f) => f.endsWith(".json")) : [];
	say(`cells ${cells.length - invalid.length}/${want} valid; INVALID ${invalid.length}${invalid.length ? " (" + invalid.join(", ") + ")" : ""}; score sheets ${scores.length}; void ${meta.void ?? "unfinished"}`);
	process.exit(cells.length - invalid.length === want ? 0 : 1);
}

const a = args(process.argv.slice(2));
const cmd = { run: cmdRun, blind: cmdBlind, score: cmdScore, status: cmdStatus }[a._[0]];
if (!cmd) die("usage: node tools/adherence.mjs run|blind|score|status [options]");
await cmd(a);
