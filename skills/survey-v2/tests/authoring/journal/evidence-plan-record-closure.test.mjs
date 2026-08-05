import assert from "node:assert/strict";
import test from "node:test";
import {
  assembleJournalRecord,
  evidenceMutationDigest,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("an evidence record cannot bind a plan from a foreign journal head", () => {
  const scenario = makeEvidenceJournalScenario();
  const plan = structuredClone(scenario.plan);
  plan.priorJournalHeadDigest = `sha256:${"f".repeat(64)}`;
  plan.mutationDigest = evidenceMutationDigest(plan);
  const record = scenario.record;

  assert.equal(errorCode(() => assembleJournalRecord({
    journal: [],
    genesisChainDigest:
      scenario.identity.identity.genesisChainDigest(),
    genesisRevisionState: scenario.genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      scenario.identity.identity
        .genesisWorkspaceIntegrityDigest,
    commitId: record.commitId,
    commitKind: record.commitKind,
    actor: record.actor,
    authority: record.authority,
    idempotency: record.idempotency,
    commandDigest: record.commandDigest,
    payloadDigest: record.payloadDigest,
    before: record.before,
    after: record.after,
    beforeWorkspaceIntegrityDigest:
      record.beforeWorkspaceIntegrityDigest,
    afterWorkspaceIntegrityDigest:
      record.afterWorkspaceIntegrityDigest,
    workspaceEffect: record.workspaceEffect,
    mutationDigest: plan.mutationDigest,
    machineEdges: [],
    evidencePlan: plan,
  }, scenario.identity.identity)),
  "EVIDENCE_COMMIT_PLAN_RECORD_MISMATCH");
});
