function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function paths(...values) {
  if (new Set(values).size !== values.length) {
    throw new Error(
      "K13 authority and fixture paths must be unique",
    );
  }
  return Object.freeze([...values].sort(compareUtf8));
}

const runtimeAuthorities = paths(
  "schemas/authoring/v1alpha1/authoring-assignment.schema.json",
  "schemas/authoring/v1alpha1/authoring-commit-receipt.schema.json",
  "schemas/authoring/v1alpha1/authoring-journal-record.schema.json",
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-request.schema.json",
  "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace-effect.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "schemas/authoring/v1alpha1/projection-artifact.schema.json",
  "schemas/authoring/v1alpha1/resource-reference.schema.json",
  "schemas/authoring/v1alpha1/validation-issue.schema.json",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/runtime/commit-records.mjs",
  "source/authoring/runtime/journal-replay.mjs",
  "source/authoring/runtime/store-port.mjs",
  "source/authoring/runtime/workspace-application.mjs",
);

const inMemoryAuthorities = paths(
  ...runtimeAuthorities,
  "source/authoring/adapters/in-memory-store.mjs",
);

const transactionAuthorities = paths(
  ...runtimeAuthorities,
  "schemas/authoring/v1alpha1/authoring-form-definition.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/source-snapshot.schema.json",
  "source/authoring/kernel/assignment-dag.mjs",
  "source/authoring/kernel/context-resolver.mjs",
  "source/authoring/kernel/executable-registry.mjs",
  "source/authoring/kernel/manifest-reducer.mjs",
  "source/authoring/kernel/manifest-selection.mjs",
  "source/authoring/kernel/mutation-planner.mjs",
  "source/authoring/kernel/reducer-results.mjs",
  "source/authoring/kernel/request-planner.mjs",
  "source/authoring/kernel/resource-resolution.mjs",
  "source/authoring/kernel/text-forms.mjs",
  "source/authoring/runtime/transaction-resources.mjs",
);

const coordinatorAuthorities = paths(
  ...transactionAuthorities,
  "source/authoring/runtime/transaction-coordinator.mjs",
);

const commitSidecarAuthorities = paths(
  ...coordinatorAuthorities,
  "source/authoring/kernel/limits.mjs",
  "source/authoring/runtime/commit-sidecars.mjs",
);

const schemaClosureAuthorities = paths(
  "survey-v2.package.json",
  "schemas/authoring/v1alpha1/authoring-assignment.schema.json",
  "schemas/authoring/v1alpha1/authoring-commit-receipt.schema.json",
  "schemas/authoring/v1alpha1/authoring-form-definition.schema.json",
  "schemas/authoring/v1alpha1/authoring-journal-record.schema.json",
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/authoring-request.schema.json",
  "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace-effect.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "schemas/authoring/v1alpha1/projection-artifact.schema.json",
  "schemas/authoring/v1alpha1/resource-reference.schema.json",
  "schemas/authoring/v1alpha1/source-snapshot.schema.json",
  "schemas/authoring/v1alpha1/validation-issue.schema.json",
);

const coreFixtures = paths(
  "tests/authoring/persistence/core/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-assignment.json",
  "tests/fixtures/authoring/contracts/positive/authoring-mutation.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
);

const journalFixtures = paths(
  ...coreFixtures,
  "tests/authoring/journal/support.mjs",
  "tests/authoring/journal/transition-tamper-support.mjs",
);

const inMemoryFixtures = paths(
  "tests/authoring/persistence/in-memory/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
);

const transactionFixtures = paths(
  "tests/authoring/reducer/support.mjs",
  "tests/authoring/transactions/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-protocol.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
);

