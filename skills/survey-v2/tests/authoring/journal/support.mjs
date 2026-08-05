import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  replayAuthoringJournal,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  appendTransitionScenario,
  errorCode,
  makeEvidenceJournalScenario,
} from "../persistence/core/support.mjs";

export {
  appendTransitionScenario,
  errorCode,
  makeEvidenceJournalScenario,
};

export function rehashRecord(record, identity) {
  record.authenticationDigest =
    identity.recordAuthenticationDigest(
      projectJournalRecordAuthenticationCore(record),
    );
  record.recordDigest = journalRecordDigest(record);
  return record;
}

export function rehashPublicRecord(record) {
  record.recordDigest = journalRecordDigest(record);
  return record;
}

export function replayScenario(scenario, overrides = {}) {
  return replayAuthoringJournal({
    commitRevision:
      overrides.commitRevision ?? scenario.journal.length,
    workspace: overrides.workspace ?? scenario.workspace,
    journal: overrides.journal ?? scenario.journal,
    machineHeads:
      overrides.machineHeads ??
      scenario.edgeBundle?.machineHeads ??
      scenario.machineHeads,
    idempotencyOutcomeView:
      overrides.idempotencyOutcomeView ?? scenario.outcomes,
    authoringMachineId: "authoring-kernel",
    identity: overrides.identity ?? scenario.identity.identity,
  });
}
