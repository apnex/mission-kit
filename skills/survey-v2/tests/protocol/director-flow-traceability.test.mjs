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

test("Director lifecycle traceability assigns every full protocol tuple to exactly one macro", async () => {
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

  const coverage = records.coverage[0];
  const expected = protocol.machines.flatMap((machine) => (
    [...machine.transitions, ...machine.families].map((transition) => ({
      machine: machine.id,
      transition
    }))
  ));
  assert.equal(expected.length, 63, "canonical protocol transition/family count");
  assert.equal(expected.filter((item) => item.machine === "phase").length, 49);
  assert.equal(expected.filter((item) => item.machine === "runtime").length, 14);
  assert.equal(coverage.length, expected.length, "coverage cardinality");

  const keyFor = (item) => `${item.machine}/${item.transition.id}`;
  assert.equal(new Set(coverage.map(keyFor)).size, coverage.length, "coverage keys are unique");
  assert.deepEqual(
    coverage
      .map(({ machine, transition }) => ({ machine, transition }))
      .sort((left, right) => compareUtf8(keyFor(left), keyFor(right))),
    expected.sort((left, right) => compareUtf8(keyFor(left), keyFor(right))),
    "coverage independently reconstructs every complete canonical tuple"
  );

  const canonicalById = new Map(expected.map((item) => [item.transition.id, item]));
  const lifecycleEdges = records.edge.filter((edge) => edge.kind === "lifecycle");
  const ownerByKey = new Map();
  for (const edge of lifecycleEdges) {
    for (const transitionId of edge.transitionIds) {
      const canonical = canonicalById.get(transitionId);
      assert.ok(canonical, `${edge.id} names a canonical transition`);
      const key = keyFor(canonical);
      assert.equal(ownerByKey.has(key), false, `${key} has only one lifecycle macro owner`);
      ownerByKey.set(key, edge);
    }
  }
  assert.equal(ownerByKey.size, expected.length, "every canonical tuple has a macro owner");
  for (const entry of coverage) {
    assert.equal(
      entry.edgeId,
      ownerByKey.get(keyFor(entry))?.id,
      `${keyFor(entry)} coverage resolves to its declared macro`
    );
  }

  const ownerOf = (transitionId) => ownerByKey.get(keyFor(canonicalById.get(transitionId)))?.id;
  assert.equal(ownerOf("T35"), ownerOf("RT12"), "successful phase/runtime close is one macro");
  assert.equal(ownerOf("TF01"), ownerOf("RF01"), "abort phase/runtime close is one macro");
});
