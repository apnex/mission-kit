import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealCalibrationCorpus } from "../../source/executables/statistics/index.mjs";
import { calibrationCorpusFixture } from "./analytical-fixtures.mjs";

test("calibration-corpus facade preserves exact sealed bytes and rejects holdout reuse as calibration", () => {
  const fixture = calibrationCorpusFixture();
  const sealed = sealCalibrationCorpus(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () =>
      sealCalibrationCorpus({
        ...fixture,
        holdoutCohortDigest: fixture.calibrationCohortDigest,
      }),
    /must be independently sealed/,
  );
});
