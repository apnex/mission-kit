import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  createEvidenceCommitPlan,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  journalRecordDigest,
  rawEvidenceDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";

function only(values, predicate, label) {
  const matches = values.filter(predicate);
  if (matches.length !== 1) {
    throw new TypeError(
      `${label} requires exactly one match; observed ${matches.length}`,
    );
  }
  return matches[0];
}

function retainedVersionsForEffect(workspace, effect) {
  const byReference = new Map(
    workspace.spec.resourceVersions.map(
      (stored) => [canonicalize(stored.reference), stored],
    ),
  );
  return effect.retainedResources.map((binding, index) => {
    const stored = byReference.get(
      canonicalize(binding.reference),
    );
    if (stored === undefined) {
      throw new TypeError(
        `workspaceEffect.retainedResources[${index}] is unresolved`,
      );
    }
    return stored;
  });
}

/**
 * Model a storage-only attacker that can rewrite and publicly rehash every
 * descendant of raw Submission evidence, but cannot invoke the configured
 * JournalIdentityPort's private authentication capability.
 */
export function fullyResealRawSubmissionRewrite(
  snapshot,
  rawEvidenceBytes,
) {
  if (!(rawEvidenceBytes instanceof Uint8Array)) {
    throw new TypeError(
      "rawEvidenceBytes must be supplied as exact bytes",
    );
  }
  const workspaceValue = structuredClone(snapshot.workspace);
  const journal = structuredClone(snapshot.journal);
  const idempotencyOutcomeView = structuredClone(
    snapshot.idempotencyOutcomeView,
  );
  const record = journal.at(-1);
  const outcomeEntry = idempotencyOutcomeView.at(-1);
  const storedSubmission = only(
    workspaceValue.spec.resourceVersions,
    ({ resource }) => resource.kind === "AuthoringSubmission",
    "terminal Workspace",
  );
  const original = {
    authenticationDigest: record.authenticationDigest,
    mutationDigest: record.mutationDigest,
    recordDigest: record.recordDigest,
    resourceIntegrityDigest: storedSubmission.integrityDigest,
    resourceReference: structuredClone(storedSubmission.reference),
    workspaceIntegrityDigest:
      workspaceValue.spec.integrity.workspaceIntegrityDigest,
  };
  const bytes = Buffer.from(
    rawEvidenceBytes.buffer,
    rawEvidenceBytes.byteOffset,
    rawEvidenceBytes.byteLength,
  );

  storedSubmission.resource.evidence.rawEvidence.content = {
    mediaType: "text/plain;charset=utf-8",
    encoding: "base64",
    byteLength: bytes.byteLength,
    data: bytes.toString("base64"),
  };
  storedSubmission.resource.evidence.rawEvidence.rawEvidenceDigest =
    rawEvidenceDigest(bytes);
  storedSubmission.reference =
    resourceReferenceFrom(storedSubmission.resource);
  storedSubmission.integrityDigest =
    resourceIntegrityDigest(storedSubmission.resource);

  const submissionEffect = only(
    record.workspaceEffect.retainedResources,
    ({ reference }) =>
      reference.kind === "AuthoringSubmission",
    "terminal JournalRecord WorkspaceEffect",
  );
  submissionEffect.reference =
    structuredClone(storedSubmission.reference);
  submissionEffect.integrityDigest =
    storedSubmission.integrityDigest;
  record.workspaceEffect.historyReferences =
    record.workspaceEffect.historyReferences.map((reference) =>
      reference.kind === "AuthoringSubmission"
        ? structuredClone(storedSubmission.reference)
        : reference);

  let evidencePlan;
  if (record.commitKind === "evidence") {
    evidencePlan = createEvidenceCommitPlan({
      priorJournalHeadDigest: record.previousSealDigest,
      idempotency: record.idempotency,
      commandDigest: record.commandDigest,
      payloadDigest: record.payloadDigest,
      before: record.before,
      after: record.after,
      retainedResourceVersions: retainedVersionsForEffect(
        workspaceValue,
        record.workspaceEffect,
      ),
      openAssignment: record.workspaceEffect.openAssignment,
      outcome: outcomeEntry.outcome,
    });
    record.mutationDigest = evidencePlan.mutationDigest;
  }

  const workspace = resealWorkspace(workspaceValue);
  record.afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;

  // Deliberately retain authenticationDigest: it is not a public hash and
  // cannot be recomputed by this attacker. The public JournalRecord seal and
  // its public outcome pointer can both still be recomputed.
  record.recordDigest = journalRecordDigest(record);
  outcomeEntry.recordDigest = record.recordDigest;

  return {
    evidencePlan,
    idempotencyOutcomeView,
    journal,
    original,
    record,
    storedSubmission,
    workspace,
  };
}
