import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentDigest,
  commitReceiptDigest,
  contextClosureDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  projectionArtifactDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  recomputeWorkspace
} from "./support/transaction-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("workspace history resolves a second transaction chain without current-kind ambiguity", async () => {
  const transaction = await loadCoreTransaction();
  const currentClosure = transaction.byKind.get("ContextClosure");
  const currentRequest = transaction.byKind.get("AuthoringRequest");
  const currentProjection = transaction.byKind.get("ProjectionArtifact");
  const currentAssignment = transaction.byKind.get("AuthoringAssignment");
  const currentSubmission = transaction.byKind.get("AuthoringSubmission");
  const currentMutation = transaction.byKind.get("AuthoringMutation");
  const currentReceipt = transaction.byKind.get("AuthoringCommitReceipt");

  const historicalClosure = structuredClone(currentClosure);
  historicalClosure.metadata.name = "historical-context";
  historicalClosure.spec.closureDigest =
    contextClosureDigest(historicalClosure);

  const historicalRequest = structuredClone(currentRequest);
  historicalRequest.metadata.name = "historical-request";
  historicalRequest.spec.contextClosure = {
    reference: resourceReferenceFrom(historicalClosure),
    closureDigest: historicalClosure.spec.closureDigest
  };
  historicalRequest.spec.requestDigest = requestCoreDigest(historicalRequest);

  const historicalProjection = structuredClone(currentProjection);
  historicalProjection.metadata.name = "historical-projection";
  const closureSource = historicalProjection.spec.sources.find(
    ({ reference }) => reference.kind === "ContextClosure"
  );
  closureSource.reference = resourceReferenceFrom(historicalClosure);
  closureSource.integrityDigest =
    resourceIntegrityDigest(historicalClosure);
  historicalProjection.spec.projectionArtifactDigest =
    projectionArtifactDigest(historicalProjection);

  const historicalAssignment = structuredClone(currentAssignment);
  historicalAssignment.metadata.name = "historical-assignment";
  historicalAssignment.spec.request = {
    reference: resourceReferenceFrom(historicalRequest),
    requestDigest: historicalRequest.spec.requestDigest
  };
  historicalAssignment.spec.projectionArtifact = {
    reference: resourceReferenceFrom(historicalProjection),
    projectionArtifactDigest:
      historicalProjection.spec.projectionArtifactDigest
  };
  historicalAssignment.spec.assignmentDigest =
    assignmentDigest(historicalAssignment);

  const historicalSubmission = structuredClone(currentSubmission);
  historicalSubmission.metadata.name = "historical-submission";
  historicalSubmission.spec.assignment = {
    reference: resourceReferenceFrom(historicalAssignment),
    assignmentDigest: historicalAssignment.spec.assignmentDigest
  };
  historicalSubmission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(historicalSubmission);

  const historicalMutation = structuredClone(currentMutation);
  historicalMutation.metadata.name = "historical-mutation";
  historicalMutation.spec.cause.assignment = {
    reference: resourceReferenceFrom(historicalAssignment),
    assignmentDigest: historicalAssignment.spec.assignmentDigest
  };
  historicalMutation.spec.cause.submission = {
    reference: resourceReferenceFrom(historicalSubmission),
    normalizedSubmissionDigest:
      historicalSubmission.spec.normalizedSubmissionDigest
  };
  historicalMutation.spec.mutationDigest = mutationDigest(historicalMutation);

  const historicalReceipt = structuredClone(currentReceipt);
  historicalReceipt.metadata.name = "historical-receipt";
  historicalReceipt.spec.cause =
    structuredClone(historicalMutation.spec.cause);
  historicalReceipt.spec.mutation = {
    reference: resourceReferenceFrom(historicalMutation),
    mutationDigest: historicalMutation.spec.mutationDigest
  };
  historicalReceipt.spec.receiptDigest =
    commitReceiptDigest(historicalReceipt);
  transaction.values.push(
    historicalClosure,
    historicalRequest,
    historicalProjection,
    historicalAssignment,
    historicalSubmission,
    historicalMutation,
    historicalReceipt
  );
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  workspace.spec.history.push(resourceReferenceFrom(historicalReceipt));
  recomputeWorkspace(workspace);
  assert.deepEqual(transactionIssues(transaction), []);
});
