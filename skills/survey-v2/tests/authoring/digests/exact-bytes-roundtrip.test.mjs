import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeExactBytes,
  encodeExactBytes
} from "../../../source/authoring/kernel/digests.mjs";
import { goldenDigestFixture as fixture } from "./golden-fixture.mjs";

test("opaque bytes round-trip losslessly through the canonical base64 carrier", () => {
  const bytes = Buffer.from(fixture.exactBytes.hex, "hex");
  const carrier = encodeExactBytes(bytes);
  assert.deepEqual(carrier, fixture.exactBytes.carrier);
  assert.equal(Object.isFrozen(carrier), true);
  assert.deepEqual(decodeExactBytes(carrier), bytes);
});
