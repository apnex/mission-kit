import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CANDIDATE_V2_SELECTOR,
  SessionContractSelectionError,
  selectSessionContract
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  makeSession
} from "../../fixtures/survey/session-v2/session-factory.mjs";

test("historical v1 sessions preserve frozen package identification and cannot be reinterpreted by the candidate selector", async () => {
  const v1SchemaBytes = await readFile(
    new URL("../../../schemas/v1/session-state.schema.json", import.meta.url)
  );
  assert.equal(
    createHash("sha256").update(v1SchemaBytes).digest("hex"),
    "24a294c5aaa799883e1941d7d04a3dd63677ebba6dbaffb27d1550b5aa46457e"
  );

  const historicalBytes = await readFile(
    new URL(
      "../../fixtures/survey/session-v2/historical-v1-session.json",
      import.meta.url
    )
  );
  const session = JSON.parse(historicalBytes);
  const before = structuredClone(session);
  const selected = selectSessionContract(session);
  assert.equal(selected.selector, "frozen-v1");
  assert.deepEqual(selected.package, session.package);
  assert.throws(
    () => selectSessionContract(session, CANDIDATE_V2_SELECTOR),
    (error) =>
      error instanceof SessionContractSelectionError &&
      error.code === "CANDIDATE_SELECTOR_REFUSES_V1"
  );
  assert.deepEqual(session, before);

  const changedFrozenPackage = structuredClone(session);
  changedFrozenPackage.package.projectionDigest = `sha256:${"0".repeat(64)}`;
  assert.throws(
    () => selectSessionContract(changedFrozenPackage),
    (error) =>
      error instanceof SessionContractSelectionError &&
      error.code === "FROZEN_V1_IDENTITY_REQUIRED"
  );

  const changedFrozenProtocol = structuredClone(session);
  changedFrozenProtocol.protocol.digest = `sha256:${"0".repeat(64)}`;
  assert.throws(
    () => selectSessionContract(changedFrozenProtocol),
    (error) =>
      error instanceof SessionContractSelectionError &&
      error.code === "FROZEN_V1_IDENTITY_REQUIRED"
  );

  assert.deepEqual(
    await readFile(
      new URL(
        "../../fixtures/survey/session-v2/historical-v1-session.json",
        import.meta.url
      )
    ),
    historicalBytes
  );

  const candidate = makeSession();
  assert.throws(
    () => selectSessionContract(candidate),
    (error) =>
      error instanceof SessionContractSelectionError &&
      error.code === "EXPLICIT_CANDIDATE_SELECTOR_REQUIRED"
  );
  assert.equal(
    selectSessionContract(candidate, CANDIDATE_V2_SELECTOR).schemaId,
    "urn:mission-kit:survey-v2:schema:session-state:v2"
  );
  assert.equal(candidate.package.version, "1.0.0");
});
