import assert from "node:assert/strict";
import test from "node:test";
import {
  blankViewDigest,
  projectionOutputDigest,
  rawEvidenceDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("projection-output bytes use their own frozen domain-separated identity", () => {
  const bytes = Buffer.from(fixture.exactBytes.hex, "hex");

  assert.equal(
    projectionOutputDigest(bytes),
    fixture.exactBytes.projectionOutputDigest
  );
  assert.notEqual(projectionOutputDigest(bytes), blankViewDigest(bytes));
  assert.notEqual(projectionOutputDigest(bytes), rawEvidenceDigest(bytes));
});