const coordinatorFixtures = paths(
  "tests/authoring/reducer/support.mjs",
  "tests/authoring/transactions/coordinator/driver-config.mjs",
  "tests/authoring/transactions/coordinator/drivers/driver-contract.mjs",
  "tests/authoring/transactions/coordinator/drivers/in-memory-driver.mjs",
  "tests/authoring/transactions/coordinator/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-protocol.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
  "tests/fixtures/authoring/contracts/positive/revision-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/runtime-protocol.json",
);

const commitSidecarFixtures = paths(
  ...coordinatorFixtures,
  "tests/authoring/transactions/commit-sidecars/support.mjs",
);

const workspaceEffectContractFixtures = paths(
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/fixtures/authoring/contracts/negative/authoring-workspace-effect.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace-effect.json",
);

const applicability = Object.freeze({
  pure: Object.freeze({
    mode: "not-applicable",
    transports: Object.freeze([]),
    adapters: Object.freeze([]),
  }),
  neutral: Object.freeze({
    mode: "agnostic",
    transports: Object.freeze([]),
    adapters: Object.freeze([
      "urn:mission-kit:survey-v2:adapter:in-memory",
    ]),
  }),
  inMemory: Object.freeze({
    mode: "specific",
    transports: Object.freeze([]),
    adapters: Object.freeze([
      "urn:mission-kit:survey-v2:adapter:in-memory",
    ]),
  }),
});

function surface(executable) {
  if (executable.endsWith(
    "/contracts/k13-schema-closure.test.mjs",
  )) {
    return {
      authorities: schemaClosureAuthorities,
      fixtures: paths(),
      applicability: applicability.pure,
    };
  }
  if (executable.includes(
    "/contracts/negative/authoring-workspace-effect.",
  ) || executable.includes(
    "/contracts/positive/authoring-workspace-effect.",
  )) {
    return {
      authorities: runtimeAuthorities,
      fixtures: workspaceEffectContractFixtures,
      applicability: applicability.pure,
    };
  }
  if (executable.startsWith(
    "tests/authoring/persistence/in-memory/",
  )) {
    return {
      authorities: inMemoryAuthorities,
      fixtures: inMemoryFixtures,
      applicability: applicability.inMemory,
    };
  }
  if (executable.startsWith(
    "tests/authoring/transactions/commit-sidecars/",
  )) {
    return {
      authorities: commitSidecarAuthorities,
      fixtures: commitSidecarFixtures,
      applicability: applicability.neutral,
    };
  }
  if (executable.startsWith(
    "tests/authoring/transactions/coordinator/",
  )) {
    return {
      authorities: coordinatorAuthorities,
      fixtures: coordinatorFixtures,
      applicability: applicability.neutral,
    };
  }
  if (executable.startsWith(
    "tests/authoring/transactions/",
  )) {
    return {
      authorities: transactionAuthorities,
      fixtures: transactionFixtures,
      applicability: applicability.pure,
    };
  }
  if (executable.startsWith(
    "tests/authoring/journal/",
  )) {
    return {
      authorities: runtimeAuthorities,
      fixtures: journalFixtures,
      applicability: applicability.pure,
    };
  }
  return {
    authorities: runtimeAuthorities,
    fixtures: coreFixtures,
    applicability: applicability.pure,
  };
}

function define(
  executable,
  invariantId,
  obligationId,
  evidenceClass,
  applicabilityOverride,
) {
  if (obligationId.split("-")[1] !== invariantId) {
    throw new Error(
      `${obligationId} does not belong to ${invariantId}`,
    );
  }
  const selected = surface(executable);
  return Object.freeze({
    executable,
    invariantId,
    obligationId,
    evidenceClass,
    authorities: selected.authorities,
    fixtures: selected.fixtures,
    applicability:
      applicabilityOverride ?? selected.applicability,
  });
}

function group(invariantId, firstOrdinal, cases) {
  return cases.map(
    ([executable, evidenceClass, applicabilityOverride], index) =>
      define(
        executable,
        invariantId,
        `O-${invariantId}-${String(
          firstOrdinal + index,
        ).padStart(2, "0")}`,
        evidenceClass,
        applicabilityOverride,
      ),
  );
}

