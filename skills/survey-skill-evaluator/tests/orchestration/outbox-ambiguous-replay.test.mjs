import test from "node:test";
import assert from "node:assert/strict";
import {
  IntegrityError,
  OutboxDispatcher,
} from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("ambiguous delivery never infers acknowledgement and retries identical bytes", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  await fixture.engine.execute(fixture.command());
  const dispatcher = new OutboxDispatcher({ stateStore: fixture.stateStore });
  const [entry] = await dispatcher.pending("sample", "sample-1");
  let firstPayload;
  await assert.rejects(
    dispatcher.dispatchOne(
      "sample",
      "sample-1",
      entry.messageDigest,
      async (payload) => {
        firstPayload = payload;
        throw new Error("transport lost after send");
      },
    ),
    (error) => error instanceof IntegrityError,
  );
  const result = await dispatcher.dispatchOne(
    "sample",
    "sample-1",
    entry.messageDigest,
    async (payload) => {
      assert.deepEqual(payload, firstPayload);
      return {
        acknowledged: true,
        receiver: "fixture",
        receipt: { accepted: true, messageDigest: entry.messageDigest },
      };
    },
  );
  assert.equal(result.entry.deliveryState, "acknowledged");
  assert.equal(result.entry.attempts.length, 2);
  assert.equal(result.entry.attempts[0].status, "ambiguous");
});
