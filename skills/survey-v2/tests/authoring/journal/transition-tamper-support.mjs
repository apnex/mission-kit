import {
  commitReceiptDigest,
  mutationDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import { rehashRecord } from "./support.mjs";

function replaceReference(values, before, after) {
  return values.map((value) =>
    JSON.stringify(value) === JSON.stringify(before)
      ? structuredClone(after)
      : value);
}

function refreshStored(stored) {
  stored.reference = resourceReferenceFrom(stored.resource);
  stored.integrityDigest = resourceIntegrityDigest(stored.resource);
}

function replaceEffectBinding(effect, before, stored) {
  const binding = effect.retainedResources.find(
    (candidate) =>
      JSON.stringify(candidate.reference) === JSON.stringify(before),
  );
  binding.reference = structuredClone(stored.reference);
  binding.integrityDigest = stored.integrityDigest;
  effect.historyReferences = replaceReference(
    effect.historyReferences,
    before,
    stored.reference,
  );
}

export function rewriteTransitionAncestry(
  scenario,
  {
    mutateMutation = () => {},
    mutateReceipt = () => {},
  } = {},
) {
  const workspaceValue = structuredClone(scenario.workspace);
  const journal = structuredClone(scenario.journal);
  const outcomes = structuredClone(scenario.outcomes);
  const effect = journal[1].workspaceEffect;
  const mutationStored = workspaceValue.spec.resourceVersions.find(
    ({ resource }) => resource.kind === "AuthoringMutation",
  );
  const receiptStored = workspaceValue.spec.resourceVersions.find(
    ({ resource }) => resource.kind === "AuthoringCommitReceipt",
  );

  const priorMutationReference =
    structuredClone(mutationStored.reference);
  mutateMutation(mutationStored.resource);
  mutationStored.resource.spec.mutationDigest =
    mutationDigest(mutationStored.resource);
  refreshStored(mutationStored);
  workspaceValue.spec.history = replaceReference(
    workspaceValue.spec.history,
    priorMutationReference,
    mutationStored.reference,
  );
  replaceEffectBinding(
    effect,
    priorMutationReference,
    mutationStored,
  );
  journal[1].mutationDigest =
    mutationStored.resource.spec.mutationDigest;

  const priorReceiptReference =
    structuredClone(receiptStored.reference);
  receiptStored.resource.spec.mutation = {
    reference: structuredClone(mutationStored.reference),
    mutationDigest: mutationStored.resource.spec.mutationDigest,
  };
  mutateReceipt(receiptStored.resource);
  receiptStored.resource.spec.receiptDigest =
    commitReceiptDigest(receiptStored.resource);
  refreshStored(receiptStored);
  workspaceValue.spec.history = replaceReference(
    workspaceValue.spec.history,
    priorReceiptReference,
    receiptStored.reference,
  );
  replaceEffectBinding(
    effect,
    priorReceiptReference,
    receiptStored,
  );
  outcomes[1].outcome.receipt = {
    reference: structuredClone(receiptStored.reference),
    receiptDigest: receiptStored.resource.spec.receiptDigest,
  };

  const workspace = resealWorkspace(workspaceValue);
  journal[1].afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  rehashRecord(journal[1], scenario.identity.identity);
  outcomes[1].recordDigest = journal[1].recordDigest;
  return { workspace, journal, idempotencyOutcomeView: outcomes };
}
