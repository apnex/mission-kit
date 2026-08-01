import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { base64urlCanonical } from "../../source/executables/runtime/lib/canonical.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

const recordKinds = new Set([
  "meta",
  "coverage",
  "questions",
  "rejoin",
  "panel",
  "lane",
  "node",
  "annotation",
  "edge"
]);

function decodeCanonical(encoded) {
  const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  assert.equal(base64urlCanonical(value), encoded, "lifecycle record must use canonical base64url JSON");
  return value;
}

function parseLifecycleRecords(markdown) {
  const records = Object.fromEntries([...recordKinds].map((kind) => [kind, []]));
  for (const line of markdown.split("\n")) {
    const match = line.trim().match(/^<!-- @lifecycle-([a-z]+)\|([A-Za-z0-9_-]+) -->$/);
    if (!match) continue;
    assert.ok(recordKinds.has(match[1]), `unknown lifecycle record ${match[1]}`);
    records[match[1]].push(decodeCanonical(match[2]));
  }
  return records;
}

test("Director lifecycle is a strict macro compression rather than a second protocol FSM", async () => {
  const markdown = await readFile(`${surveyRoot}/references/director-flow.md`, "utf8");
  const protocol = JSON.parse(
    await readFile(`${surveyRoot}/source/protocol/survey.protocol.json`, "utf8")
  );
  const records = parseLifecycleRecords(markdown);
  assert.equal(records.coverage.length, 1, "one lifecycle coverage record");
  assert.deepEqual(records.panel, [
    { id: "lifecycle", label: "Primary Director lifecycle", order: 1 },
    { id: "continuity", label: "Continuity, abort, and fail-safe handling", order: 2 }
  ]);

  const canonicalStateCount = protocol.machines.reduce((count, machine) => count + machine.states.length, 0);
  const canonicalTransitionCount = protocol.machines.reduce(
    (count, machine) => count + machine.transitions.length + machine.families.length,
    0
  );
  const phase = protocol.machines.find((machine) => machine.id === "phase");
  const phaseTransitionIds = new Set(
    [...phase.transitions, ...phase.families].map((transition) => transition.id)
  );
  const nodeById = new Map(records.node.map((node) => [node.id, node]));
  const lifecycleEdges = records.edge.filter((edge) => edge.kind === "lifecycle");
  const primaryNodes = records.node.filter((node) => node.panel === "lifecycle");
  const primaryEdges = records.edge.filter((edge) => nodeById.get(edge.from)?.panel === "lifecycle");
  const primarySolidMacros = primaryEdges.filter((edge) => edge.kind === "lifecycle");
  const primaryOwnedTransitionIds = primarySolidMacros.flatMap((edge) => edge.transitionIds);
  const primaryPhaseTransitions = new Set(
    primaryOwnedTransitionIds
      .filter((transitionId) => phaseTransitionIds.has(transitionId))
  );
  assert.equal(canonicalStateCount, 39);
  assert.equal(canonicalTransitionCount, 63);
  assert.equal(records.coverage[0].length, canonicalTransitionCount);
  assert.equal(phase.states.length, 33);
  assert.equal(phaseTransitionIds.size, 49);
  assert.ok(primaryNodes.length < phase.states.length, "primary-panel nodes compress the phase state surface");
  assert.ok(primaryEdges.length < phaseTransitionIds.size, "all primary-panel links are fewer than phase transitions");
  assert.equal(primaryPhaseTransitions.size, 47, "primary macros cover every phase tuple except abort handling");
  assert.equal(primaryOwnedTransitionIds.length, 48, "primary solid macros own 47 phase tuples plus coupled RT12");
  assert.ok(
    primarySolidMacros.length < primaryOwnedTransitionIds.length * 2 / 3,
    "primary solid macros compress their canonical tuples by more than one third"
  );
  assert.ok(lifecycleEdges.length < canonicalTransitionCount, "lifecycle macros compress transition tuples");
  assert.ok(
    primarySolidMacros.some((edge) => edge.transitionIds.length >= 3),
    "at least one primary solid macro owns three or more canonical transitions"
  );
  assert.ok(
    primaryNodes.some((node) => (node.phaseIds?.length ?? 0) >= 3),
    "at least one primary milestone owns three or more phase states"
  );

  assert.doesNotMatch(markdown, /%% @flow-(?:node|edge|question)\|/);
  assert.doesNotMatch(markdown, /\bstateDiagram-v2\b/);
  assert.equal((markdown.match(/\bflowchart LR\b/g) ?? []).length, 2, "exactly two LR Mermaid panels");
  assert.equal(
    records.node.some((node) => /^(?:phase|runtime)_/i.test(node.id)),
    false,
    "visible nodes are lifecycle roles rather than generated machine-state aliases"
  );
  assert.equal(
    records.node.some((node) => [
      "phase-state",
      "runtime-state",
      "phase-selector",
      "runtime-selector",
      "machine-pseudostate"
    ].includes(node.kind)),
    false,
    "machine projection node kinds are absent"
  );

  const ownerByTransition = new Map();
  for (const edge of lifecycleEdges) {
    for (const transitionId of edge.transitionIds) ownerByTransition.set(transitionId, edge);
  }
  for (const transitionId of ["T42", "T43", "T44", "T45", "T46"]) {
    const owner = ownerByTransition.get(transitionId);
    assert.ok(owner, `${transitionId} remains traceable`);
    assert.ok(owner.transitionIds.length > 1, `${transitionId} is folded into a lifecycle milestone`);
    assert.notEqual(owner.from, owner.to, `${transitionId} is not rendered as an internal draft-save loop`);
  }

  const mermaidMatches = [...markdown.matchAll(/```mermaid\n([\s\S]*?)\n```/g)];
  assert.equal(mermaidMatches.length, 2, "primary lifecycle and continuity are independently rendered");
  const [primaryMermaid, continuityMermaid] = mermaidMatches.map((match) => match[1]);
  assert.equal(
    (primaryMermaid.match(/^\s*subgraph LIFECYCLE_/gm) ?? []).length,
    3,
    "primary panel has Director, Proposer, and Runtime lanes"
  );
  assert.equal(
    (continuityMermaid.match(/^\s*subgraph CONTINUITY_/gm) ?? []).length,
    2,
    "continuity panel has only its populated Director and Runtime lanes"
  );
  assert.doesNotMatch(primaryMermaid, /^\s*subgraph CONTINUITY_/m);
  assert.doesNotMatch(continuityMermaid, /^\s*subgraph LIFECYCLE_/m);
  const renderedEdges = mermaidMatches.flatMap((match) => (
    match[1].split("\n").filter((line) => /(?:-->|-\.->)/.test(line))
  ));
  assert.equal(renderedEdges.length, records.edge.length, "encoded edge count matches both panels' visible links");
  const protocolIds = protocol.machines.flatMap((machine) => (
    [...machine.transitions, ...machine.families].map((transition) => transition.id)
  ));
  const protocolIdPattern = new RegExp(`\\b(?:${protocolIds.join("|")})\\b`);
  for (const line of renderedEdges) {
    assert.doesNotMatch(line, protocolIdPattern, "visible arrows use human labels rather than protocol IDs");
  }

  const evidenceMatches = [...markdown.matchAll(
    /^<!-- @lifecycle-([a-z]+)\|([A-Za-z0-9_-]+) -->$/gm
  )];
  assert.ok(evidenceMatches.length > 0, "encoded lifecycle evidence is present");
  for (const match of evidenceMatches) {
    assert.ok(
      mermaidMatches.every((mermaid) => (
        match.index < mermaid.index || match.index >= mermaid.index + mermaid[0].length
      )),
      `${match[1]} evidence is outside every Mermaid fence`
    );
  }
  const finalMermaidEnd = mermaidMatches.at(-1).index + mermaidMatches.at(-1)[0].length;
  assert.ok(
    evidenceMatches.every((match) => match.index > finalMermaidEnd),
    "all encoded evidence follows both Mermaid panels"
  );
  for (const mermaid of mermaidMatches) assert.doesNotMatch(mermaid[1], /@lifecycle-/);
});
