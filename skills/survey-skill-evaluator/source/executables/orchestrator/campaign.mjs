import { mkdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import {
  assertNoSymlinkAncestors,
  atomicCreateOnce,
  exists,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
  rawSha256,
} from "../engine/hash.mjs";
import {
  ConflictError,
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import { LifecycleRegistry } from "../engine/lifecycle-registry.mjs";
import { SchemaValidator } from "../engine/schema-validator.mjs";
import { StateStore } from "../engine/state-store.mjs";
import { RuntimeProductStateValidator } from "../engine/product-state-validator.mjs";
import { DeterministicNoProviderCampaignDriver } from "./deterministic-driver.mjs";
import {
  captureCandidatePackage,
  validateCandidateSnapshot,
} from "./candidate-capture.mjs";
import { validateClaimContrast } from "./claim-contrast.mjs";

const CAMPAIGN_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;

function assertCampaignInput(input) {
  if (
    input?.schemaVersion !== "1.0.0" ||
    input?.hashProfileId !== HASH_PROFILE_ID ||
    typeof input.campaignId !== "string" ||
    !CAMPAIGN_ID.test(input.campaignId) ||
    input.promotionAuthorized !== false ||
    !Array.isArray(input.arms) ||
    input.arms.length < 2 ||
    !Array.isArray(input.claims) ||
    input.claims.length < 1 ||
    !Array.isArray(input.scenarioRefs) ||
    input.scenarioRefs.length < 1 ||
    typeof input.analysisPlanRef !== "string" ||
    typeof input.dependencePlanRef !== "string" ||
    typeof input.stoppingRuleRef !== "string"
  ) {
    throw new ValidationError(
      "Campaign input is incomplete or violates the no-promotion boundary",
    );
  }
  const armIds = new Set();
  for (const arm of input.arms) {
    if (
      !arm ||
      typeof arm !== "object" ||
      Array.isArray(arm) ||
      Object.keys(arm).sort().join(",") !==
        "armId,conditionClass,environmentDigest,snapshotRef" ||
      typeof arm.armId !== "string" ||
      !CAMPAIGN_ID.test(arm.armId) ||
      typeof arm.conditionClass !== "string" ||
      !CAMPAIGN_ID.test(arm.conditionClass) ||
      typeof arm.environmentDigest !== "string" ||
      !DIGEST.test(arm.environmentDigest) ||
      typeof arm.snapshotRef !== "string" ||
      arm.snapshotRef.length === 0
    ) {
      throw new ValidationError(
        "Every campaign arm must bind one exact candidate snapshot",
      );
    }
    if (armIds.has(arm.armId)) {
      throw new ValidationError("Campaign input repeats an arm ID", {
        armId: arm.armId,
      });
    }
    armIds.add(arm.armId);
  }
  const claimIds = new Set();
  for (const claim of input.claims) {
    if (
      !claim ||
      typeof claim !== "object" ||
      Array.isArray(claim) ||
      Object.keys(claim).sort().join(",") !==
        "claimClass,claimId,controlArmId,text,treatmentArmId" ||
      typeof claim.claimId !== "string" ||
      !CAMPAIGN_ID.test(claim.claimId) ||
      typeof claim.text !== "string" ||
      claim.text.length === 0 ||
      typeof claim.claimClass !== "string" ||
      claim.claimClass.length === 0 ||
      typeof claim.treatmentArmId !== "string" ||
      typeof claim.controlArmId !== "string" ||
      claimIds.has(claim.claimId)
    ) {
      throw new ValidationError(
        "Every campaign claim must bind one registered causal contrast",
      );
    }
    claimIds.add(claim.claimId);
    if (
      claim.treatmentArmId === claim.controlArmId ||
      !armIds.has(claim.treatmentArmId) ||
      !armIds.has(claim.controlArmId)
    ) {
      throw new ValidationError(
        "Every campaign claim must bind two distinct registered arms",
        { claimId: claim.claimId },
      );
    }
  }
  if (
    input.controlAuditPolicy.treatmentArmId ===
      input.controlAuditPolicy.controlArmId ||
    !armIds.has(input.controlAuditPolicy.treatmentArmId) ||
    !armIds.has(input.controlAuditPolicy.controlArmId)
  ) {
    throw new ValidationError(
      "Control-audit policy must bind two distinct registered arms",
    );
  }
  if (
    !input.claims.some(
      (claim) =>
        claim.treatmentArmId === input.controlAuditPolicy.treatmentArmId &&
        claim.controlArmId === input.controlAuditPolicy.controlArmId,
    )
  ) {
    throw new ValidationError(
      "Control-audit policy must bind a registered claim contrast",
    );
  }
  const allowedDifferencePaths = new Set(
    input.controlAuditPolicy.allowedDifferencePaths,
  );
  if (
    input.controlAuditPolicy.forbiddenDifferencePaths.some((path) =>
      allowedDifferencePaths.has(path),
    )
  ) {
    throw new ValidationError(
      "Control-audit policy cannot both allow and forbid one difference path",
    );
  }
  const stratumIds = new Set();
  let totalWeight = 0;
  for (const stratum of input.population.strata) {
    if (stratumIds.has(stratum.stratumId)) {
      throw new ValidationError("Campaign population repeats a stratum ID", {
        stratumId: stratum.stratumId,
      });
    }
    stratumIds.add(stratum.stratumId);
    totalWeight += stratum.weight;
  }
  if (
    input.population.strata.length > 0 &&
    Math.abs(totalWeight - 1) > 1e-12
  ) {
    throw new ValidationError(
      "Campaign population stratum weights must sum to one",
      { totalWeight },
    );
  }
  return input;
}

function assertStoppingRule(rule) {
  if (rule.ruleClass === "fixed_sample") {
    if (
      rule.minimumAssignmentsPerCell !== rule.maximumAssignmentsPerCell
    ) {
      throw new ValidationError(
        "A fixed-sample stopping rule requires one exact assignment count",
        {
          minimumAssignmentsPerCell: rule.minimumAssignmentsPerCell,
          maximumAssignmentsPerCell: rule.maximumAssignmentsPerCell,
        },
      );
    }
    return rule;
  }
  if (rule.ruleClass === "valid_sequential") {
    if (
      rule.minimumAssignmentsPerCell > rule.maximumAssignmentsPerCell
    ) {
      throw new ValidationError(
        "A sequential stopping rule has an inverted assignment range",
      );
    }
    const schedule = rule.inspectionSchedule;
    if (
      schedule[0] < rule.minimumAssignmentsPerCell ||
      schedule.at(-1) !== rule.maximumAssignmentsPerCell ||
      schedule.some(
        (value, index) => index > 0 && value <= schedule[index - 1],
      )
    ) {
      throw new ValidationError(
        "A sequential stopping rule requires an increasing in-range schedule ending at its cap",
      );
    }
    return rule;
  }
  throw new ValidationError("Campaign stopping rule class is unsupported");
}

function authoredCampaignBinding(input) {
  return deepCloneCanonical({
    schemaVersion: input.schemaVersion,
    hashProfileId: input.hashProfileId,
    campaignId: input.campaignId,
    useClass: input.useClass,
    claims: input.claims,
    arms: input.arms,
    scenarioRefs: input.scenarioRefs,
    population: input.population,
    controlAuditPolicy: input.controlAuditPolicy,
    analysisPlanRef: input.analysisPlanRef,
    dependencePlanRef: input.dependencePlanRef,
    stoppingRuleRef: input.stoppingRuleRef,
    promotionAuthorized: input.promotionAuthorized,
  });
}

function stoppingRuleBinding(rule) {
  return deepCloneCanonical(rule);
}

function normalizedPopulationStrata(input) {
  const strata =
    input.population.strata.length === 0
      ? [{ stratumId: "all", weight: 1 }]
      : deepCloneCanonical(input.population.strata);
  return strata.sort((left, right) =>
    Buffer.from(left.stratumId, "utf8").compare(
      Buffer.from(right.stratumId, "utf8"),
    ),
  );
}

function assertAnalysisBindings(input, analysisPlan, dependencePlan) {
  const dependencePlanSemanticDigest = hashCanonical(
    "campaign-dependence-plan/v1",
    dependencePlan,
  );
  if (
    analysisPlan.dependencePlanDigest !== dependencePlanSemanticDigest ||
    analysisPlan.targetPopulation !== input.population.target ||
    dependencePlan.targetPopulation !== input.population.target ||
    canonicalBytes(
      [...analysisPlan.stratumWeights].sort((left, right) =>
        Buffer.from(left.stratumId, "utf8").compare(
          Buffer.from(right.stratumId, "utf8"),
        ),
      ),
    ).compare(
      canonicalBytes(normalizedPopulationStrata(input)),
    ) !== 0
  ) {
    throw new ValidationError(
      "Analysis, dependence, and authored population bindings disagree",
    );
  }
  return dependencePlanSemanticDigest;
}

function armReference(arm) {
  if (!arm || typeof arm !== "object" || Array.isArray(arm)) return null;
  return arm.snapshotRef ?? null;
}

function inputFileRefs(input) {
  const refs = [
    input.analysisPlanRef,
    input.dependencePlanRef,
    input.stoppingRuleRef,
    ...input.scenarioRefs,
    ...input.arms.map(armReference),
  ];
  if (refs.some((reference) => typeof reference !== "string")) {
    throw new ValidationError("Every campaign arm must bind a package file reference");
  }
  const unique = [...new Set(refs)];
  if (unique.length !== refs.length) {
    throw new ValidationError("Campaign input repeats a sealed file reference");
  }
  return unique;
}

function sealed(core) {
  return {
    ...core,
    sealDigest: hashCanonical("campaign-input-seal/v1", core),
  };
}

function registeredClaimBindings(input, candidateArms, analysisPlan) {
  const conditionArms = candidateArms.map((arm) => ({
    armId: arm.armId,
    conditionClass: arm.conditionClass,
    snapshotDigest: arm.candidateSnapshotDigest,
    environmentDigest: arm.environmentDigest,
  }));
  const registeredClaims = input.claims.map((claim) => ({
    claimId: claim.claimId,
    text: claim.text,
    ...validateClaimContrast(
      {
        claimClass: claim.claimClass,
        treatmentArmId: claim.treatmentArmId,
        controlArmId: claim.controlArmId,
      },
      conditionArms,
    ),
  }));
  const plannedClaimIds = [...analysisPlan.claimIds].sort();
  const registeredClaimIds = registeredClaims
    .map((claim) => claim.claimId)
    .sort();
  if (
    canonicalBytes(plannedClaimIds).compare(
      canonicalBytes(registeredClaimIds),
    ) !== 0 ||
    registeredClaims.some(
      (claim) =>
        claim.treatmentArmId !== analysisPlan.estimand.treatmentArmId ||
        claim.controlArmId !== analysisPlan.estimand.controlArmId,
    )
  ) {
    throw new ValidationError(
      "Registered campaign claims do not match the sealed analysis plan",
    );
  }
  return registeredClaims;
}

function verifySeal(record) {
  if (
    !record ||
    record.hashProfileId !== HASH_PROFILE_ID ||
    sealed(Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== "sealDigest"),
    )).sealDigest !== record.sealDigest
  ) {
    throw new IntegrityError("Campaign seal is unverifiable");
  }
  return record;
}

