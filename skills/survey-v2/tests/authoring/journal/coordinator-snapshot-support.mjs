import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  replayAuthoringJournal,
} from "../../../source/authoring/runtime/journal-replay.mjs";

export function rehashJournalRecord(record, identity) {
  record.authenticationDigest =
    identity.recordAuthenticationDigest(
      projectJournalRecordAuthenticationCore(record),
    );
  record.recordDigest = journalRecordDigest(record);
  return record;
}

export function rehashPublicJournalRecord(record) {
  record.recordDigest = journalRecordDigest(record);
  return record;
}

export function replayCoordinatorSnapshot(
  harness,
  snapshot,
  overrides = {},
) {
  return replayAuthoringJournal({
    commitRevision:
      overrides.commitRevision ?? snapshot.commitRevision,
    workspace: overrides.workspace ?? snapshot.workspace,
    journal: overrides.journal ?? snapshot.journal,
    machineHeads:
      overrides.machineHeads ?? snapshot.machineHeads,
    idempotencyOutcomeView:
      overrides.idempotencyOutcomeView ??
      snapshot.idempotencyOutcomeView,
    authoringMachineId: "authoring-kernel",
    identity: overrides.identity ?? harness.identity,
  });
}
