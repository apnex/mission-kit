---
id: S13
category: style
title: Plain ASCII in markdown - typeable characters only
status: active
hydrate-when: You are about to type a character you could not produce on a standard keyboard
supersedes: []
related: [S6, S8, S11]
---

# S13 - Plain ASCII in markdown

<!-- style-check: allow S13 (character is the subject; this entry inventories the glyphs it bans) -->

## Rule

Two questions, in order.

**1.\
Can you type it on a standard keyboard, without a compose sequence or a numeric code?**

If yes, it is fine.\
Concretely that is printable ASCII, `0x20` to `0x7E`, plus tab and newline.\
A hyphen is a key, so it passes.\
An em dash needs `Alt+0151` or a compose key, so it does not.

**2.\
If not, can well-known ASCII express the same thing, alone or in composition?**

If yes, write that instead.\
An arrow is `->`.\
An equivalence is `<=>`.\
An ellipsis is `...`.\
Greater-or-equal is `>=`.

Composition is the point, not a workaround.\
Two or three plain characters standing in for one exotic glyph is how ASCII has always expressed these, it is what the surrounding code already does, and it stays typeable and greppable everywhere.

A character survives both questions only when nothing in ASCII expresses its job adequately.\
That is the exception bar, and it is deliberately high.

The test needs no per-character ruling and decides characters nobody has met yet.

### Exceptions

Exceptions are earned one at a time, each against question 2 above: the character does a real job with many uses, and no ASCII composition expresses that job adequately.

**1.\
Box drawing** - the Unicode Box Drawing block, `U+2500` to `U+257F`.\
A coherent visual system with many uses: section dividers in code comments, tree diagrams, table frames, and boxed callouts.\
ASCII can compose an approximation out of `+`, `-` and `|`, and that approximation is strictly worse at every one of those jobs - corners that do not join, lines that do not align, frames that break under proportional rendering.\
This is the case question 2 exists to admit.

No others have been granted.\
Add the next as `2.` with its justification, rather than widening the test.

### Also not covered

Three cases are outside the rule rather than exceptions to it:

- **The character is the subject.** The conversion table below, a rule that inventories emoji to strip, a test fixture, a doc about Unicode handling. Quoting a character is not using it. [[K1]] must name the glyphs it removes.
- **It belongs to a proper noun.** A person's name, a place, a product spelled that way.
- **The content is reproduced verbatim.** A third-party error message, an upstream file quoted as-is, a captured transcript. Altering it would misquote it.

Code blocks are not automatically exempt.\
A transcript that genuinely emitted a glyph is verbatim content and stays; a glyph you typed into an example is a choice, and the rule applies.

---

## Conversions

Not a definition of what is banned - the test above is that.\
This is what to write instead, for the characters that actually turn up.

| Char | Name | Use instead |
|---|---|---|
| `→` | Rightwards Arrow | `->` |
| `←` | Leftwards Arrow | `<-` |
| `↔` | Left Right Arrow | `<->` |
| `⇒` | Rightwards Double Arrow | `=>` |
| `⟺` | Long Left Right Double Arrow | `<=>` |
| `⟶` | Long Rightwards Arrow | `-->` |
| `⟳` | Clockwise Gapped Circle Arrow | a word: `retry`, `loop` |
| `×` | Multiplication Sign | `x` |
| `≥` | Greater-Than Or Equal To | `>=` |
| `≤` | Less-Than Or Equal To | `<=` |
| `≠` | Not Equal To | `!=` |
| `≈` | Almost Equal To | `~=` |
| `−` | Minus Sign | `-` (hyphen-minus) |
| `—` | Em Dash | ` - ` spaced, or `--` when joining |
| `–` | En Dash | `-` |
| `…` | Horizontal Ellipsis | `...` |
| `·` | Middle Dot | `-` or `*` |
| `§` | Section Sign | the word `section` |
| `⚠` | Warning Sign | the word `WARNING` |
| `✓` | Check Mark | `[x]`, or `pass` |
| `✗` | Ballot X | `[ ]`, or `fail` |
| `✅` | White Heavy Check Mark | `[x]`, or `pass` |
| `🔴` | Large Red Circle | a word: `blocked`, `failed` |
| `▶` | Black Right-Pointing Triangle | `>` |
| `◉` | Fisheye | `*` |
| `🤖` | Robot Face | delete it, or write what it meant |

All emoji are banned, whether or not they appear above.

---

## Checking

This file is the one place in the corpus where the banned characters may appear, because here they are the subject.

Scan a tree, box drawing excluded:
```bash
grep -rnP '[\x{80}-\x{24FF}\x{2580}-\x{10FFFF}]' --include="*.md" .
```

---

## Rationale

**You cannot search for what you cannot type.** This is the argument that subsumes the rest.\
A reader who wants to find a phrase containing an em dash has to copy it from the rendered page, because they cannot produce the character at a prompt.\
Every non-typeable character imposes a copy-paste dependency on every future reader, in every grep, every diff filter, every bug report that quotes the line.

**Typographic characters are invisible failures.** An em dash and a hyphen look nearly identical in most monospace fonts, so a reader cannot tell which is in the file.\
They are not interchangeable to a grep, a diff, or a script.\
Searching for a phrase you can see and getting no match is a real cost, paid repeatedly.

**They do not survive the pipeline.** Terminals, editors with the wrong locale, `cat` over a serial console, log aggregators, and CI output all degrade non-ASCII differently.\
The failure mode is silent replacement or mojibake, and it surfaces where you least want a surprise.

**Nothing is gained.** An arrow glyph and `->` carry identical meaning, and `->` is what the surrounding code already uses.\
The typographic version buys polish in one rendering context and costs legibility in every other.

**A test beats a list.** An enumerated ban has to be extended every time someone pastes in a new glyph, and it invites argument at the borderline.\
Keyboard-typeability is decidable on sight, by anyone, for any character, without consulting this file.

---

## Examples

**Bad:**

> A mapping written with an arrow glyph, a status column using a check-mark glyph, and a parenthetical set off with an em dash. Three characters no one can type, in a file where `->`, `[x]`, and ` - ` were all one keystroke away.

**Good:**

> The same content using `->`, `[x]`, and ` - `. Every phrase is typeable, greppable, and renders identically in a terminal, a diff, and a browser.

---

## When to apply

- Writing or editing any markdown.
- Reviewing a doc change - run the grep above; it is a one-line check.
- Converting a doc that predates this rule, opportunistically, while editing it for another reason. Do not sweep a whole corpus in one commit - per [[S6]] the diff becomes unreviewable.
