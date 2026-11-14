#!/usr/bin/env node
// check-traits - hold the applies-to vocabulary to the declared traits and floor exclusivity.
//
// Sovereign duty: parity between traits/ and the catalogue-entry applies-to enum plus T0 floor
// exclusivity, and no other. The applies-to vocabulary and the traits layer name the same things,
// and the floor is never combined with a trait.
//
// An axiom's applies-to field is constrained to an enum in the catalogue contract, so a
// misspelled or undefined tag is refused rather than silently binding nothing. The enum is a
// second list of the traits declared in traits/, and two lists of one thing drift: add a trait
// and forget the enum, and every axiom tagged with it is refused; remove one and the enum keeps
// admitting a tag nothing defines.
//
// This check makes the two one fact. The enum must equal the declared traits plus the floor,
// any-system, which is a valid value and deliberately not a trait. And under T0's floor rule,
// any-system is never combined with a trait in an entry's applies-to list, because an axiom
// binding every system already binds every system that has a trait (B118).
//
// Usage:  node tools/check-traits.mjs [--root DIR]

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--root") {
		if (!args[i + 1] || args[i + 1].startsWith("-")) {
			console.error("missing argument for --root");
			process.exit(2);
		}
		root = resolve(args[++i]);
	} else {
		console.error(`unknown argument: ${args[i]}`);
		process.exit(2);
	}
}
if (!existsSync(root) || !statSync(root).isDirectory()) {
	console.error(`--root is not an existing directory: ${root}`);
	process.exit(2);
}

const FLOOR = "any-system";

function parseAppliesTo(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	let inList = false;
	let sawAppliesTo = false;
	let inFlow = false;
	let flowBuf = "";
	const items = [];
	for (const raw of m[1].split("\n")) {
		const line = raw.replace(/\s+#.*$/, "");
		if (!line.trim()) continue;
		if (inFlow) {
			flowBuf += ` ${line.trim()}`;
			if (flowBuf.includes("]")) {
				return flowBuf
					.replace(/^\[|\]$/g, "")
					.split(",")
					.map((s) => s.trim().replace(/^["']|["']$/g, ""))
					.filter(Boolean);
			}
			continue;
		}
		const block = line.match(/^\s*-\s+(.*)$/);
		if (block && inList) {
			items.push(block[1].trim().replace(/^["']|["']$/g, ""));
			continue;
		}
		const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		if (kv[1] !== "applies-to") {
			inList = false;
			continue;
		}
		sawAppliesTo = true;
		const val = kv[2].trim();
		if (val === "") {
			inList = true;
			continue;
		}
		inList = false;
		if (val.startsWith("[")) {
			if (!val.includes("]")) {
				inFlow = true;
				flowBuf = val;
				continue;
			}
			return val
				.replace(/^\[|\]$/g, "")
				.split(",")
				.map((s) => s.trim().replace(/^["']|["']$/g, ""))
				.filter(Boolean);
		}
		return [val.replace(/^["']|["']$/g, "")];
	}
	return sawAppliesTo ? items : null;
}

const schemaPath = join(root, "schemas/catalog-entry/v1alpha1/catalog-entry.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const enumValues = new Set(schema.properties["applies-to"]?.items?.enum ?? []);

// A trait's tag is the slug after its id in the filename, which is also the title's leading word.
const traitsDir = join(root, "traits");
const declared = new Set(
	(existsSync(traitsDir) ? readdirSync(traitsDir) : [])
		.filter((f) => /^T[1-9]\d*-.+\.md$/.test(f))
		.map((f) => f.replace(/^T\d+-/, "").replace(/\.md$/, "")),
);

const failures = [];
if (declared.size === 0) failures.push("FAIL  no traits found in traits/");
for (const t of declared) if (!enumValues.has(t)) failures.push(`FAIL  trait ${t} is declared in traits/ and absent from the applies-to enum`);
for (const v of enumValues) if (v !== FLOOR && !declared.has(v)) failures.push(`FAIL  applies-to admits ${v}, which no trait in traits/ defines`);
if (!enumValues.has(FLOOR)) failures.push(`FAIL  applies-to no longer admits the floor, ${FLOOR}`);

const axiomsDir = join(root, "axioms");
const axiomFiles = existsSync(axiomsDir)
	? readdirSync(axiomsDir).filter((f) => /^A[1-9]\d*-.+\.md$/.test(f)).sort()
	: [];
if (axiomFiles.length === 0) failures.push("FAIL  no axioms found in axioms/");
for (const f of axiomFiles) {
	const rel = `axioms/${f}`;
	const tags = parseAppliesTo(readFileSync(join(axiomsDir, f), "utf8"));
	if (!tags || tags.length === 0) {
		failures.push(`FAIL  ${rel} declares no applies-to tags`);
		continue;
	}
	for (const t of tags) {
		if (!enumValues.has(t)) failures.push(`FAIL  ${rel} names unknown applies-to tag ${t}`);
	}
	if (tags.includes(FLOOR) && tags.length > 1) {
		const extras = tags.filter((t) => t !== FLOOR).join(", ");
		failures.push(`FAIL  ${rel} combines the floor (${FLOOR}) with trait tag(s): ${extras} (T0)`);
	}
}

if (failures.length) {
	for (const f of failures) console.log(f);
	console.log(`\n${failures.length} failure(s): the applies-to vocabulary and the traits layer disagree.`);
	process.exit(1);
}
console.log(`clean: ${declared.size} trait(s) and the floor match the applies-to vocabulary across ${axiomFiles.length} axiom(s).`);
