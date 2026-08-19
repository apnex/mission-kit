#!/usr/bin/env node
// s6-one-sentence-per-line - enforce S6: each sentence on its own line, breaks made visible.
//
// Sovereign duty: this rule and no other, and it owns BOTH halves of it. The check and the fix
// share one definition of a sentence boundary, which is the point: that definition previously
// existed four times in three languages and the copies disagreed twice in one day. A line
// containing "e.g." was reportable by the checker and unfixable by the converter, which makes a
// gate unsatisfiable rather than merely noisy.
//
// A file passes S6 exactly when this tool has nothing to change. That is the definition of
// compliance, not an approximation of it.
//
//   --check   report the lines a fix would rewrite, and exit non-zero if any
//   --fix     rewrite them
//
// Prose only. Frontmatter, fenced blocks, tables, headings, list items and blockquotes are
// copied through untouched, because S6 names "a list wearing prose - a real markdown list" as
// the correct outcome. Inline code is masked before splitting, so a hard break is never written
// into a reader's command.
//
// Usage:  tools/s6-one-sentence-per-line.mjs [--check|--fix] FILE...
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
		// A terminator may be followed by closing delimiters before the space: a quote, a bold
		// marker, a bracket. Requiring the space immediately after the terminator missed
		// `truths." A sovereign backplane` and every `**...act.** A field` in the corpus.
		const rest = text.slice(i + 1);
		const m = rest.match(/^["'*`\)\]]*\s+(?=[A-Z`\[(*_"'\u0001])/);
		if (!m) continue;
		const closers = (m[0].match(/^["'*`\)\]]*/) || [''])[0];
		const head = text.slice(start, i + 1 + closers.length);
		if (ABBREV.test(head)) continue;
		if (/(?:^|\s)[A-Z]\.$/.test(head)) continue; // an initial, e.g. "J."
		parts.push(head.trim());
		start = i + 1 + m[0].length;
	}
	const tail = text.slice(start).trim();
	if (tail) parts.push(tail);
	return parts.filter(Boolean);
}


// Inline code is not prose. A sentence break inside a code span would put a hard-break marker
// into the reader's command, and a span may legitimately contain ". " without ending a sentence.
// Mask spans to opaque tokens carrying no sentence-ending punctuation, then restore them.
function maskInlineCode(text) {
	const spans = [];
	const masked = text.replace(/(`+)([^`]|[^`][\s\S]*?)\1/g, (m) => {
		spans.push(m);
		return `\u0001${spans.length - 1}\u0001`;
	});
	return { masked, spans };
}
function restoreInlineCode(text, spans) {
	return text.replace(/\u0001(\d+)\u0001/g, (_, i) => spans[Number(i)]);
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
		const { masked, spans } = maskInlineCode(buf.join(' '));
		const sentences = splitSentences(masked).map((s) => restoreInlineCode(s, spans));
		sentences.forEach((s, n) => out.push(n < sentences.length - 1 ? `${s}\\` : s));
	}
	return out.join('\n');
}

const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) { console.error('usage: s6-one-sentence-per-line.mjs [--check|--fix] FILE...'); process.exit(2); }

// The same exemption markers every style checker honours.
function exempt(text) {
	if (/style-check: allow S6/.test(text)) return true;
	return text.split('\n').slice(0, 12).some((l) => l.includes('GENERATED FILE'));
}

let failures = 0, rewritten = 0;
for (const f of files) {
	const before = readFileSync(f, 'utf8');
	if (exempt(before)) continue;
	const after = reflow(before);
	if (before === after) continue;
	if (check) {
		// Report the first line at which the two diverge, which is where the fix would start.
		const a = before.split('\n'), b = after.split('\n');
		let i = 0;
		while (i < a.length && i < b.length && a[i] === b[i]) i++;
		console.log(`FAIL  S6   ${f}:${i + 1}  sentence layout differs from S6; run --fix`);
		failures++;
	} else {
		writeFileSync(f, after);
		rewritten++;
	}
}

console.log();
if (check) {
	if (failures) { console.log(`${failures} S6 failure(s) across ${files.length} file(s).`); process.exit(1); }
	console.log(`clean: ${files.length} file(s), rule S6.`);
} else {
	console.log(`s6: rewrote ${rewritten} of ${files.length} file(s).`);
}
