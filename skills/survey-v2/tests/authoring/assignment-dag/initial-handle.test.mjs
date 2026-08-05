import assert from "node:assert/strict";
import test from "node:test";
import { deriveRequestHandle } from "../../../source/authoring/kernel/assignment-dag.mjs";
import { requestDigestHex } from "../../../source/authoring/kernel/text-forms.mjs";
import { loadK10AssignmentScenario } from "./support.mjs";

test("an unoccupied request receives its initial 8-character digest handle", async () => {
  const { request } = await loadK10AssignmentScenario();
  const handle = deriveRequestHandle({
    requestDigest: request.spec.requestDigest
  });

  assert.equal(handle.length, 8);
  assert.match(handle, /^[0-9a-f]{8}$/);
  assert.equal(
    handle,
    requestDigestHex(request.spec.requestDigest).slice(0, 8)
  );
});
