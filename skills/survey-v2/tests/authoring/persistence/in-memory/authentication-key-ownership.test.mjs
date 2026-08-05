import assert from "node:assert/strict";
import test from "node:test";
import {
  projectJournalRecordAuthenticationCore,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createInMemoryJournalIdentityConfiguration,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  compileJournalIdentityPort,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  makeEvidenceJournalScenario,
} from "../../journal/support.mjs";

test("an in-memory identity configuration owns a shared authentication key view", () => {
  const scenario = makeEvidenceJournalScenario();
  const key = new Uint8Array(new SharedArrayBuffer(32));
  key.set(
    Uint8Array.from(
      { length: 32 },
      (_, index) => 255 - index,
    ),
  );
  const configured = createInMemoryJournalIdentityConfiguration(
    {
      genesisRevisionState:
        scenario.identity.identityScope.genesisRevisionState,
      genesisWorkspaceIntegrityDigest:
        scenario.identity.identityScope
          .genesisWorkspaceIntegrityDigest,
      genesisMachines:
        scenario.identity.identityScope.genesisMachineHeads.map(
          ({ machineId, state }) => ({ machineId, state }),
        ),
      adapterScope:
        scenario.identity.identityScope.adapterScope,
    },
    key,
  );
  const identity = compileJournalIdentityPort({
    identityBinding: configured.identityBinding,
    identityScope: configured.identityScope,
    identityPort: configured.identityPort,
  });
  const core = projectJournalRecordAuthenticationCore(
    scenario.record,
  );
  const binding = structuredClone(configured.identityBinding);
  const expected = identity.recordAuthenticationDigest(core);

  key.fill(0);

  assert.deepEqual(configured.identityBinding, binding);
  assert.equal(
    identity.recordAuthenticationDigest(core),
    expected,
  );
});
