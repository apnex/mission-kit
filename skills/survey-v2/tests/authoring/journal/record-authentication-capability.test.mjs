import assert from "node:assert/strict";
import test from "node:test";
import {
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  projectJournalRecordAuthenticationCore,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  compileJournalIdentityPort,
  createNeutralJournalIdentityConfiguration,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  journalAuthenticationKey,
} from "../persistence/core/support.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

function compile(identity, recordAuthenticationDigest) {
  return compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort: {
      ...identity.identityPort,
      recordAuthenticationDigest,
    },
  });
}

test("record authentication is scope-bound deterministic and capability-pinned", () => {
  const scenario = makeEvidenceJournalScenario();
  const { identity } = scenario;
  const core = projectJournalRecordAuthenticationCore(
    scenario.record,
  );
  const expected =
    identity.identity.recordAuthenticationDigest(core);
  const changedCore = structuredClone(core);
  changedCore.payloadDigest = `sha256:${"f".repeat(64)}`;
  assert.notEqual(
    identity.identity.recordAuthenticationDigest(changedCore),
    expected,
  );
  const otherScope = structuredClone(identity.identityScope);
  otherScope.adapterScope.storeId = "other-fixture-store";
  otherScope.genesisMachineHeads =
    otherScope.genesisMachineHeads.map((head) => ({
      machineId: head.machineId,
      state: head.state,
      stateDigest: sha256Value({
        domain: "mission-kit:authoring:neutral-machine-state/v1",
        adapterScope: otherScope.adapterScope,
        occurrence: {
          machineId: head.machineId,
          state: head.state,
          journalOrdinal: 0,
        },
      }),
    }));
  const otherIdentity =
    createNeutralJournalIdentityConfiguration(
      otherScope,
      journalAuthenticationKey,
    ).identity;
  assert.notEqual(
    otherIdentity.recordAuthenticationDigest(core),
    expected,
  );

  assert.equal(
    errorCode(() => {
      const compiled = compile(
        identity,
        async () => expected,
      );
      compiled.recordAuthenticationDigest(core);
    }),
    "JOURNAL_IDENTITY_ASYNC_FORBIDDEN",
  );

  assert.equal(
    errorCode(() => {
      const compiled = compile(identity, () => {
        throw new Error("authentication authority unavailable");
      });
      compiled.recordAuthenticationDigest(core);
    }),
    "JOURNAL_IDENTITY_EXECUTION_FAILED",
  );

  let invocation = 0;
  assert.equal(
    errorCode(() => {
      const compiled = compile(
        identity,
        () => `sha256:${
          (invocation++ % 2 === 0 ? "a" : "b").repeat(64)
        }`,
      );
      compiled.recordAuthenticationDigest(core);
    }),
    "JOURNAL_IDENTITY_NONDETERMINISTIC",
  );

  const rawPort = { ...identity.identityPort };
  const compiled = compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort: rawPort,
  });
  rawPort.recordAuthenticationDigest = () =>
    `sha256:${"0".repeat(64)}`;
  assert.equal(
    compiled.recordAuthenticationDigest(core),
    expected,
  );
});
