import assert from "node:assert/strict";
import test from "node:test";
import {
  captureObservableEvidence,
  EvidenceFreezer,
} from "../../source/executables/evidence/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EM08 freezes reproducible observable evidence before its immutable derivation sidecar", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const capture = captureObservableEvidence({
    captureId: "capture-1",
    inputs: { value: 1 },
    outputs: { value: 2 },
    sessionState: { state: "closed" },
    toolActions: [],
    telemetry: [],
    failures: [],
    provenance: { adapter: "fixture" },
  });
  const freezer = new EvidenceFreezer({ rootPath: fixture.rootPath, clock: () => 9 });
  const first = await freezer.publishDerivation({
    derivationId: "capture-summary",
    recipeId: "observable-summary/v1",
    inputRoots: [capture.captureDigest],
    output: capture,
    actor: "deterministic-evidence-engine",
    tool: "canonical-json/v1",
  });
  const replay = await freezer.publishDerivation({
    derivationId: "capture-summary",
    recipeId: "observable-summary/v1",
    inputRoots: [capture.captureDigest],
    output: capture,
    actor: "deterministic-evidence-engine",
    tool: "canonical-json/v1",
  });
  assert.equal(replay.replayed, true);
  assert.equal(replay.record.derivationDigest, first.record.derivationDigest);
  assert.equal(
    first.record.output.rawDigest,
    first.outputReference.rawDigest,
  );
});