export const k13Suite = Object.freeze([
  ...group("AS01", 4, [
    [
      "tests/authoring/persistence/core/neutral-import-closure.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/neutral-import-closure.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS03", 3, [
    [
      "tests/authoring/journal/terminal-workspace-closure.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/evidence-only-revision.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/open-assignment-post-image.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/receipt-single-revision-retention.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/semantic-transition-revision.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/machine-head-order.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS04", 12, [
    [
      "tests/authoring/transactions/coordinator/first-next-persistence.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/pending-next-read-only.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS07", 34, [
    [
      "tests/authoring/journal/outcome-closure.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/receipt-mutation-closure.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/assignment-issuance-dag.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/assignment-dag-retention.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS07", 42, [
    [
      "tests/authoring/transactions/coordinator/projector-dispatch-exact-view.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS08", 7, [
    [
      "tests/authoring/journal/evidence-plan-outcome-closure.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/idempotency-uniqueness.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/core/issuance-reauthorization-idempotency.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/ordered-duplicate-issues.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/rejected-zero-semantic-mutation.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/cancel-replay-reissue.test.mjs",
      "resume",
    ],
    [
      "tests/authoring/transactions/coordinator/concurrent-different-submit.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/concurrent-identical-submit.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/event-rejection-evidence-only.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/event-transition-replay.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/post-publish-ack-loss-replay.test.mjs",
      "failure-injection",
      applicability.inMemory,
    ],
    [
      "tests/authoring/transactions/coordinator/rejected-submission-evidence-only.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/rejection-correction-transition.test.mjs",
      "positive",
    ],
    [
      "tests/authoring/transactions/coordinator/stale-event-read-only.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/stale-submit-no-callback.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/submit-idempotent-replay.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/idempotent-command-contract.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/machine-qualified-idempotency-reuse-changed-payload-read-only.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS11", 17, [
    [
      "tests/authoring/persistence/core/active-head-post-image.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/dependency-edge-post-image.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/handoff-add.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/handoff-remove.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/handoff-replace.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/handoff-untouched-retention.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/history-append-post-image.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/supersession-disposition-authority.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS12", 1, [
    [
      "tests/authoring/persistence/in-memory/cold-rehydration.test.mjs",
      "resume",
    ],
    [
      "tests/authoring/transactions/coordinator/cold-coordinator-pending-reproduction.test.mjs",
      "resume",
    ],
    [
      "tests/authoring/transactions/pending-assignment-reproduction.test.mjs",
      "resume",
    ],
    [
      "tests/authoring/persistence/in-memory/authenticated-cold-rehydration.test.mjs",
      "resume",
    ],
  ]),
  ...group("AS12", 5, [
    [
      "tests/authoring/transactions/coordinator/projector-cold-divergence.test.mjs",
      "resume",
    ],
  ]),
  ...group("AS13", 27, [
    [
      "tests/authoring/transactions/handoff-authority-resolution.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/handoff-scope-replay.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS14", 48, [
    [
      "tests/authoring/journal/genesis-scope-authority.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/identity-async-refusal.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/identity-binding.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/identity-determinism.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/identity-longitudinal-determinism.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/identity-operation-capture.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/identity-throw-refusal.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/tamper-refusal.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/core/resource-version-immutability.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/accessor-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/alias-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/detached-snapshot.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/exact-token.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/immutable-input.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/initial-store-identity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/proxy-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/root-seal-tamper.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/sparse-array-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/stale-fence.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/trusted-input-capability-snapshot.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/inventory-reference-conflict.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/genesis-workspace-integrity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/workspace-ambient-root.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/store-operation-capture.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/contract-validator-thenable.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/genesis-open-assignment-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/workspace-collection-shape.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/store-operation-single-read.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/contracts/k13-schema-closure.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS14", 77, [
    [
      "tests/authoring/journal/record-authentication-capability.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/authenticated-root-reseal-refusal.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/authentication-key-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/authenticated-post-image-prepublish-refusal.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/authentication-key-ownership.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS14", 82, [
    [
      "tests/authoring/transactions/coordinator/profile-authority-read-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/protocol-authority-read-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/profile-authority-cancel-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/protocol-authority-cancel-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/profile-authority-pending-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/protocol-authority-pending-boundary.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS14", 88, [
    [
      "tests/authoring/persistence/in-memory/authentication-key-ownership.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/failed-initial-authentication-no-residue.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS14", 90, [
    [
      "tests/authoring/transactions/coordinator/projector-digest-mismatch-before-retention.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/projector-missing-before-retention.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS14", 94, [
    [
      "tests/authoring/transactions/coordinator/executable-registry-required-before-coordination.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/coordinator/executable-closure-preflight.test.mjs",
      "negative",
    ],
  ]),
  ...group("AS15", 22, [
    [
      "tests/authoring/journal/commit-id-uniqueness.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/coupled-all-or-none.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/evidence-plan-record-closure.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/evidence-zero-edges.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/machine-edge-k10-closure.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/ordered-refreeze-replay.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/journal/previous-chain-head.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/resulting-root-seal-exclusion.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/revision-continuity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/transition-edge-bundle.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/evidence-mutation-plan.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/receipt-construction.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/core/workspace-integrity-reseal.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/atomic-visibility.test.mjs",
      "positive",
    ],
    [
      "tests/authoring/persistence/in-memory/cas-conflict.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/crash-after-publish.test.mjs",
      "failure-injection",
    ],
    [
      "tests/authoring/persistence/in-memory/crash-before-publish.test.mjs",
      "failure-injection",
    ],
    [
      "tests/authoring/persistence/in-memory/replay-valid-post-image.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/single-use-writer.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/writer-exclusion.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/persistence/in-memory/writer-lifetime.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/coordinator/accepted-submit-atomic.test.mjs",
      "positive",
    ],
    [
      "tests/authoring/journal/open-assignment-effect.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/evidence-submission-integrity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/transition-created-resource-retention.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/transition-submission-integrity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/contracts/positive/authoring-workspace-effect.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/contracts/negative/authoring-workspace-effect.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/effect-record-partition.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/workspace-effect-exhaustiveness.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/mutation-expected-boundary.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/receipt-supersession-replay.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/journal/skipped-journal-record-ordinal-direct.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/persistence/in-memory/logical-crash-before-assembly-old-root.test.mjs",
      "failure-injection",
    ],
    [
      "tests/authoring/persistence/in-memory/logical-crash-during-assembly-old-root.test.mjs",
      "failure-injection",
    ],
  ]),
  ...group("AS15", 58, [
    [
      "tests/authoring/transactions/commit-sidecars/dedicated-dispatch.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/extra-resource-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/wrong-type-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/duplicate-resource-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/missing-executable-before-publish.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/digest-mismatch-before-publish.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/rejected-sidecar-atomicity.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/throwing-sidecar-atomicity.test.mjs",
      "failure-injection",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/async-sidecar-atomicity.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/same-commit-retention-replay.test.mjs",
      "conformance",
    ],
  ]),
  ...group("AS15", 70, [
    [
      "tests/authoring/transactions/commit-sidecars/event-sidecar-forbidden.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/per-binding-256-boundary.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/aggregate-transition-limit.test.mjs",
      "conformance",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/receipt-alias-rejection.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/cold-replay-created-alias.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/cold-replay-prior-alias.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/outcome-sidecar-missing.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/outcome-sidecar-added.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/outcome-sidecar-reordered.test.mjs",
      "negative",
    ],
    [
      "tests/authoring/transactions/commit-sidecars/cold-coordinator-exact-replay.test.mjs",
      "conformance",
    ],
  ]),
]);
