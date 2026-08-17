import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealAnalysisPlan } from "../../source/executables/statistics/index.mjs";
import { analysisPlanFixture } from "./analytical-fixtures.mjs";

test("analysis-plan facade preserves exact sealed bytes and rejects post-seal fields", () => {
  const fixture = analysisPlanFixture();
  const sealed = sealAnalysisPlan(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealAnalysisPlan({ ...fixture, observedWinner: "candidate-a" }),
    /violates its sealed contract/,
  );
});
