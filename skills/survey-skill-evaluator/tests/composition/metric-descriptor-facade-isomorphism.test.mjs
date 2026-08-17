import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealMetricDescriptor } from "../../source/executables/statistics/index.mjs";
import { metricDescriptorFixture } from "./analytical-fixtures.mjs";

test("metric-descriptor facade preserves exact sealed bytes and rejects unknown fields", () => {
  const fixture = metricDescriptorFixture();
  const sealed = sealMetricDescriptor(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealMetricDescriptor({ ...fixture, implicitTransform: "clamp" }),
    /violates its sealed contract/,
  );
});
