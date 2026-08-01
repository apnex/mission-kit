import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealQualificationOverlay } from "../../source/executables/statistics/index.mjs";
import { qualificationOverlayFixture } from "./analytical-fixtures.mjs";

test("qualification-overlay facade preserves exact sealed bytes and rejects unknown fields", () => {
  const fixture = qualificationOverlayFixture();
  const sealed = sealQualificationOverlay(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealQualificationOverlay({ ...fixture, sourceEvidenceMutatedAt: "later" }),
    /violates its sealed contract/,
  );
});
