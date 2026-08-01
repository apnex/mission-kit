import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assertNoSymlinkAncestors,
  atomicCreateOnce,
  exists,
  readJsonFile,
  resolveContained,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  deepCloneCanonical,
} from "../engine/canonical-json.mjs";
import {
  ConflictError,
  IntegrityError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";
import { LifecycleEngine } from "../engine/lifecycle-engine.mjs";
import {
  AuthorityReceiptVerifier,
  requestExternalAuthorityReceipts,
} from "../engine/authority-receipts.mjs";
import {
  sealAnalysisResult,
  sealRecommendation,
} from "../statistics/facades.mjs";

export const NO_PROVIDER_CAMPAIGN_TRANSITIONS = Object.freeze([
  "EC01",
  "EC03a",
  "EC04",
  "EC06",
  "EC08",
  "EC09",
  "EC11",
  "EC13",
  "EC32",
  "EC14",
  "EC15",
  "EC16",
  "EC18",
  "EC35",
  "EC33",
  "EC20",
  "EC21",
  "EC22",
  "EC38",
  "EC23",
]);

function artifactDigest(tag, value) {
  return hashCanonical(tag, value);
}

async function publishJson(workspaceRoot, relativePath, value) {
  const path = resolveContained(workspaceRoot, relativePath);
  await assertNoSymlinkAncestors(workspaceRoot, path);
  await mkdir(resolve(path, ".."), { recursive: true, mode: 0o750 });
  await assertNoSymlinkAncestors(workspaceRoot, path);
  const outcome = await atomicCreateOnce(path, canonicalBytes(value));
  return { replayed: !outcome.created, path, value };
}

function noProviderEnvelope(campaignId, seal, revision) {
  const root = (tag, payload = {}) =>
    artifactDigest(tag, {
      campaignId,
      sealDigest: seal.sealDigest,
      ...payload,
    });
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignEvidenceEnvelopeId: `${campaignId}:synthetic-envelope`,
    campaignId,
    frozenAtCampaignRevision: revision,
    frozenBeforeTransition: "EC20",
    allAssignedPopulationRoot: root("all-assigned-population/v1", {
      assignedCount: 0,
    }),
    instrumentValidPopulationRoot: root("instrument-valid-population/v1", {
      validCount: 0,
    }),
    releaseQualifiedPopulationRoot: root("release-qualified-population/v1", {
      qualifiedCount: 0,
    }),
    roleContentEvidenceRoot: root("role-content-evidence/v1", {
      resultCount: 0,
    }),
    awarenessUniverseRoot: root("awareness-universe/v1", {
      expectedObligations: [],
    }),
    closedAwarenessLedgerRoot: root("closed-awareness-ledger/v1", {
      obligations: [],
    }),
    awarenessDispositionCounts: {
      reported: 0,
      missingAfterContent: 0,
      missingNoContent: 0,
      notApplicable: 0,
    },
    qualificationViewRoots: [
      root("qualification-view/v1", { view: "all_assigned" }),
      root("qualification-view/v1", { view: "instrument_valid" }),
      root("qualification-view/v1", { view: "release_qualified" }),
    ],
    protectedSourceIndexRoot: root("protected-source-index/v1", {
      entries: [],
    }),
    derivationRoots: [],
    disclosurePolicyDigest: root("disclosure-policy/v1", {
      mode: "no_provider",
    }),
    disclosureRecipeDigest: root("disclosure-recipe/v1", {
      mode: "no_provider",
    }),
    disclosureSourceFieldMapDigest: root("disclosure-field-map/v1", {
      fields: [],
    }),
    immutable: true,
    containsProtectedUnmaskGrant: false,
    containsDisclosureOutputDigest: false,
    containsFutureTransitionReference: false,
  };
}

