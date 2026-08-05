import assert from "node:assert/strict";
import test from "node:test";
import {
  projectJournalRecordAuthenticationCore,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createNeutralJournalIdentityConfiguration,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("a neutral identity configuration owns its authentication key bytes", () => {
  const scenario = makeEvidenceJournalScenario();
  const key = Uint8Array.from(
    { length: 32 },
    (_, index) => index,
  );
  const configured = createNeutralJournalIdentityConfiguration(
    scenario.identity.identityScope,
    key,
  );
  const core = projectJournalRecordAuthenticationCore(
    scenario.record,
  );
  const binding = structuredClone(configured.identityBinding);
  const expected =
    configured.identity.recordAuthenticationDigest(core);

  key.fill(255);

  assert.deepEqual(configured.identityBinding, binding);
  assert.equal(
    configured.identity.recordAuthenticationDigest(core),
    expected,
  );
});
