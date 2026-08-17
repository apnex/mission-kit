import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
} from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("lifecycle authority requires a valid external exact-command receipt", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const authorized = fixture.command();

  const changedScope = structuredClone(authorized);
  changedScope.idempotencyKey = "sample/open/changed-after-issuance";
  await assert.rejects(
    fixture.engine.execute(changedScope),
    (error) =>
      error instanceof AuthorizationError &&
      /command scope/u.test(error.message),
  );

  const forgedSignature = structuredClone(authorized);
  forgedSignature.authorizationReceipts[0].signatureBase64url =
    forgedSignature.authorizationReceipts[0].signatureBase64url.replace(
      /^./u,
      forgedSignature.authorizationReceipts[0].signatureBase64url[0] === "A"
        ? "B"
        : "A",
    );
  await assert.rejects(
    fixture.engine.execute(forgedSignature),
    (error) =>
      error instanceof AuthorizationError &&
      /signature verification failed/u.test(error.message),
  );

  const accepted = await fixture.engine.execute(authorized);
  assert.equal(accepted.state, "OPEN");
  const state = await fixture.stateStore.load("sample", "sample-1", {
    required: true,
  });
  const event = state.authoritativeStateCore.eventLedger[0].core;
  assert.equal(event.authorizationReceiptDigests.length, 1);
  assert.equal(
    event.authorityTrustRootDigest,
    fixture.authority.trustRoot.trustRootDigest,
  );
  assert.equal(Object.hasOwn(event, "commandActorContexts"), false);
  assert.equal(Object.hasOwn(event, "authorizationEvidenceRefs"), false);
});