function noProviderAnalysis({
  campaignId,
  analysisPlan,
  envelope,
  grantDigest,
  softwareDigest,
}) {
  return sealAnalysisResult({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    analysisResultId: `${campaignId}:synthetic-analysis`,
    analysisPlanDigest: artifactDigest("analysis-plan/v1", analysisPlan),
    campaignEvidenceEnvelopeDigest: artifactDigest(
      "campaign-evidence-envelope/v1",
      envelope,
    ),
    protectedUnmaskGrantDigest: grantDigest,
    dependencePlanDigest: analysisPlan.dependencePlanDigest,
    softwareDigest,
    populationViews: [
      {
        populationClass: "all_assigned",
        assignmentCount: 0,
        observedCount: 0,
        missingCount: 0,
        failureCount: 0,
        contaminationCount: 0,
        denominatorDigest: envelope.allAssignedPopulationRoot,
      },
      {
        populationClass: "instrument_valid",
        assignmentCount: 0,
        observedCount: 0,
        missingCount: 0,
        failureCount: 0,
        contaminationCount: 0,
        denominatorDigest: envelope.instrumentValidPopulationRoot,
      },
      {
        populationClass: "release_eligible",
        assignmentCount: 0,
        observedCount: 0,
        missingCount: 0,
        failureCount: 0,
        contaminationCount: 0,
        denominatorDigest: envelope.releaseQualifiedPopulationRoot,
      },
    ],
    metricResults: [],
    effects: [],
    multiplicityResult: {
      procedure: analysisPlan.multiplicity.procedure,
      strongFwerControlled: false,
      adjustedFindingIds: [],
    },
    missingnessResults: [],
    ranking: {
      nonDominatedCandidateIds: [],
      candidateRankResults: [],
      totalOrderSupported: false,
    },
    attention: {
      toilResultIds: [],
      protectedLearningResultIds: [],
      directorJudgmentResultIds: [],
      unresolvedObservationIds: [],
      protectedLearningCanWorsenSelection: false,
    },
    sensitivityResultIds: [],
    derivationRecordDigests: [],
    campaignLineageDisclosureDigest: null,
  });
}

function noProviderRecommendation(campaignId, analysisPlan, analysis) {
  const analysisResultDigest = artifactDigest(
    "analysis-result/v1",
    analysis,
  );
  return sealRecommendation({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    recommendationId: `${campaignId}:synthetic-recommendation`,
    analysisResultDigest,
    recommendationPolicyDigest: analysisPlan.recommendationPolicyDigest,
    class: "insufficient_or_invalid_evidence",
    supportedClaimIds: [],
    dimensionalResultIds: [],
    guardrailIds: analysisPlan.ranking.guardrailIds,
    limitationIds: ["no_provider_no_live_subject_execution"],
    sensitivityResultIds: [],
    attentionProof: {
      toilOnlyAdverse: true,
      learningInvestmentAdverse: false,
      directorJudgmentAdverse: false,
      unresolvedAttentionExcluded: true,
    },
    policyClauses: [
      {
        clauseId: "live_subject_evidence_required",
        passed: false,
        evidenceRefs: [analysisResultDigest],
      },
    ],
    promotionAuthorized: false,
  });
}

function noProviderLineage({
  campaignId,
  analysisPlan,
  envelope,
  grantDigest,
  analysis,
  recommendation,
}) {
  const analysisResultDigest = artifactDigest("analysis-result/v1", analysis);
  const recommendationDigest = artifactDigest(
    "campaign-recommendation/v1",
    recommendation,
  );
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignLineageDisclosureId: `${campaignId}:synthetic-lineage`,
    campaignId,
    confirmatoryFamilyId: analysisPlan.multiplicity.familyId,
    familyOrdinal: 1,
    analysisResultDigest,
    campaignEvidenceEnvelopeDigest: artifactDigest(
      "campaign-evidence-envelope/v1",
      envelope,
    ),
    protectedUnmaskGrantDigest: grantDigest,
    disclosurePolicyDigest: envelope.disclosurePolicyDigest,
    disclosureRecipeDigest: envelope.disclosureRecipeDigest,
    allowedFieldRoot: artifactDigest(
      "campaign-lineage-allowed-fields/v1",
      {
        fields: [
          "analysisResultDigest",
          "campaignEvidenceEnvelopeDigest",
          "recommendationClass",
          "promotionAuthorized",
        ],
      },
    ),
    boundedAggregatesRoot: artifactDigest(
      "campaign-lineage-bounded-aggregates/v1",
      { analysisResultDigest, recommendationDigest },
    ),
    limitsRoot: artifactDigest("campaign-lineage-limits/v1", {
      evidenceClass: "synthetic_no_provider",
      promotionAuthorized: false,
      releaseAuthority: false,
    }),
    envelopeBoundOneWay: true,
    participantArmMapIncluded: false,
    rawRoleContentIncluded: false,
    releaseAuthority: false,
  };
}

