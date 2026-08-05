import assert from "node:assert/strict";
import test from "node:test";
import {
  commitReceiptDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("replay rejects a self-consistent Receipt that changes Mutation ancestry", () => {
  const scenario = appendTransitionScenario();
  const workspace = structuredClone(scenario.workspace);
  const outcomes = structuredClone(scenario.outcomes);
  const retained = workspace.spec.resourceVersions.find(
    (record) => record.resource.kind === "AuthoringCommitReceipt",
  );
  retained.resource.spec.createdResources = [];
  retained.resource.spec.receiptDigest =
    commitReceiptDigest(retained.resource);
  retained.reference = resourceReferenceFrom(retained.resource);
  retained.integrityDigest = resourceIntegrityDigest(retained.resource);
  workspace.spec.history = workspace.spec.history.map((reference) =>
    reference.kind === "AuthoringCommitReceipt"
      ? retained.reference
      : reference);
  outcomes[1].outcome.receipt = {
    reference: retained.reference,
    receiptDigest: retained.resource.spec.receiptDigest,
  };
  const resealed = resealWorkspace(workspace);
  const journal = structuredClone(scenario.journal);
  const receiptEffect = journal[1].workspaceEffect.retainedResources.find(
    (binding) =>
      binding.reference.kind === "AuthoringCommitReceipt",
  );
  receiptEffect.reference = structuredClone(retained.reference);
  receiptEffect.integrityDigest = retained.integrityDigest;
  journal[1].workspaceEffect.historyReferences =
    journal[1].workspaceEffect.historyReferences.map(
      (reference) =>
        reference.kind === "AuthoringCommitReceipt"
          ? structuredClone(retained.reference)
          : reference,
    );
  journal[1].afterWorkspaceIntegrityDigest =
    resealed.spec.integrity.workspaceIntegrityDigest;
  rehashRecord(journal[1], scenario.identity.identity);
  outcomes[1].recordDigest = journal[1].recordDigest;

  assert.equal(errorCode(() => replayScenario(scenario, {
    workspace: resealed,
    journal,
    idempotencyOutcomeView: outcomes,
  })), "JOURNAL_OUTCOME_TRANSITION_MISMATCH");
});
