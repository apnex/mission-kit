import {
  compileJournalIdentityPort,
  replayAuthoringJournal,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  reconstructSurveySessionJournalIdentity,
} from "../../../source/authoring/survey/session-journal-identity.mjs";
import {
  assertSessionSemantics,
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  projectSessionAuthoringSnapshot,
  sealSurveySessionRoot,
  verifySurveySessionSnapshotDigest,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  verifyCurrentQuestionProjectionRecipeFromSession,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  authenticationKey,
  createCandidate,
} from "../session-v2/support.mjs";

export {
  authenticationKey,
  createCandidate,
};

export function initializationBoundaryFromScope(scope) {
  return Object.fromEntries([
    "dependencyPlanCount",
    "dependencyPlanDigest",
    "resolverAttemptCount",
    "resolverAttemptPrefixDigest",
    "resolverReceiptCount",
    "resolverReceiptPrefixDigest",
    "rehydrationOutputCount",
    "rehydrationOutputPrefixDigest",
    "initResolveDigest",
  ].map((field) => [field, scope[field]]));
}

export function resealTamper(session, mutate) {
  const tampered = structuredClone(session);
  mutate(tampered);
  return sealSurveySessionRoot(tampered);
}

/**
 * Focused R12 seam used until the package compiler refreshes generated
 * validators for the source session schema. It exercises every post-schema
 * production proof in its production order.
 */
export function validateR12Provenance(session) {
  verifySurveySessionSnapshotDigest(session);
  const identity = reconstructSurveySessionJournalIdentity(
    session,
    authenticationKey,
  );
  assertSessionSemantics(session);
  const compiledIdentity =
    compileJournalIdentityPort(identity);
  const snapshot =
    projectSessionAuthoringSnapshot(session);
  replayAuthoringJournal({
    commitRevision: snapshot.commitRevision,
    workspace: snapshot.workspace,
    journal: snapshot.journal,
    machineHeads: snapshot.machineHeads,
    idempotencyOutcomeView:
      snapshot.idempotencyOutcomeView,
    authoringMachineId: "authoring",
    identity: compiledIdentity,
  });
  verifyCurrentQuestionProjectionRecipeFromSession(session);
  return identity;
}
