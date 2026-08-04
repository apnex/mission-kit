import test from "node:test";
import {
  contextSelectorDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  sourceSnapshotDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed context closure cannot reorder two manifest selectors", async () => {
  const transaction = await loadCoreTransaction();
  const profile = transaction.byKind.get("AuthoringProfileManifest");
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  const closure = transaction.byKind.get("ContextClosure");
  const firstSelector = profile.spec.tasks[0].contextSelectors[0];
  const secondSelector = structuredClone(firstSelector);
  secondSelector.id = "brief-source-two";
  secondSelector.ordinal = 2;
  secondSelector.role = "secondary";
  secondSelector.selection.slot = "intake-two";
  secondSelector.selectorDigest = contextSelectorDigest(secondSelector);
  profile.spec.tasks[0].contextSelectors.push(secondSelector);

  const secondSource = structuredClone(closure.spec.layers[0].sourceSnapshot);
  secondSource.metadata.name = "brief-intake-two";
  secondSource.spec.provenance.sourceId = "brief-seed-two";
  secondSource.spec.provenance.revision = "2";
  secondSource.spec.sourceDigest = sourceSnapshotDigest(secondSource);
  const secondRecord = {
    reference: resourceReferenceFrom(secondSource),
    integrityDigest: resourceIntegrityDigest(secondSource),
    resource: structuredClone(secondSource)
  };
  transaction.values.push(secondSource);
  workspace.spec.resourceVersions.push(secondRecord);
  workspace.spec.activeHeads.push({
    slot: "intake-two",
    reference: structuredClone(secondRecord.reference)
  });

  const firstLayer = structuredClone(closure.spec.layers[0]);
  firstLayer.ordinal = 2;
  const secondLayer = {
    ...structuredClone(firstLayer),
    ordinal: 1,
    role: secondSelector.role,
    selectorId: secondSelector.id,
    selectorDigest: secondSelector.selectorDigest,
    requiredLifecycleState: secondSelector.requiredLifecycleState,
    sourceReference: structuredClone(secondRecord.reference),
    sourceIntegrityDigest: secondRecord.integrityDigest,
    sourceSnapshot: structuredClone(secondRecord.resource),
    selectedValue: { topic: "brief-two" },
    projectionDefinitionDigest: secondSelector.projection.digest
  };
  closure.spec.layers = [secondLayer, firstLayer];
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_AMBIENT_MISMATCH");
});
