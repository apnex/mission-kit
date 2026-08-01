import test from "node:test";
import assert from "node:assert/strict";
import {
  IntegrityError,
  atomicReplace,
  canonicalBytes,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("re-rooted but non-contiguous event ancestry is rejected", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  await fixture.engine.execute(fixture.command());
  await fixture.engine.execute(
    fixture.command({
      transitionId: "S02",
      expectedRevision: 1,
      idempotencyKey: "sample/close",
      value: 2,
    }),
  );
  const record = await fixture.stateStore.load("sample", "sample-1");
  const second = record.authoritativeStateCore.eventLedger[1];
  second.core.priorRevision = 0;
  second.eventRoot = hashCanonical("semantic-event/v1", second.core);
  record.authoritativeStateCore.semanticState.lastEventRoot = second.eventRoot;
  record.authoritativeStateCore.semanticCoreDigest = hashCanonical(
    "resulting-semantic-core/v1",
    record.authoritativeStateCore.semanticState,
  );
  second.resultingSemanticCoreDigest =
    record.authoritativeStateCore.semanticCoreDigest;
  record.authoritativeStateRoot = hashCanonical(
    "authoritative-state/v1",
    record.authoritativeStateCore,
  );
  await atomicReplace(
    fixture.stateStore.pathFor("sample", "sample-1"),
    canonicalBytes(record),
  );
  await assert.rejects(
    fixture.stateStore.load("sample", "sample-1"),
    (error) =>
      error instanceof IntegrityError && /not contiguous/.test(error.message),
  );
});
