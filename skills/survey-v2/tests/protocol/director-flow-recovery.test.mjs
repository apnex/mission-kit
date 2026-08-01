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

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

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

function escapeMermaid(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseMermaidPanels(markdown) {
  return [...markdown.matchAll(/^## ([^\n]+)\n\n```mermaid\n([\s\S]*?)\n```$/gm)].map((match) => ({
    heading: match[1],
    source: match[2]
  }));
}

function parseVisiblePanel(source) {
  const lanes = [];
  const nodes = [];
  const edges = [];
  let subgraphId;
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    const lane = line.match(/^subgraph ([A-Z][A-Z0-9_]*)\["([^"]*)"\]$/);
    if (lane) {
      subgraphId = lane[1];
      lanes.push({ subgraphId, label: lane[2] });
      continue;
    }
    if (line === "end") {
      subgraphId = undefined;
      continue;
    }
    const node = line.match(/^([A-Z][A-Z0-9_]*)(?:\["([^"]*)"\]|\(\["([^"]*)"\]\)|\{"([^"]*)"\})$/);
    if (node && subgraphId) {
      nodes.push({
        id: node[1],
        label: node[2] ?? node[3] ?? node[4],
        subgraphId
      });
      continue;
    }
    const edge = line.match(/^([A-Z][A-Z0-9_]*) (-->|-\.->)\|"([^"]*)"\| ([A-Z][A-Z0-9_]*)$/);
    if (edge) {
      edges.push({
        from: edge[1],
        arrow: edge[2],
        label: edge[3],
        to: edge[4]
      });
    }
  }
  return { lanes, nodes, edges };
}

