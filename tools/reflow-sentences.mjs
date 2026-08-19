#!/usr/bin/env node
// reflow-sentences - rewrite markdown prose to one sentence per line, per S6.
//
// S6 asks for two things that are easy to state and tedious to do by hand:
//   - no mid-sentence hard wrap; a sentence occupies one line however long it is;
//   - adjacent sentences inside a paragraph carry a trailing backslash, so they render
//     on their own lines instead of collapsing into a block.
//
// Only prose paragraphs are touched. Frontmatter, fenced blocks, tables, headings, list
// items, blockquotes and horizontal rules are copied through unchanged - list items are
// left alone deliberately, because S6's own entry writes multi-sentence bullets and
// presents them as correct.
//
// Sentence splitting is conservative: it will not split after a known abbreviation, an
// initial, or an ellipsis, because a wrong split is worse than a missed one.
//
// Usage:  node tools/reflow-sentences.mjs FILE...        (rewrites in place)
//         node tools/reflow-sentences.mjs --dry FILE...  (prints what would change)

import { readFileSync, writeFileSync } from 'node:fs';

// The leading boundary is load-bearing: without it "St." matches the tail of "rest.",
// "al." the tail of "final.", and the splitter silently declines to split real sentences.
const ABBREV = /(?:^|[\s("'[])(?:e\.g|i\.e|etc|vs|cf|approx|Dr|Mr|Ms|St|No|Fig|Eq|Sec|al)\.$/i;

// Split a joined paragraph into sentences without breaking on abbreviations or initials.
function splitSentences(text) {
	const parts = [];
	let start = 0;
	for (let i = 0; i < text.length; i++) {
		if (!'.!?'.includes(text[i])) continue;
		// an ellipsis is not a sentence end
		if (text.slice(i, i + 3) === '...') { i += 2; continue; }
		if (text[i - 1] === '.' || text[i + 1] === '.') continue;
		// must be followed by whitespace then something that can open a sentence
		const rest = text.slice(i + 1);
		const m = rest.match(/^\s+(?=[A-Z`\[(*_"'])/);
		if (!m) continue;
		const head = text.slice(start, i + 1);
		if (ABBREV.test(head)) continue;
		if (/(?:^|\s)[A-Z]\.$/.test(head)) continue; // an initial, e.g. "J."
		parts.push(head.trim());
		start = i + 1 + m[0].length;
	}
	const tail = text.slice(start).trim();
	if (tail) parts.push(tail);
	return parts.filter(Boolean);
}

function isStructural(line) {
	return (
		line.trim() === '' ||
		/^\s*(#{1,6})\s/.test(line) ||       // heading
		/^\s*\|/.test(line) ||                // table
		/^\s*>/.test(line) ||                 // blockquote
		/^\s*[-*+]\s/.test(line) ||           // bullet
		/^\s*\d+\.\s/.test(line) ||           // ordered item
		/^\s{2,}\S/.test(line) ||             // indented continuation (list body)
		/^---$/.test(line) ||                 // horizontal rule
		/^<!--/.test(line) ||                 // html comment / marker
		/^\s*`{3,}/.test(line)                // fence
	);
}

function reflow(src) {
	const lines = src.split('\n');
	const out = [];
	let i = 0;

	// copy YAML frontmatter verbatim
	if (lines[0] === '---') {
		out.push(lines[i++]);
		while (i < lines.length && lines[i] !== '---') out.push(lines[i++]);
		if (i < lines.length) out.push(lines[i++]);
	}

	let fence = null;
	while (i < lines.length) {
		const line = lines[i];
		const fenceMatch = line.match(/^\s*(`{3,})/);
		if (fenceMatch) {
			if (fence === null) fence = fenceMatch[1].length;
			else if (fenceMatch[1].length >= fence) fence = null;
			out.push(line);
			i++;
			continue;
		}
		if (fence !== null || isStructural(line)) { out.push(line); i++; continue; }

		// gather one prose paragraph
		const buf = [];
		while (i < lines.length && !isStructural(lines[i]) && !/^\s*`{3,}/.test(lines[i])) {
			buf.push(lines[i].replace(/\\$/, '').trim());
			i++;
		}
		const sentences = splitSentences(buf.join(' '));
		sentences.forEach((s, n) => out.push(n < sentences.length - 1 ? `${s}\\` : s));
	}
	return out.join('\n');
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
if (!files.length) { console.error('usage: reflow-sentences.mjs [--dry] FILE...'); process.exit(2); }

let changed = 0;
for (const f of files) {
	const before = readFileSync(f, 'utf8');
	const after = reflow(before);
	if (before === after) continue;
	changed++;
	if (dry) console.log(`would rewrite  ${f}`);
	else writeFileSync(f, after);
}
console.log(`${dry ? 'would rewrite' : 'rewrote'} ${changed} file(s).`);