function stateData(record) {
  const semanticState = record.authoritativeStateCore.semanticState;
  return (
    semanticState.data ??
    Object.fromEntries(
      Object.entries(semanticState.semantic ?? {}).filter(
        ([key]) => key !== "state",
      ),
    )
  );
}

function stateName(record) {
  const semanticState = record.authoritativeStateCore.semanticState;
  return semanticState.state ?? semanticState.semantic?.state;
}

function initialCampaignProductData({
  campaignId,
  sealDigest,
  campaignInputSemanticDigest,
}) {
  const rooted = (purpose) =>
    hashCanonical("campaign-product-state-genesis-field/v1", {
      campaignId,
      sealDigest,
      purpose,
    });
  return {
    surveyUniverseRoot: rooted("survey-universe"),
    surveyReserveRoot: rooted("survey-reserve"),
    flowLedgerRoot: sealDigest,
    edlAuthorizationDigest: rooted("edl-authorization"),
    confirmatoryFamilyId: `${campaignId}:development-family`,
    familyAllocationDigest: rooted("family-allocation"),
    familyExecutionCommitmentDigest: rooted("family-execution-commitment"),
    cf08AcknowledgementRoot: rooted("cf08-acknowledgement"),
    reviewerAllocationPlanDigest: rooted("reviewer-allocation-plan"),
    downstream: {
      applicability: "required",
      claimRequiresDownstream: true,
      taskUniverseRoot: rooted("downstream-task-universe"),
      semanticKeyRoot: rooted("downstream-semantic-key"),
      reserveUniverseRoot: rooted("downstream-reserve-universe"),
      downstreamLedgerRoot: rooted("downstream-ledger"),
    },
    reviewerCapacityDispositionRoot: null,
    replacementBudgetLedgerRoot: rooted("replacement-budget-ledger"),
    awarenessUniverseRoot: rooted("awareness-universe"),
    awarenessReceiptLedgerRoot: rooted("awareness-receipt-ledger"),
    unmaskStatus: "masked",
    activationWindowRoot: campaignInputSemanticDigest,
    childGrantFenceRegistryRoot: rooted("child-grant-fence-registry"),
    receiptLedgerRoot: rooted("receipt-ledger"),
    failurePreparation: null,
    attemptRefs: [],
  };
}

