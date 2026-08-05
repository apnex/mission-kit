import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  reconstructSurveySessionJournalIdentity,
} from "../../../source/authoring/survey/session-journal-identity.mjs";
import {
  authenticationKey,
  createCandidate,
} from "./support.mjs";

test(
  "the external key reconstructs the exact persisted Survey journal identity after a cold start",
  async () => {
    const warm = await createCandidate();
    const coldConfiguration =
      reconstructSurveySessionJournalIdentity(
        structuredClone(warm.session),
        Buffer.from(authenticationKey),
      );
    const coldIdentity = compileJournalIdentityPort(
      coldConfiguration,
    );

    assert.notStrictEqual(
      coldConfiguration,
      warm.identityConfiguration,
    );
    assert.deepEqual(
      coldConfiguration.identityBinding,
      warm.identityConfiguration.identityBinding,
    );
    assert.deepEqual(
      coldConfiguration.identityScope,
      warm.identityConfiguration.identityScope,
    );
    assert.deepEqual(
      coldIdentity.binding,
      warm.identity.binding,
    );
    assert.equal(
      coldIdentity.genesisChainDigest(),
      warm.identity.genesisChainDigest(),
    );
    assert.deepEqual(
      coldIdentity.genesisMachineHeads,
      warm.identity.genesisMachineHeads,
    );
  },
);