export class DeterministicNoProviderCampaignDriver {
  constructor({
    crashAfterTransitionId = null,
    authorityTrustRoot = null,
    authorityReceiptProvider = null,
  } = {}) {
    this.crashAfterTransitionId = crashAfterTransitionId;
    this.crashInjected = false;
    this.authorityTrustRoot = authorityTrustRoot;
    this.authorityReceiptProvider = authorityReceiptProvider;
  }

  async advance({
    mode,
    validation,
    registry,
    schemaValidator,
    stateStore,
    packageRoot,
    workspaceRoot,
  }) {
    const seal = await readJsonFile(
      resolveContained(workspaceRoot, ".evaluator", "campaign-seal.json"),
    );
    const campaignId = validation.campaignId;
    const input = await readJsonFile(
      resolveContained(workspaceRoot, "campaign-input.json"),
    );
    const analysisPlan = await readJsonFile(
      resolveContained(workspaceRoot, input.analysisPlanRef),
    );
    const packageManifest = await readJsonFile(
      resolveContained(packageRoot, "package.manifest.json"),
    );
    const softwareDigest = packageManifest.payloadRoot;
    const resultsRoot = resolveContained(workspaceRoot, "results");
    await mkdir(resultsRoot, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(workspaceRoot, resultsRoot);

    const grantDigest = artifactDigest("protected-unmask-grant/v1", {
      campaignId,
      class: "synthetic_no_provider",
      sealDigest: seal.sealDigest,
    });
    let envelope = (await exists(
      resolveContained(workspaceRoot, "results/campaign-evidence-envelope.json"),
    ))
      ? await readJsonFile(
          resolveContained(
            workspaceRoot,
            "results/campaign-evidence-envelope.json",
          ),
        )
      : null;
    let analysis = (await exists(
      resolveContained(workspaceRoot, "results/analysis-result.json"),
    ))
      ? await readJsonFile(
          resolveContained(workspaceRoot, "results/analysis-result.json"),
        )
      : null;
    let recommendation = (await exists(
      resolveContained(workspaceRoot, "results/recommendation.json"),
    ))
      ? await readJsonFile(
          resolveContained(workspaceRoot, "results/recommendation.json"),
        )
      : null;
    let lineage = null;
    const actionHandlers = {
      "apply-sealed-campaign-policy": async ({ transition }) => ({
        core: {
          action: "apply-sealed-campaign-policy",
          transitionId: transition.transitionId,
          sealDigest: seal.sealDigest,
          syntheticNoProvider: true,
        },
      }),
      "commit-state-outbox": async ({ transition }) => ({
        core: {
          action: "commit-state-outbox",
          transitionId: transition.transitionId,
          syntheticNoProvider: true,
        },
      }),
      "reconcile-exact-awareness-universe": async ({ current }) => {
        envelope ??= noProviderEnvelope(
          campaignId,
          seal,
          current.authoritativeStateCore.semanticState.revision,
        );
        schemaValidator.assert("campaign-evidence-envelope", envelope);
        await publishJson(
          workspaceRoot,
          "results/campaign-evidence-envelope.json",
          envelope,
        );
        return {
          core: {
            action: "reconcile-exact-awareness-universe",
            envelopeDigest: artifactDigest(
              "campaign-evidence-envelope/v1",
              envelope,
            ),
            expectedObligations: 0,
          },
        };
      },
      "commit-one-analyst-grant": async () => ({
        core: {
          action: "commit-one-analyst-grant",
          grantClass: "synthetic_no_provider",
          protectedUnmaskGrantDigest: grantDigest,
        },
      }),
      "execute-registered-analysis": async () => {
        if (!envelope) {
          throw new IntegrityError(
            "Synthetic analysis cannot precede its frozen evidence envelope",
          );
        }
        analysis ??= noProviderAnalysis({
          campaignId,
          analysisPlan,
          envelope,
          grantDigest,
          softwareDigest,
        });
        schemaValidator.assert("analysis-result", analysis);
        await publishJson(workspaceRoot, "results/analysis-result.json", analysis);
        return {
          core: {
            action: "execute-registered-analysis",
            analysisResultDigest: artifactDigest(
              "analysis-result/v1",
              analysis,
            ),
          },
        };
      },
      "seal-output-first-derivations": async () => ({
        core: {
          action: "seal-output-first-derivations",
          derivationCount: 0,
          reason: "no_provider",
        },
      }),
      "apply-governed-recommendation-policy": async () => {
        if (!analysis) {
          throw new IntegrityError(
            "Synthetic recommendation cannot precede analysis",
          );
        }
        recommendation ??= noProviderRecommendation(
          campaignId,
          analysisPlan,
          analysis,
        );
        return {
          core: {
            action: "apply-governed-recommendation-policy",
            class: recommendation.class,
            promotionAuthorized: false,
          },
        };
      },
      "render-no-promotion-recommendation": async () => {
        if (!recommendation) {
          throw new IntegrityError(
            "Synthetic recommendation policy has not been applied",
          );
        }
        schemaValidator.assert("recommendation", recommendation);
        await publishJson(
          workspaceRoot,
          "results/recommendation.json",
          recommendation,
        );
        return {
          core: {
            action: "render-no-promotion-recommendation",
            recommendationDigest: artifactDigest(
              "campaign-recommendation/v1",
              recommendation,
            ),
            promotionAuthorized: false,
          },
        };
      },
      "verify-complete-pre-handoff-roots": async () => {
        if (
          !(await exists(
            resolveContained(workspaceRoot, "results/recommendation.json"),
          ))
        ) {
          throw new IntegrityError(
            "Synthetic handoff cannot precede recommendation sealing",
          );
        }
        lineage ??= noProviderLineage({
          campaignId,
          analysisPlan,
          envelope,
          grantDigest,
          analysis,
          recommendation,
        });
        schemaValidator.assert("campaign-lineage-disclosure", lineage);
        await publishJson(
          workspaceRoot,
          "results/campaign-lineage-disclosure.json",
          lineage,
        );
        return {
          core: {
            action: "verify-complete-pre-handoff-roots",
            lineageDigest: artifactDigest(
              "campaign-lineage-disclosure/v1",
              lineage,
            ),
            liveAuthorityClaimed: false,
          },
        };
      },
    };

    const guards = {};
    const actions = {};
    const mutations = {};
    for (const transitionId of NO_PROVIDER_CAMPAIGN_TRANSITIONS) {
      const transition = registry.transition(transitionId);
      guards[transition.guardId] = ({ command }) => ({
        pass:
          command.input?.sealDigest === seal.sealDigest &&
          command.input?.executionClass === "synthetic_no_provider",
        checkedSealDigest: seal.sealDigest,
        executionClass: "synthetic_no_provider",
      });
      mutations[transition.mutationId] = ({
        currentData,
      }) => ({
        ...currentData,
        unmaskStatus:
          transitionId === "EC20"
            ? "unmasked_for_registered_analysis"
            : currentData.unmaskStatus,
      });
      const pipeline = registry.actionPipeline(transition.actionPipelineId);
      for (const descriptor of pipeline.actions) {
        const actionId =
          typeof descriptor === "string" ? descriptor : descriptor.actionId;
        const handler = actionHandlers[actionId];
        if (!handler) {
          throw new IntegrityError(
            "No deterministic implementation exists for a canonical campaign action",
            { transitionId, actionId },
          );
        }
        actions[actionId] = handler;
      }
    }
    const engine = new LifecycleEngine({
      registry,
      stateStore,
      authorityReceiptVerifier: new AuthorityReceiptVerifier({
        trustRoot: this.authorityTrustRoot,
        schemaValidator,
      }),
      guards,
      actions,
      mutations,
    });

    let state = await stateStore.load("campaign", campaignId, {
      required: true,
    });
    const completed = new Set(
      state.authoritativeStateCore.eventLedger.map(
        (event) => event.core.transitionId,
      ),
    );
    const committedThisAdvance = [];
    for (const transitionId of NO_PROVIDER_CAMPAIGN_TRANSITIONS) {
      if (completed.has(transitionId)) continue;
      state = await stateStore.load("campaign", campaignId, { required: true });
      const transition = registry.transition(transitionId);
      if (
        (state.authoritativeStateCore.semanticState.state ??
          state.authoritativeStateCore.semanticState.semantic?.state) !==
        transition.fromState
      ) {
        throw new ConflictError(
          "Cold recovery found a state outside the no-provider campaign plan",
          {
            transitionId,
            expectedState: transition.fromState,
            actualState:
              state.authoritativeStateCore.semanticState.state ??
              state.authoritativeStateCore.semanticState.semantic?.state,
          },
        );
      }
      const policy = registry.participantPolicy(
        transition.participantPolicyId,
      );
      const input = {
        executionClass: "synthetic_no_provider",
        sealDigest: seal.sealDigest,
        transitionId,
        provisionalOnly: true,
        promotionAuthorized: false,
      };
      const command = {
        machineId: "campaign",
        objectId: campaignId,
        transitionId,
        expectedRevision:
          state.authoritativeStateCore.semanticState.revision,
        participantPolicyId: transition.participantPolicyId,
        participantPolicyDigest: registry.participantPolicyDigest(
          transition.participantPolicyId,
        ),
        idempotencyKey: `${campaignId}/${transitionId}/synthetic-v1`,
        input,
        inputDigest: hashCanonical("campaign-transition-input/v1", input),
        parentOrderId: `${campaignId}:sealed-plan`,
        parentFence: 0,
      };
      command.authorizationReceipts =
        await requestExternalAuthorityReceipts({
          provider: this.authorityReceiptProvider,
          policy,
          command,
          machineId: "campaign",
          participantPolicyDigest: command.participantPolicyDigest,
        });
      const result = await engine.execute(command);
      committedThisAdvance.push(result);
      completed.add(transitionId);
      if (
        this.crashAfterTransitionId === transitionId &&
        !this.crashInjected
      ) {
        this.crashInjected = true;
        throw new ConflictError("Injected crash after durable campaign commit", {
          transitionId,
          revision: result.revision,
        });
      }
    }

    state = await stateStore.load("campaign", campaignId, { required: true });
    return {
      executionClass: "synthetic_no_provider",
      assuranceLevel: "provisional_synthetic_only",
      liveAuthorityClaimed: false,
      mode,
      campaignId,
      state:
        state.authoritativeStateCore.semanticState.state ??
        state.authoritativeStateCore.semanticState.semantic?.state,
      revision: state.authoritativeStateCore.semanticState.revision,
      authoritativeStateRoot: state.authoritativeStateRoot,
      committedTransitions: committedThisAdvance.map(
        (result) => result.transitionId,
      ),
      promotionAuthorized: false,
    };
  }
}
