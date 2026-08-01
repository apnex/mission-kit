import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealAgreementReport } from "../../source/executables/statistics/index.mjs";
import { agreementReportFixture } from "./analytical-fixtures.mjs";

test("agreement-report facade preserves exact sealed bytes and rejects unknown fields", () => {
  const fixture = agreementReportFixture();
  const sealed = sealAgreementReport(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealAgreementReport({ ...fixture, translatedEstimate: 0.8 }),
    /violates its sealed contract/,
  );
});