export class CampaignOrchestrator {
  static async open({
    packageRoot,
    workspaceRoot,
    lifecycleManifestPath = join(
      packageRoot,
      "source/manifests/lifecycles.json",
    ),
    schemaCatalogPath = join(
      packageRoot,
      "source/manifests/schema-catalog.json",
    ),
    schemasRoot = join(packageRoot, "schemas"),
    registry = null,
    schemaValidator = null,
    stateStore = null,
    executionDriver = null,
    authorityTrustRoot = null,
    authorityReceiptProvider = null,
  }) {
    if (!packageRoot || !workspaceRoot) {
      throw new ValidationError(
        "CampaignOrchestrator requires packageRoot and workspaceRoot",
      );
    }
    const resolvedRegistry =
      registry ?? (await LifecycleRegistry.fromFile(lifecycleManifestPath));
    const resolvedSchemas =
      schemaValidator ??
      (await SchemaValidator.fromPackageRoot(packageRoot, {
        catalogPath: schemaCatalogPath,
        schemasRoot,
      }));
    const resolvedStateStore =
      stateStore ??
      new StateStore({
        rootPath: resolveContained(workspaceRoot, ".evaluator", "state"),
        schemaVersion: "1.0.0",
        productStateValidator: new RuntimeProductStateValidator({
          schemaValidator: resolvedSchemas,
          registry: resolvedRegistry,
        }),
      });
    await resolvedStateStore.initialize();
    return new CampaignOrchestrator({
      packageRoot,
      workspaceRoot,
      registry: resolvedRegistry,
      schemaValidator: resolvedSchemas,
      stateStore: resolvedStateStore,
      executionDriver,
      authorityTrustRoot,
      authorityReceiptProvider,
    });
  }

