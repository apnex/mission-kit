import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealAnalysisResult } from "../../source/executables/statistics/index.mjs";
import { analysisResultFixture } from "./analytical-fixtures.mjs";

test("analysis-result facade preserves exact sealed bytes and rejects future disclosure fields", () => {
  const fixture = analysisResultFixture();
  const sealed = sealAnalysisResult(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealAnalysisResult({ ...fixture, futureDisclosureDigest: "a".repeat(64) }),
    /violates its sealed contract/,
  );
  const inventedMissingValue = structuredClone(fixture);
  inventedMissingValue.metricResults[0] = {
    ...inventedMissingValue.metricResults[0],
    status: "not_judgeable",
    value: 0.5,
  };
  assert.throws(
    () => sealAnalysisResult(inventedMissingValue),
    /violates its sealed contract|identity invariants/u,
  );
  const duplicatePair = structuredClone(fixture);
  duplicatePair.metricResults.push({
    ...duplicatePair.metricResults[0],
    metricResultId:
      "SEMANTIC_INTENT_ATOMS:candidate-a-copy",
  });
  assert.throws(
    () => sealAnalysisResult(duplicatePair),
    /identity invariants/u,
  );
});