test("Director lifecycle visibly preserves runtime recovery, exact rejoin, abort, and quarantine", async () => {
  const markdown = await readFile(`${surveyRoot}/references/director-flow.md`, "utf8");
  const protocol = JSON.parse(
    await readFile(`${surveyRoot}/source/protocol/survey.protocol.json`, "utf8")
  );
  const records = parseLifecycleRecords(markdown);
  assert.equal(records.meta.length, 1, "one lifecycle metadata record");
  assert.equal(records.coverage.length, 1, "one lifecycle coverage record");
  assert.equal(records.rejoin.length, 1, "one lifecycle rejoin record");
  assert.equal(records.meta[0].rejoinMapId, "RJM01");
  assert.deepEqual(records.panel, [
    { id: "lifecycle", label: "Primary Director lifecycle", order: 1 },
    { id: "continuity", label: "Continuity, abort, and fail-safe handling", order: 2 }
  ]);

  const nodeById = new Map(records.node.map((node) => [node.id, node]));
  const edgeById = new Map(records.edge.map((edge) => [edge.id, edge]));
  for (const edge of records.edge) {
    assert.equal(
      nodeById.get(edge.from)?.panel,
      nodeById.get(edge.to)?.panel,
      `${edge.id} stays within one visible panel`
    );
  }
  const mermaidPanels = parseMermaidPanels(markdown);
  assert.deepEqual(
    mermaidPanels.map((panel) => panel.heading),
    records.panel.map((panel) => panel.label),
    "visible panel headings exactly match encoded panel order"
  );
  const continuity = parseVisiblePanel(mermaidPanels[1].source);
  const continuityNodes = records.node.filter((node) => node.panel === "continuity");
  const continuityLaneIds = new Set(continuityNodes.map((node) => node.lane));
  assert.deepEqual(
    continuity.lanes,
    records.lane
      .filter((lane) => continuityLaneIds.has(lane.id))
      .map((lane) => ({
        subgraphId: `CONTINUITY_${lane.id.toUpperCase()}`,
        label: escapeMermaid(lane.label)
      })),
    "the continuity panel visibly preserves its populated Director and Runtime lanes"
  );
  assert.deepEqual(
    continuity.nodes
      .sort((left, right) => compareUtf8(left.id, right.id)),
    continuityNodes
      .map((node) => ({
        id: node.id,
        label: escapeMermaid(node.label),
        subgraphId: `CONTINUITY_${node.lane.toUpperCase()}`
      }))
      .sort((left, right) => compareUtf8(left.id, right.id)),
    "the continuity panel's visible node labels and lane membership match encoded nodes"
  );
  assert.deepEqual(
    continuity.edges
      .sort((left, right) => compareUtf8(
        `${left.from}\0${left.arrow}\0${left.label}\0${left.to}`,
        `${right.from}\0${right.arrow}\0${right.label}\0${right.to}`
      )),
    records.edge
      .filter((edge) => nodeById.get(edge.from)?.panel === "continuity")
      .map((edge) => ({
        from: edge.from,
        arrow: edge.kind === "lifecycle" ? "-->" : "-.->",
        label: escapeMermaid(edge.label),
        to: edge.to
      }))
      .sort((left, right) => compareUtf8(
        `${left.from}\0${left.arrow}\0${left.label}\0${left.to}`,
        `${right.from}\0${right.arrow}\0${right.label}\0${right.to}`
      )),
    "every visible continuity-panel arrow exactly matches its encoded edge"
  );
  const expectedRuntimeOwners = {
    R_REHYDRATE: ["rehydrating"],
    R_ACTIVE: ["active"],
    R_PAUSED: ["suspended"],
    R_RECOVERABLE: ["blocked_recoverable"],
    R_TERMINAL: ["blocked_terminal"],
    D_DONE: ["closed"],
    R_ABORTED: ["closed"]
  };
  for (const [nodeId, runtimeStatusIds] of Object.entries(expectedRuntimeOwners)) {
    assert.deepEqual(nodeById.get(nodeId)?.runtimeStatusIds, runtimeStatusIds, `${nodeId} owns exact runtime status`);
  }

  const expectedRuntimeMacros = {
    C01: ["RT01"],
    C10: ["RT02"],
    C11: ["RT03"],
    C02: ["RT04"],
    C03: ["RT05"],
    C04: ["RT06"],
    C05: ["RT07"],
    C06: ["RT08"],
    C07: ["RT09"],
    C08: ["RT10"],
    C09: ["RT11", "RT13"],
    L27: ["T35", "RT12"],
    L28: ["TF01", "RF01"]
  };
  for (const [edgeId, transitionIds] of Object.entries(expectedRuntimeMacros)) {
    assert.deepEqual(edgeById.get(edgeId)?.transitionIds, transitionIds, `${edgeId} has exact recovery trace`);
  }
  assert.deepEqual(
    { from: edgeById.get("A05")?.from, to: edgeById.get("A05")?.to, annotationId: edgeById.get("A05")?.annotationId },
    { from: "R_ACTIVE", to: "R_REJOIN", annotationId: "VIEW10" },
    "verified active runtime alone exposes exact rejoin"
  );
  assert.deepEqual(
    { from: edgeById.get("A06")?.from, to: edgeById.get("A06")?.to, annotationId: edgeById.get("A06")?.annotationId },
    { from: "R_REJOIN", to: "R_CONTINUE", annotationId: "VIEW11" },
    "the exact rejoin visibly resumes its mapped node and legal continuation"
  );

  const phase = protocol.machines.find((machine) => machine.id === "phase");
  const phaseNodeById = new Map(
    records.node.flatMap((node) => (node.phaseIds ?? []).map((phaseId) => [phaseId, node.id]))
  );
  const lifecycleEdgeByTransitionId = new Map();
  for (const edge of records.edge.filter((edge) => edge.kind === "lifecycle")) {
    for (const transitionId of edge.transitionIds) {
      assert.equal(
        lifecycleEdgeByTransitionId.has(transitionId),
        false,
        `${transitionId} has one continuation macro`
      );
      lifecycleEdgeByTransitionId.set(transitionId, edge);
    }
  }
  const expectedRejoin = phase.states
    .filter((state) => !state.terminal)
    .map((state) => {
      const nextTransitionIds = [
        ...phase.transitions
          .filter((transition) => transition.from === state.id)
          .map((transition) => transition.id),
        ...phase.families
          .filter((family) => (
            phase.selectors
              .find((selector) => selector.id === family.fromSelector)
              ?.members.includes(state.id)
          ))
          .map((family) => family.id)
      ].sort(compareUtf8);
      return {
        runtimeStatusId: "active",
        phaseId: state.id,
        nodeId: phaseNodeById.get(state.id),
        nextTransitionIds,
        continuationEdgeIds: [
          ...new Set(nextTransitionIds.map((transitionId) => {
            const edge = lifecycleEdgeByTransitionId.get(transitionId);
            assert.ok(edge, `${transitionId} resolves to a visible continuation macro`);
            return edge.id;
          }))
        ].sort(compareUtf8)
      };
    })
    .sort((left, right) => compareUtf8(left.phaseId, right.phaseId));
  assert.equal(expectedRejoin.length, 31, "all and only nonterminal phases can rejoin active runtime");
  assert.deepEqual(records.rejoin[0], expectedRejoin, "RJM01 is total and exact");
  assert.equal(new Set(records.rejoin[0].map((record) => record.phaseId)).size, 31);
  assert.equal(records.rejoin[0].some((record) => ["intent_captured", "aborted"].includes(record.phaseId)), false);

  for (const question of ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]) {
    const round = Number(question.slice(1)) <= 3 ? 1 : 2;
    const phasePrefix = `round_${round}_${question.toLowerCase()}`;
    for (const suffix of ["ready", "awaiting"]) {
      const record = records.rejoin[0].find((item) => item.phaseId === `${phasePrefix}_${suffix}`);
      assert.equal(record?.nodeId, `D_${question}`, `${record?.phaseId} rejoins its same visible question`);
    }
  }

  const outgoing = (nodeId) => records.edge.filter((edge) => edge.from === nodeId);
  assert.deepEqual(outgoing("R_START").map((edge) => edge.id), ["C01"]);
  assert.deepEqual(outgoing("R_ACTIVE").map((edge) => edge.id), ["C10", "A05", "C07", "C08", "C09"]);
  assert.deepEqual(outgoing("R_PAUSED").map((edge) => edge.id), ["C02"]);
  assert.deepEqual(outgoing("R_RECOVERABLE").map((edge) => edge.id), ["C03"]);
  assert.deepEqual(outgoing("R_REHYDRATE").map((edge) => edge.id), ["C11", "C04", "C05", "C06"]);
  assert.deepEqual(outgoing("R_REJOIN").map((edge) => edge.id), ["A06"]);
  assert.deepEqual(outgoing("R_CONTINUE").map((edge) => edge.id), []);
  for (const terminalId of ["R_TERMINAL", "R_ABORTED", "D_DONE", "R_QUARANTINED"]) {
    assert.equal(outgoing(terminalId).length, 0, `${terminalId} cannot return to lifecycle progress`);
  }

  assert.deepEqual(
    {
      from: edgeById.get("F01")?.from,
      to: edgeById.get("F01")?.to,
      kind: edgeById.get("F01")?.kind,
      operationId: edgeById.get("F01")?.operationId
    },
    {
      from: "R_UNVERIFIABLE",
      to: "R_QUARANTINED",
      kind: "fail-safe",
      operationId: "OQ01"
    }
  );
  assert.equal(
    records.coverage[0].some((entry) => entry.transition.id === "OQ01"),
    false,
    "quarantine never fabricates a protocol transition"
  );
  assert.match(
    markdown,
    /^\s*R_UNVERIFIABLE -\.->\|".*"\| R_QUARANTINED$/m,
    "the encoded OQ01 fail-safe is visibly dashed outside solid lifecycle transitions"
  );
});