  constructor({
    packageRoot,
    workspaceRoot,
    registry,
    schemaValidator,
    stateStore,
    executionDriver,
    authorityTrustRoot,
    authorityReceiptProvider,
  }) {
    this.packageRoot = packageRoot;
    this.workspaceRoot = workspaceRoot;
    this.registry = registry;
    this.schemaValidator = schemaValidator;
    this.stateStore = stateStore;
    this.executionDriver = executionDriver;
    this.authorityTrustRoot = authorityTrustRoot;
    this.authorityReceiptProvider = authorityReceiptProvider;
    this.inputPath = resolveContained(workspaceRoot, "campaign-input.json");
    this.sealPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "campaign-seal.json",
    );
  }

  async init({ campaignId } = {}) {
    await mkdir(this.workspaceRoot, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.workspaceRoot, this.inputPath);
    if (await exists(this.inputPath)) {
      const input = await readJsonFile(this.inputPath);
      if (campaignId && input.campaignId !== campaignId) {
        throw new ConflictError(
          "Existing authored campaign input has another campaign ID",
          { existing: input.campaignId, requested: campaignId },
        );
      }
      return {
        replayed: true,
        campaignId: input.campaignId,
        inputPath: "campaign-input.json",
        inputDigest: hashCanonical("authored-campaign-input/v1", input),
      };
    }
    const templatePath = resolveContained(
      this.packageRoot,
      "assets",
      "campaign-input.template.json",
    );
    await assertNoSymlinkAncestors(this.packageRoot, templatePath);
    const input = await readJsonFile(templatePath);
    if (campaignId !== undefined) {
      if (!CAMPAIGN_ID.test(campaignId)) {
        throw new ValidationError("Campaign ID is invalid", { campaignId });
      }
      input.campaignId = campaignId;
    }
    const outcome = await atomicCreateOnce(
      this.inputPath,
      canonicalBytes(input),
    );
    return {
      replayed: !outcome.created,
      campaignId: input.campaignId,
      inputPath: "campaign-input.json",
      inputDigest: hashCanonical("authored-campaign-input/v1", input),
    };
  }

  async inventoryInput(input) {
    const inventory = [];
    for (const reference of inputFileRefs(input).sort()) {
      const path = resolveContained(this.workspaceRoot, reference);
      await assertNoSymlinkAncestors(this.workspaceRoot, path);
      const bytes = await readFileNoFollow(path);
      inventory.push({
        path: reference,
        byteLength: bytes.length,
        rawFileSha256: rawSha256(bytes),
      });
    }
    return inventory;
  }

  validateKnownInputs(input, inventory) {
    const byPath = new Map(inventory.map((entry) => [entry.path, entry]));
    if (!byPath.has(input.analysisPlanRef)) {
      throw new IntegrityError("Analysis plan is missing from the seal inventory");
    }
    if (!byPath.has(input.dependencePlanRef)) {
      throw new IntegrityError(
        "Dependence plan is missing from the seal inventory",
      );
    }
    if (!byPath.has(input.stoppingRuleRef)) {
      throw new IntegrityError("Stopping rule is missing from the seal inventory");
    }
    for (const reference of input.scenarioRefs) {
      if (!byPath.has(reference)) {
        throw new IntegrityError("Scenario is missing from the seal inventory", {
          scenarioRef: reference,
        });
      }
    }
    for (const arm of input.arms) {
      if (!byPath.has(arm.snapshotRef)) {
        throw new IntegrityError(
          "Candidate snapshot is missing from the seal inventory",
          { armId: arm.armId, snapshotRef: arm.snapshotRef },
        );
      }
    }
  }

  async validatedStoppingRule(input) {
    const stoppingRule = await readJsonFile(
      resolveContained(this.workspaceRoot, input.stoppingRuleRef),
    );
    this.schemaValidator.assert("stopping-rule", stoppingRule);
    return assertStoppingRule(stoppingRule);
  }

  async validatedDependencePlan(input) {
    const dependencePlan = await readJsonFile(
      resolveContained(this.workspaceRoot, input.dependencePlanRef),
    );
    this.schemaValidator.assert("dependence-plan", dependencePlan);
    return dependencePlan;
  }

  async candidateArmBindings(input) {
    const bindings = [];
    for (const arm of input.arms) {
      const snapshotPath = resolveContained(
        this.workspaceRoot,
        arm.snapshotRef,
      );
      await assertNoSymlinkAncestors(this.workspaceRoot, snapshotPath);
      const snapshot = await readJsonFile(snapshotPath);
      const payloadRoot = resolveContained(
        dirname(snapshotPath),
        snapshot.snapshotLayout?.payloadDirectory ?? "__invalid_layout__",
      );
      const validated = await validateCandidateSnapshot({
        snapshot,
        payloadRoot,
        schemaValidator: this.schemaValidator,
      });
      bindings.push({
        armId: arm.armId,
        conditionClass: arm.conditionClass,
        environmentDigest: arm.environmentDigest,
        snapshotRef: arm.snapshotRef,
        candidateSnapshotId: validated.snapshot.candidateSnapshotId,
        candidateSnapshotDigest: validated.snapshotDigest,
        candidatePackageRoot: validated.snapshot.candidatePackageRoot,
        skillIdentity: validated.snapshot.skillIdentity,
        adapterId: validated.snapshot.adapter.adapterId,
        adapterInterfaceVersion:
          validated.snapshot.adapter.adapterInterfaceVersion,
        subjectProtocolVersion:
          validated.snapshot.adapter.subjectProtocolVersion,
        adapterDescriptorDigest:
          validated.snapshot.adapter.adapterDescriptorDigest,
        capabilities: validated.snapshot.capabilities,
        compiledProjectionRoots:
          validated.snapshot.compiledProjectionRoots,
      });
    }
    return bindings;
  }

  async captureCandidate({ armId, sourceRoot, adapter }) {
    if (typeof armId !== "string" || !CAMPAIGN_ID.test(armId)) {
      throw new ValidationError("Candidate arm ID is invalid", { armId });
    }
    await mkdir(this.workspaceRoot, { recursive: true, mode: 0o750 });
    const destinationRoot = resolveContained(
      this.workspaceRoot,
      "candidate-snapshots",
      armId,
    );
    const captured = await captureCandidatePackage({
      authorityRoot: this.workspaceRoot,
      sourceRoot,
      destinationRoot,
      adapter,
      schemaValidator: this.schemaValidator,
    });
    return deepFreeze({
      armId,
      snapshotRef: relative(
        this.workspaceRoot,
        captured.manifestPath,
      ).split(sep).join("/"),
      candidateSnapshotId: captured.snapshot.candidateSnapshotId,
      candidatePackageRoot: captured.snapshot.candidatePackageRoot,
      adapterDescriptorDigest:
        captured.snapshot.adapter.adapterDescriptorDigest,
      replayed: captured.replayed,
    });
  }

  async seal() {
    await assertNoSymlinkAncestors(this.workspaceRoot, this.inputPath);
    const input = await readJsonFile(this.inputPath);
    this.schemaValidator.assert("campaign-input", input);
    assertCampaignInput(input);
    const inventory = await this.inventoryInput(input);
    this.validateKnownInputs(input, inventory);
    const candidateArms = await this.candidateArmBindings(input);
    const stoppingRule = await this.validatedStoppingRule(input);
    const dependencePlan = await this.validatedDependencePlan(input);

    const analysisPlan = await readJsonFile(
      resolveContained(this.workspaceRoot, input.analysisPlanRef),
    );
    this.schemaValidator.assert("analysis-plan", analysisPlan);
    const dependencePlanSemanticDigest = assertAnalysisBindings(
      input,
      analysisPlan,
      dependencePlan,
    );
    const registeredClaims = registeredClaimBindings(
      input,
      candidateArms,
      analysisPlan,
    );
    for (const reference of input.scenarioRefs) {
      this.schemaValidator.assert(
        "scenario",
        await readJsonFile(resolveContained(this.workspaceRoot, reference)),
      );
    }

    const inputBytes = await readFileNoFollow(this.inputPath);
    const core = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      campaignId: input.campaignId,
      campaignInputRawSha256: rawSha256(inputBytes),
      campaignInputSemanticDigest: hashCanonical(
        "authored-campaign-input/v1",
        input,
      ),
      authoredCampaign: authoredCampaignBinding(input),
      stoppingRule: stoppingRuleBinding(stoppingRule),
      stoppingRuleSemanticDigest: hashCanonical(
        "campaign-stopping-rule/v1",
        stoppingRule,
      ),
      dependencePlan: deepCloneCanonical(dependencePlan),
      dependencePlanSemanticDigest,
      controlAuditPolicy: deepCloneCanonical(input.controlAuditPolicy),
      controlAuditPolicyDigest: hashCanonical(
        "campaign-control-audit-policy/v1",
        input.controlAuditPolicy,
      ),
      lifecycleManifestDigest: this.registry.manifestDigest,
      schemaCatalogDigest: hashCanonical(
        "schema-catalog/v1",
        this.schemaValidator.catalog,
      ),
      inventory,
      candidateArms,
      registeredClaims,
      immutable: true,
      promotionAuthorized: false,
    };
    const record = sealed(core);
    await mkdir(resolveContained(this.workspaceRoot, ".evaluator"), {
      recursive: true,
      mode: 0o750,
    });
    await assertNoSymlinkAncestors(this.workspaceRoot, this.sealPath);
    const outcome = await atomicCreateOnce(
      this.sealPath,
      canonicalBytes(record),
    );
    const genesis = await this.stateStore.transact(
      "campaign",
      input.campaignId,
      async (current) => {
        if (current) {
          const data = stateData(current);
          if (
            current.authoritativeStateCore.semanticState.revision === 0 &&
            data.flowLedgerRoot === record.sealDigest
          ) {
            return {
              next: null,
              result: {
                replayed: true,
                authoritativeStateRoot: current.authoritativeStateRoot,
              },
            };
          }
          throw new ConflictError(
            "Campaign lifecycle state conflicts with the immutable seal",
            { campaignId: input.campaignId },
          );
        }
        return {
          next: null,
          result: null,
        };
      },
    );
    let genesisResult = genesis;
    if (genesis === null) {
      const engine = {
        stateStore: this.stateStore,
      };
      const { LifecycleEngine } = await import("../engine/lifecycle-engine.mjs");
      genesisResult = await new LifecycleEngine({
        registry: this.registry,
        stateStore: engine.stateStore,
      }).createParentStagedGenesis({
        machineId: "campaign",
        objectId: input.campaignId,
        initialState: "EC0_DRAFT",
        initialData: initialCampaignProductData({
          campaignId: input.campaignId,
          sealDigest: record.sealDigest,
          campaignInputSemanticDigest: core.campaignInputSemanticDigest,
        }),
        parentBinding: {
          parentMachineId: "operator-campaign-seal",
          parentObjectId: input.campaignId,
          parentPriorAuthoritativeRoot: record.sealDigest,
          parentOrderId: `${input.campaignId}:seal`,
          parentFence: 0,
        },
      });
    }
    return {
      replayed: !outcome.created,
      campaignId: input.campaignId,
      sealDigest: record.sealDigest,
      lifecycleGenesis: genesisResult,
    };
  }

  async loadSeal({ required = true } = {}) {
    await assertNoSymlinkAncestors(this.workspaceRoot, this.sealPath);
    if (!(await exists(this.sealPath))) {
      if (required) throw new ConflictError("Campaign has not been sealed");
      return null;
    }
    return verifySeal(await readJsonFile(this.sealPath));
  }

  async validate() {
    const seal = await this.loadSeal();
    if (
      seal.lifecycleManifestDigest !== this.registry.manifestDigest ||
      seal.schemaCatalogDigest !==
        hashCanonical("schema-catalog/v1", this.schemaValidator.catalog)
    ) {
      throw new IntegrityError(
        "Campaign seal was created against another evaluator contract",
      );
    }
    const inputBytes = await readFileNoFollow(this.inputPath);
    const input = await readJsonFile(this.inputPath);
    this.schemaValidator.assert("campaign-input", input);
    assertCampaignInput(input);
    if (
      rawSha256(inputBytes) !== seal.campaignInputRawSha256 ||
      hashCanonical(
        "authored-campaign-input/v1",
        input,
      ) !== seal.campaignInputSemanticDigest ||
      canonicalBytes(authoredCampaignBinding(input)).compare(
        canonicalBytes(seal.authoredCampaign),
      ) !== 0
    ) {
      throw new IntegrityError("Authored campaign input changed after sealing");
    }
    for (const entry of seal.inventory) {
      const path = resolveContained(this.workspaceRoot, entry.path);
      await assertNoSymlinkAncestors(this.workspaceRoot, path);
      const bytes = await readFileNoFollow(path);
      if (
        bytes.length !== entry.byteLength ||
        rawSha256(bytes) !== entry.rawFileSha256
      ) {
        throw new IntegrityError("Sealed campaign dependency changed", {
          path: entry.path,
        });
      }
    }
    const stoppingRule = await this.validatedStoppingRule(input);
    if (
      hashCanonical("campaign-stopping-rule/v1", stoppingRule) !==
        seal.stoppingRuleSemanticDigest ||
      canonicalBytes(stoppingRuleBinding(stoppingRule)).compare(
        canonicalBytes(seal.stoppingRule),
      ) !== 0
    ) {
      throw new IntegrityError(
        "Sealed campaign stopping policy binding changed",
      );
    }
    const dependencePlan = await this.validatedDependencePlan(input);
    const dependencePlanSemanticDigest = hashCanonical(
      "campaign-dependence-plan/v1",
      dependencePlan,
    );
    if (
      dependencePlanSemanticDigest !== seal.dependencePlanSemanticDigest ||
      canonicalBytes(dependencePlan).compare(
        canonicalBytes(seal.dependencePlan),
      ) !== 0
    ) {
      throw new IntegrityError(
        "Sealed campaign dependence-plan binding changed",
      );
    }
    if (
      hashCanonical(
        "campaign-control-audit-policy/v1",
        input.controlAuditPolicy,
      ) !== seal.controlAuditPolicyDigest ||
      canonicalBytes(input.controlAuditPolicy).compare(
        canonicalBytes(seal.controlAuditPolicy),
      ) !== 0
    ) {
      throw new IntegrityError(
        "Sealed campaign control-audit policy binding changed",
      );
    }
    const candidateArms = await this.candidateArmBindings(input);
    if (
      canonicalBytes(candidateArms).compare(
        canonicalBytes(seal.candidateArms),
      ) !== 0
    ) {
      throw new IntegrityError(
        "Sealed campaign candidate snapshot binding changed",
      );
    }
    const analysisPlan = await readJsonFile(
      resolveContained(this.workspaceRoot, input.analysisPlanRef),
    );
    this.schemaValidator.assert("analysis-plan", analysisPlan);
    assertAnalysisBindings(input, analysisPlan, dependencePlan);
    const registeredClaims = registeredClaimBindings(
      input,
      candidateArms,
      analysisPlan,
    );
    if (
      canonicalBytes(registeredClaims).compare(
        canonicalBytes(seal.registeredClaims),
      ) !== 0
    ) {
      throw new IntegrityError(
        "Sealed campaign registered claim binding changed",
      );
    }
    const state = await this.stateStore.load("campaign", seal.campaignId, {
      required: true,
    });
    if (
      stateData(state).flowLedgerRoot !==
      seal.sealDigest
    ) {
      throw new IntegrityError("Campaign lifecycle state is not bound to its seal");
    }
    return deepFreeze({
      valid: true,
      campaignId: seal.campaignId,
      sealDigest: seal.sealDigest,
      lifecycleState: stateName(state),
      revision: state.authoritativeStateCore.semanticState.revision,
      authoritativeStateRoot: state.authoritativeStateRoot,
    });
  }

  async advance({ resume = false } = {}) {
    const validation = await this.validate();
    const executionDriver =
      this.executionDriver ??
      new DeterministicNoProviderCampaignDriver({
        authorityTrustRoot: this.authorityTrustRoot,
        authorityReceiptProvider: this.authorityReceiptProvider,
      });
    if (typeof executionDriver.advance !== "function") {
      throw new ValidationError("Campaign execution driver has no advance method");
    }
    const result = await executionDriver.advance({
      mode: resume ? "resume" : "run",
      validation: deepCloneCanonical(validation),
      registry: this.registry,
      schemaValidator: this.schemaValidator,
      stateStore: this.stateStore,
      packageRoot: this.packageRoot,
      workspaceRoot: this.workspaceRoot,
    });
    if (!result || typeof result !== "object") {
      throw new IntegrityError("Campaign execution driver returned no result");
    }
    return deepFreeze(deepCloneCanonical(result));
  }

  async status() {
    const seal = await this.loadSeal({ required: false });
    if (!seal) {
      return deepFreeze({
        phase: (await exists(this.inputPath)) ? "draft" : "absent",
        sealed: false,
      });
    }
    const state = await this.stateStore.load("campaign", seal.campaignId, {
      required: true,
    });
    return deepFreeze({
      phase: stateName(state),
      sealed: true,
      campaignId: seal.campaignId,
      sealDigest: seal.sealDigest,
      revision: state.authoritativeStateCore.semanticState.revision,
      authoritativeStateRoot: state.authoritativeStateRoot,
    });
  }

  async report() {
    const status = await this.status();
    const recommendationPath = resolveContained(
      this.workspaceRoot,
      "results",
      "recommendation.json",
    );
    let recommendation = null;
    if (await exists(recommendationPath)) {
      recommendation = await readJsonFile(recommendationPath);
      this.schemaValidator.assert("recommendation", recommendation);
      if (recommendation.promotionAuthorized !== false) {
        throw new IntegrityError("Campaign recommendation crossed release authority");
      }
    }
    return deepFreeze({
      status,
      recommendation:
        recommendation === null
          ? null
          : {
              recommendationId: recommendation.recommendationId,
              class: recommendation.class,
              promotionAuthorized: false,
              recommendationDigest: hashCanonical(
                "campaign-recommendation/v1",
                recommendation,
              ),
            },
    });
  }
}

export {
  assertCampaignInput,
  assertStoppingRule,
  authoredCampaignBinding,
  stoppingRuleBinding,
  verifySeal,
};
