#!/usr/bin/env node
// check-links - hold live markdown files to resolving relative links and #fragment anchors on disk.
//
// Sovereign duty: every relative markdown link and #fragment heading anchor outside fenced code
// blocks, inline code spans, and frozen historical records (docs/audits/, docs/investigations/,
// docs/requests/, governed by RU2) resolves to an existing file or directory and heading/id anchor
// inside the repository. Explicit file paths passed on the command line are checked directly even
// when they sit under a frozen prefix.
//
// Why it exists: check-standing-context.sh --addresses-only holds external https:// addresses
// across tracked markdown files (B30), and 0134 fixed link rebasing in generate-architecture.mjs,
// while nothing checked internal relative links or #fragment anchors - leaving docs/README.md
// pointing at ../backlog/README.md after the backlog/ layer was retired into docs/BACKLOG.md and
// docs/requests/ (B14, B130, B137).
//
// Usage:  node tools/check-links.mjs [--root DIR] [file ...]

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliArgs = process.argv.slice(2);
let ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const explicitFiles = [];
for (let i = 0; i < cliArgs.length; i++) {
	if (cliArgs[i] === "--root") {
		if (!cliArgs[i + 1] || cliArgs[i + 1].startsWith("--")) {
			console.error("FAIL  usage          --root requires a directory path");
			process.exit(2);
		}
		ROOT = path.resolve(cliArgs[++i]);
	} else if (cliArgs[i].startsWith("--")) {
		console.error(`FAIL  usage          unknown flag: ${cliArgs[i]}`);
		process.exit(2);
	} else {
		explicitFiles.push(cliArgs[i]);
	}
}

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) {
	console.error(`FAIL  usage          --root directory does not exist: ${ROOT}`);
	process.exit(2);
}

const FROZEN_PREFIXES = ["docs/audits/", "docs/investigations/", "docs/requests/"];
const IGNORED_DIRS = new Set([".git", "node_modules"]);

function listMarkdownFiles(dir, relBase = "") {
	const out = [];
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
		if (ent.isDirectory()) {
			if (IGNORED_DIRS.has(ent.name) || rel === "docs/evals/runs") continue;
			out.push(...listMarkdownFiles(path.join(dir, ent.name), rel));
		} else if (ent.isFile() && ent.name.endsWith(".md")) {
			out.push(rel);
		}
	}
	return out.sort();
}

function discoverFiles() {
	if (existsSync(path.join(ROOT, ".git"))) {
		try {
			const out = execFileSync(
				"git",
				["-C", ROOT, "ls-files", "--cached", "--others", "--exclude-standard", "*.md"],
				{ encoding: "utf8" },
			);
			const tracked = [...new Set(out.split("\n").map((s) => s.trim()).filter(Boolean))]
				.filter((f) => !f.startsWith("docs/evals/runs/") && existsSync(path.join(ROOT, f)))
				.sort();
			if (tracked.length > 0) return tracked;
		} catch {
			// Fall back to directory walk when git is unavailable.
		}
	}
	return listMarkdownFiles(ROOT);
}

function maskCode(md) {
	const lines = md.split("\n");
	let fence = null;
	const unfenced = lines.map((line) => {
		const m = /^\s*(`{3,}|~{3,})/.exec(line);
		if (fence === null) {
			if (m) {
				fence = m[1][0].repeat(m[1].length);
				return "";
			}
			return line;
		}
		const closeRe = new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`);
		if (closeRe.test(line)) fence = null;
		return "";
	}).join("\n");
	return unfenced.replace(/(`+)(?!`)[^\n]*?\1(?!`)/g, (s) => "_".repeat(s.length));
}

function githubSlug(rawHeading) {
	const text = rawHeading
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/`+/g, "")
		.replace(/[*~]+/g, "")
		.trim()
		.toLowerCase();
	return text
		.replace(/[^\p{L}\p{M}\p{N}_\s-]/gu, "")
		.replace(/\s/g, "-");
}

const slugCache = new Map();
function collectSlugs(absPath) {
	if (slugCache.has(absPath)) return slugCache.get(absPath);
	const md = readFileSync(absPath, "utf8");
	let fence = null;
	const counts = new Map();
	const slugs = new Set();
	for (const line of md.split("\n")) {
		const fm = /^\s*(`{3,}|~{3,})/.exec(line);
		if (fence === null) {
			if (fm) {
				fence = fm[1][0].repeat(fm[1].length);
				continue;
			}
		} else {
			const closeRe = new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`);
			if (closeRe.test(line)) fence = null;
			continue;
		}
		const hm = /^\s{0,3}#{1,6}\s+(.+?)\s*#*$/.exec(line);
		if (hm) {
			const base = githubSlug(hm[1]);
			if (base) {
				const n = counts.get(base) || 0;
				counts.set(base, n + 1);
				slugs.add(n === 0 ? base : `${base}-${n}`);
			}
		}
		const idm = /\b(?:id|name)=["']([^"']+)["']/g;
		let im;
		while ((im = idm.exec(line)) !== null) slugs.add(im[1]);
	}
	slugCache.set(absPath, slugs);
	return slugs;
}

const liveFiles = explicitFiles.length > 0
	? explicitFiles.map((f) => path.relative(ROOT, path.resolve(ROOT, f)).split(path.sep).join("/"))
	: discoverFiles().filter((f) => !FROZEN_PREFIXES.some((p) => f.startsWith(p)));
const failures = [];
let checkedLinks = 0;

for (const relFile of liveFiles) {
	const absFile = path.join(ROOT, relFile);
	if (!existsSync(absFile)) {
		if (explicitFiles.length > 0) failures.push(`FAIL  missing file   ${relFile} does not exist`);
		continue;
	}
	const masked = maskCode(readFileSync(absFile, "utf8"));
	const lines = masked.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const re = /!?\[(?:[^\[\]]|\[[^\[\]]*\])*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
		let m;
		while ((m = re.exec(line)) !== null) {
			const href = m[1];
			if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href)) continue;
			const hashIdx = href.indexOf("#");
			const rawPath = (hashIdx > -1 ? href.slice(0, hashIdx) : href).split("?")[0];
			const rawFrag = hashIdx > -1 ? href.slice(hashIdx + 1) : "";
			if ((!rawPath && !rawFrag) || rawPath.includes("<") || rawPath.includes(">") || rawFrag.includes("<") || rawFrag.includes(">")) continue;
			checkedLinks++;
			const resolved = rawPath ? path.resolve(path.dirname(absFile), rawPath) : absFile;
			const relTarget = path.relative(ROOT, resolved);
			if (relTarget.startsWith("..") || !existsSync(resolved)) {
				failures.push(`FAIL  broken link    ${relFile}:${i + 1} -> ${href} (${relTarget} does not exist)`);
				continue;
			}
			if (rawFrag) {
				const anchorFile = statSync(resolved).isDirectory() ? path.join(resolved, "README.md") : resolved;
				if (!existsSync(anchorFile) || !anchorFile.endsWith(".md") || !collectSlugs(anchorFile).has(rawFrag)) {
					failures.push(`FAIL  broken anchor  ${relFile}:${i + 1} -> ${href} (#${rawFrag} not found in ${path.relative(ROOT, anchorFile)})`);
				}
			}
		}
	}
}

if (failures.length > 0) {
	for (const f of failures) console.log(f);
	console.log(`\n${failures.length} broken relative link(s).`);
	process.exit(1);
}

console.log(`links: ${liveFiles.length} live markdown file(s) and ${checkedLinks} relative link(s) resolve.`);
