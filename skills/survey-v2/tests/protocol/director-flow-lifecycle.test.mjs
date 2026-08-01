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

function escapeMermaid(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
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

test("Director lifecycle visibly preserves actor lanes, six handoffs, ratification, and revision", async () => {
  const markdown = await readFile(`${surveyRoot}/references/director-flow.md`, "utf8");
  const records = parseLifecycleRecords(markdown);
  assert.deepEqual(records.panel, [
    { id: "lifecycle", label: "Primary Director lifecycle", order: 1 },
    { id: "continuity", label: "Continuity, abort, and fail-safe handling", order: 2 }
  ]);
  const mermaidPanels = parseMermaidPanels(markdown);
  assert.deepEqual(
    mermaidPanels.map((panel) => panel.heading),
    records.panel.map((panel) => panel.label),
    "visible panel headings exactly match encoded panel order"
  );
  const primary = parseVisiblePanel(mermaidPanels[0].source);
  const nodeById = new Map(records.node.map((node) => [node.id, node]));
  const lifecycleNodes = records.node.filter((node) => node.panel === "lifecycle");
  const lifecycleLaneIds = new Set(lifecycleNodes.map((node) => node.lane));
  assert.deepEqual(
    primary.lanes,
    records.lane
      .filter((lane) => lifecycleLaneIds.has(lane.id))
      .map((lane) => ({
        subgraphId: `LIFECYCLE_${lane.id.toUpperCase()}`,
        label: escapeMermaid(lane.label)
      })),
    "the primary panel visibly preserves its three encoded actor lanes"
  );
  assert.deepEqual(
    primary.nodes
      .map(({ id, label, subgraphId }) => ({ id, label, subgraphId }))
      .sort((left, right) => compareUtf8(left.id, right.id)),
    lifecycleNodes
      .map((node) => ({
        id: node.id,
        label: escapeMermaid(node.label),
        subgraphId: `LIFECYCLE_${node.lane.toUpperCase()}`
      }))
      .sort((left, right) => compareUtf8(left.id, right.id)),
    "the primary panel's visible node labels and lane membership match encoded nodes"
  );
  assert.deepEqual(
    primary.edges
      .sort((left, right) => compareUtf8(
        `${left.from}\0${left.arrow}\0${left.label}\0${left.to}`,
        `${right.from}\0${right.arrow}\0${right.label}\0${right.to}`
      )),
    records.edge
      .filter((edge) => nodeById.get(edge.from)?.panel === "lifecycle")
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
    "every visible primary-panel arrow exactly matches its encoded lifecycle edge"
  );
  assert.equal(records.questions.length, 1, "one question evidence record");
  assert.deepEqual(
    records.lane.map(({ id, order }) => ({ id, order })),
    [
      { id: "director", order: 1 },
      { id: "proposer", order: 2 },
      { id: "runtime", order: 3 }
    ]
  );

  const laneIds = new Set(records.lane.map((lane) => lane.id));
  assert.equal(nodeById.size, records.node.length, "visible node IDs are unique");
  for (const node of records.node) {
    assert.ok(laneIds.has(node.lane), `${node.id} has one declared lane`);
    assert.ok(records.panel.some((panel) => panel.id === node.panel), `${node.id} has one declared panel`);
  }

  const expectedQuestions = [
    { questionId: "Q1", nodeId: "D_Q1", presentTransitionId: "T05", responseTransitionId: "T06", rejectionId: "RJ01" },
    { questionId: "Q2", nodeId: "D_Q2", presentTransitionId: "T07", responseTransitionId: "T08", rejectionId: "RJ01" },
    { questionId: "Q3", nodeId: "D_Q3", presentTransitionId: "T09", responseTransitionId: "T10", rejectionId: "RJ01" },
    { questionId: "Q4", nodeId: "D_Q4", presentTransitionId: "T16", responseTransitionId: "T17", rejectionId: "RJ01" },
    { questionId: "Q5", nodeId: "D_Q5", presentTransitionId: "T18", responseTransitionId: "T19", rejectionId: "RJ01" },
    { questionId: "Q6", nodeId: "D_Q6", presentTransitionId: "T20", responseTransitionId: "T21", rejectionId: "RJ01" }
  ];
  assert.deepEqual(records.questions[0], expectedQuestions);
  assert.equal(new Set(expectedQuestions.map((item) => item.nodeId)).size, 6);
  for (const question of expectedQuestions) {
    const node = nodeById.get(question.nodeId);
    assert.deepEqual(
      { lane: node?.lane, kind: node?.kind, checkpoint: node?.checkpoint, questionId: node?.questionId },
      { lane: "director", kind: "question", checkpoint: "question", questionId: question.questionId }
    );
    const rejectionLoops = records.edge.filter((edge) => (
      edge.kind === "rejection" &&
      edge.from === question.nodeId &&
      edge.to === question.nodeId &&
      edge.rejectionId === "RJ01"
    ));
    assert.equal(rejectionLoops.length, 1, `${question.questionId} has one same-question rejection loop`);
  }

  const requiredNodes = {
    D_OPEN: ["director", "milestone"],
    P_INIT: ["proposer", "milestone"],
    P_R1: ["proposer", "milestone"],
    P_R1_INTERPRET: ["proposer", "milestone"],
    P_R2: ["proposer", "milestone"],
    P_R2_INTERPRET: ["proposer", "milestone"],
    P_COMPOSE: ["proposer", "milestone"],
    R_VALIDATE: ["runtime", "decision"],
    D_WALK: ["director", "milestone"],
    D_DECIDE: ["director", "decision"],
    D_FEEDBACK: ["director", "milestone"],
    P_CLASSIFY: ["proposer", "decision"],
    P_SCOPE_LINK: ["proposer", "annotation"],
    R_FINALIZE: ["runtime", "milestone"],
    R_FINAL_CHECK: ["runtime", "decision"],
    R_ANCESTRY_LINK: ["runtime", "annotation"],
    D_DONE: ["director", "terminal"]
  };
  for (const [nodeId, [lane, kind]] of Object.entries(requiredNodes)) {
    assert.deepEqual(
      {
        panel: nodeById.get(nodeId)?.panel,
        lane: nodeById.get(nodeId)?.lane,
        kind: nodeById.get(nodeId)?.kind
      },
      { panel: "lifecycle", lane, kind },
      `${nodeId} is a visible primary-panel ${lane} ${kind}`
    );
  }
  assert.equal(nodeById.get("D_WALK").checkpoint, "walkthrough");
  assert.equal(nodeById.get("D_DECIDE").checkpoint, "ratification");

  const hasEdge = (from, to, predicate = () => true) => (
    records.edge.some((edge) => edge.from === from && edge.to === to && predicate(edge))
  );
  const happyPath = [
    "D_OPEN",
    "P_INIT",
    "P_R1",
    "D_Q1",
    "D_Q2",
    "D_Q3",
    "P_R1_INTERPRET",
    "P_R2",
    "D_Q4",
    "D_Q5",
    "D_Q6",
    "P_R2_INTERPRET",
    "P_COMPOSE",
    "R_VALIDATE",
    "D_WALK",
    "D_DECIDE",
    "R_FINALIZE",
    "R_FINAL_CHECK",
    "D_DONE"
  ];
  for (let index = 0; index < happyPath.length - 1; index += 1) {
    assert.ok(hasEdge(happyPath[index], happyPath[index + 1]), `${happyPath[index]} reaches ${happyPath[index + 1]}`);
  }

  assert.ok(hasEdge("D_DECIDE", "R_FINALIZE", (edge) => edge.transitionIds?.includes("T31")));
  assert.ok(hasEdge("D_DECIDE", "D_FEEDBACK", (edge) => edge.transitionIds?.includes("T32")));
  assert.ok(hasEdge("D_FEEDBACK", "P_CLASSIFY", (edge) => edge.annotationId === "CLASS00"));
  assert.ok(hasEdge("P_CLASSIFY", "P_COMPOSE", (edge) => edge.transitionIds?.includes("T33")));
  assert.ok(hasEdge("P_CLASSIFY", "P_R2_INTERPRET", (edge) => edge.transitionIds?.includes("T37")));
  assert.ok(hasEdge("P_CLASSIFY", "P_SCOPE_LINK", (edge) => edge.annotationId === "CLASS01"));
  assert.ok(hasEdge("D_FEEDBACK", "D_FEEDBACK", (edge) => edge.transitionIds?.includes("T39")));
  assert.ok(hasEdge("D_FEEDBACK", "D_DECIDE", (edge) => edge.transitionIds?.includes("T47")));
  assert.ok(hasEdge("R_FINALIZE", "R_FINAL_CHECK", (edge) => edge.annotationId === "CHECK02"));
  assert.ok(hasEdge("R_FINAL_CHECK", "R_ANCESTRY_LINK", (edge) => edge.annotationId === "CHECK03"));
  assert.equal(hasEdge("D_FEEDBACK", "R_FINALIZE"), false, "feedback cannot bypass revision classification");
  assert.equal(hasEdge("D_FEEDBACK", "D_DONE"), false, "withholding is not ratification");
  assert.doesNotMatch(markdown, /\bundefined\b/);
});
