import test from "node:test";
import assert from "node:assert/strict";
import { EvidenceFreezer } from "../../source/executables/evidence/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("derivation output seals before its one-way sibling record", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const freezer = new EvidenceFreezer({ rootPath: fixture.rootPath, clock: () => 10 });
  const result = await freezer.publishDerivation({
    derivationId: "summary-1",
    recipeId: "registered-summary/v1",
    inputRoots: ["a".repeat(64)],
    output: { result: 3 },
    actor: "analyst-engine",
    tool: "deterministic",
  });
  const bytes = await freezer.verifyBlob(result.outputReference);
  assert.equal(bytes.toString("utf8"), '{"result":3}');
  assert.equal(result.record.output.rawDigest, result.outputReference.rawDigest);
  assert.equal(Object.hasOwn(result.record, "authoritativeStateRoot"), false);
});
