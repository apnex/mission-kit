import assert from "node:assert/strict";
import test from "node:test";
import {
  blankViewDigest,
  rawEvidenceDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("blank-view and raw-evidence exact bytes match domain-separated golden hashes", () => {
  const bytes = Buffer.from(fixture.exactBytes.hex, "hex");
  assert.equal(blankViewDigest(bytes), fixture.exactBytes.blankViewDigest);
  assert.equal(rawEvidenceDigest(bytes), fixture.exactBytes.rawEvidenceDigest);
  assert.notEqual(blankViewDigest(bytes), rawEvidenceDigest(bytes));
});
