import assert from "node:assert/strict";
import test from "node:test";
import {
  projectSessionAuthoringSnapshot,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  createCandidate,
} from "./support.mjs";

test(
  "the Survey session projects to exactly one closed neutral K13 store snapshot",
  async () => {
    const { session } = await createCandidate();
    const projected = projectSessionAuthoringSnapshot(session);

    assert.deepEqual(Object.keys(projected), [
      "commitRevision",
      "idempotencyOutcomeView",
      "identityBinding",
      "identityScope",
      "journal",
      "machineHeads",
      "rootSealDigest",
      "storeId",
      "workspace",
    ]);
    assert.equal(projected.storeId, session.sessionId);
    assert.equal(
      projected.commitRevision,
      session.commitRevision,
    );
    assert.deepEqual(
      projected.workspace,
      session.authoring.workspace,
    );
    assert.deepEqual(projected.journal, session.journal);
    assert.deepEqual(
      projected.machineHeads,
      session.authoring.persistence.machineHeads,
    );
    assert.deepEqual(
      projected.idempotencyOutcomeView,
      session.authoring.persistence.idempotencyOutcomeView,
    );
    assert.deepEqual(
      projected.identityBinding,
      session.authoring.persistence.identityBinding,
    );
    assert.deepEqual(
      projected.identityScope,
      session.authoring.persistence.identityScope,
    );
    assert.equal(
      projected.rootSealDigest,
      session.snapshotDigest,
    );
    assert.equal(Object.hasOwn(projected, "phase"), false);
    assert.equal(Object.hasOwn(projected, "authority"), false);
    assert.equal(Object.hasOwn(projected, "inputs"), false);
    assert.notStrictEqual(
      projected.workspace,
      session.authoring.workspace,
    );
    assert.equal(Object.isFrozen(projected), true);
  },
);
