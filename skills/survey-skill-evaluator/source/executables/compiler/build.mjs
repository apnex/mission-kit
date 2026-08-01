#!/usr/bin/env node
import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPortableRelativePath,
  bytesEqual,
  collectTree,
  readJson,
  writeFileAtomic
} from "./lib/files.mjs";
import {
  HASH_PROFILE_ID,
  absentAuthoritativeStateRoot,
  canonicalBytes,
  canonicalize,
  evaluatorPackageDigest,
  foldNamedTree,
  foldPackageInventory,
  inventoryEntry,
  parentStagedGenesis,
  rawSha256,
  semanticHash
} from "./lib/hash.mjs";
import { createProjectionMap } from "./lib/projections.mjs";
import { validateSchemaCatalog } from "./lib/schemas.mjs";
import {
  assertSchemaInstance,
  lintSchema,
  resolveInternalRef,
  validateSchemaInstance
} from "../shared/schema-validator.mjs";

const PACKAGE_MANIFEST_PATH = "package.manifest.json";
const GENERATED_LOCK_PATH = "generated.lock.json";
const PACKAGE_EXCLUSIONS = [PACKAGE_MANIFEST_PATH];
const LOCK_EXCLUSIONS = [GENERATED_LOCK_PATH, PACKAGE_MANIFEST_PATH];

function usage() {
  return `usage: compile.sh [--check] [--verify-package] [--release-check] [--root PATH]
                  [--manifest-dir PATH] [--source-schema-dir PATH]`;
}

function parseArguments(argv) {
  const options = {
    check: false,
    verifyPackage: false,
    releaseCheck: false,
    root: undefined,
    manifestDir: "source/manifests",
    sourceSchemaDir: "source/schemas"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--verify-package") {
      options.verifyPackage = true;
    } else if (argument === "--release-check") {
      options.releaseCheck = true;
    } else if (
      argument === "--root" ||
      argument === "--manifest-dir" ||
      argument === "--source-schema-dir"
    ) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a path`);
      index += 1;
      if (argument === "--root") options.root = value;
      if (argument === "--manifest-dir") options.manifestDir = value;
      if (argument === "--source-schema-dir") options.sourceSchemaDir = value;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown compiler argument: ${argument}\n${usage()}`);
    }
  }
  return options;
}

function relativeWithin(root, requested, label) {
  const absolute = path.resolve(root, requested);
  const relative = path.relative(root, absolute);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must resolve beneath the evaluator root`);
  }
  return relative.split(path.sep).join("/");
}

function validateLifecycleManifest(manifest) {
  if (
    manifest.schemaVersion !== "1.0.0" ||
    manifest.hashProfileId !== HASH_PROFILE_ID ||
    manifest.authority !== "sole-authored-lifecycle-source"
  ) {
    throw new Error("unsupported lifecycle manifest identity");
  }
  const machines = Object.entries(manifest.machines ?? {});
  if (machines.length !== 17) {
    throw new Error(`lifecycle manifest must contain 17 machines, got ${machines.length}`);
  }
  const transitions = machines.flatMap(([machineId, tuples]) =>
    tuples.map((tuple) => ({ machineId, tuple }))
  );
  if (manifest.transitionCount !== 267 || transitions.length !== 267) {
    throw new Error(
      `lifecycle manifest must contain 267 transitions, got ${transitions.length}`
    );
  }
  const transitionIds = new Set();
  for (const { machineId, tuple: encodedTuple } of transitions) {
    const tuple =
      typeof encodedTuple === "string" ? encodedTuple.split("|") : encodedTuple;
    if (
      !Array.isArray(tuple) ||
      tuple.length !== 4 ||
      tuple.some((value) => typeof value !== "string" || value.length === 0)
    ) {
      throw new Error(`invalid lifecycle tuple in ${machineId}`);
    }
    const [transitionId] = tuple;
    if (transitionIds.has(transitionId)) {
      throw new Error(`duplicate lifecycle transition ID: ${transitionId}`);
    }
    transitionIds.add(transitionId);
  }
}

function validateGeneratedSchemas(projections, catalog) {
  const schemaTargets = [...projections.keys()].filter((target) =>
    target.startsWith("schemas/")
  );
  if (schemaTargets.length !== 141) {
    throw new Error(`compiler must project exactly 141 schemas, got ${schemaTargets.length}`);
  }
  const ids = new Set();
  for (const filename of catalog.schemas) {
    const relativePath = `schemas/${filename}`;
    const target = projections.get(relativePath);
    if (!target) throw new Error(`missing generated schema projection: ${relativePath}`);
    const schema = JSON.parse(target.bytes);
    const expectedId = `${catalog.idPrefix}${filename.replace(/\.schema\.json$/u, "")}`;
    if (schema.$id !== expectedId || ids.has(schema.$id)) {
      throw new Error(`invalid or duplicate schema ID: ${relativePath}`);
    }
    if (schema.additionalProperties !== false) {
      throw new Error(`top-level schema is not closed: ${relativePath}`);
    }
    lintSchema(schema, relativePath);
    ids.add(schema.$id);
  }
}

function schemaProjection(projections, filename) {
  const target = projections.get(`schemas/${filename}`);
  if (!target) throw new Error(`missing schema projection: ${filename}`);
  return JSON.parse(target.bytes);
}

function exactIds(prefix, first, last) {
  return Array.from(
    { length: last - first + 1 },
    (_, index) => `${prefix}${String(first + index).padStart(2, "0")}`
  );
}

function assertExactIdSet(actualIds, expectedIds, label) {
  const actual = [...new Set(actualIds)].sort();
  const expected = [...expectedIds].sort();
  if (
    actual.length !== actualIds.length ||
    JSON.stringify(actual) !== JSON.stringify(expected)
  ) {
    throw new Error(`${label} IDs are incomplete, duplicate, or unexpected`);
  }
}

function assertExactCoverageSet(actualIds, expectedIds, label) {
  const actual = [...new Set(actualIds)].sort();
  const expected = [...expectedIds].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} coverage is incomplete or unexpected`);
  }
}

function descriptorInstance(entry) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    ...entry
  };
}

async function validateAuthoredSources({
  root,
  manifestDir,
  sourceSchemaDir,
  projections,
  schemaCatalog,
  lifecycleManifest
}) {
  const requirements = await readJson(
    path.join(root, manifestDir, "requirements.json")
  );
  const mechanisms = await readJson(
    path.join(root, manifestDir, "mechanisms.json")
  );
  const fragments = await readJson(path.join(root, manifestDir, "fragments.json"));
  const projectionManifest = await readJson(
    path.join(root, manifestDir, "projections.json")
  );
  const metrics = await readJson(path.join(root, manifestDir, "metrics.json"));
  const tests = await readJson(path.join(root, manifestDir, "tests.json"));

  if (
    requirements.schemaVersion !== "1.0.0" ||
    requirements.hashProfileId !== HASH_PROFILE_ID ||
    requirements.designSha256 !==
      "3b333b6d1ff385ef5ca47460b42708f9c3f97692de7ecea846f467c776abdf7f"
  ) {
    throw new Error("requirements manifest does not bind the frozen design");
  }
  const requiredRequirementIds = [
    ...exactIds("TE", 1, 32),
    ...exactIds("EI", 1, 21)
  ];
  assertExactIdSet(
    requirements.requirements.map((entry) => entry.requirementId),
    requiredRequirementIds,
    "requirement"
  );
  const requirementSchema = schemaProjection(
    projections,
    "requirement-descriptor.schema.json"
  );
  for (const entry of requirements.requirements) {
    assertSchemaInstance(
      requirementSchema,
      descriptorInstance(entry),
      `requirement ${entry.requirementId}`
    );
  }

  const expectedMechanismIds = exactIds("EM", 1, 20);
  assertExactIdSet(
    mechanisms.mechanisms.map((entry) => entry.mechanismId),
    expectedMechanismIds,
    "mechanism"
  );
  const mechanismSchema = schemaProjection(
    projections,
    "mechanism-descriptor.schema.json"
  );
  for (const entry of mechanisms.mechanisms) {
    assertSchemaInstance(
      mechanismSchema,
      descriptorInstance(entry),
      `mechanism ${entry.mechanismId}`
    );
  }
  const mechanismIdSet = new Set(expectedMechanismIds);
  for (const requirement of requirements.requirements) {
    for (const mechanismId of requirement.mechanismIds) {
      if (!mechanismIdSet.has(mechanismId)) {
        throw new Error(
          `${requirement.requirementId} references unknown ${mechanismId}`
        );
      }
    }
  }

  const fragmentDescriptorSchema = schemaProjection(
    projections,
    "fragment-descriptor.schema.json"
  );
  const fragmentSourceSchema = await readJson(
    path.join(root, sourceSchemaDir, "fragment-source.schema.json")
  );
  lintSchema(fragmentSourceSchema, "fragment-source.schema.json");
  const fragmentIds = new Set();
  const fragmentPaths = new Set();
  for (const entry of fragments.fragments) {
    assertSchemaInstance(
      fragmentDescriptorSchema,
      descriptorInstance(entry),
      `fragment descriptor ${entry.fragmentId}`
    );
    if (fragmentIds.has(entry.fragmentId) || fragmentPaths.has(entry.path)) {
      throw new Error(`duplicate fragment ID or path: ${entry.fragmentId}`);
    }
    fragmentIds.add(entry.fragmentId);
    fragmentPaths.add(entry.path);
    const fragment = await readJson(path.join(root, entry.path));
    assertSchemaInstance(
      fragmentSourceSchema,
      fragment,
      `fragment source ${entry.path}`
    );
    if (
      fragment.fragmentId !== entry.fragmentId ||
      fragment.purpose !== entry.purpose
    ) {
      throw new Error(`fragment descriptor/source mismatch: ${entry.fragmentId}`);
    }
  }
  const sourceOwnerRegistrySchema = await readJson(
    path.join(root, sourceSchemaDir, "source-owner-registry.schema.json")
  );
  const sourceOwnerRegistry = await readJson(
    path.join(root, "source/fragments/assurance/source-owner-registry.json")
  );
  lintSchema(sourceOwnerRegistrySchema, "source-owner-registry.schema.json");
  assertSchemaInstance(
    sourceOwnerRegistrySchema,
    sourceOwnerRegistry,
    "source-owner-registry.json"
  );
  assertExactIdSet(
    sourceOwnerRegistry.owners.map((owner) => owner.sourceOwnerId),
    requirements.requirements.map((requirement) => requirement.sourceOwner),
    "source owner"
  );
  assertExactIdSet(
    sourceOwnerRegistry.owners.map((owner) => owner.requirementId),
    requiredRequirementIds,
    "source-owner requirement"
  );
  const requirementById = new Map(
    requirements.requirements.map((requirement) => [
      requirement.requirementId,
      requirement
    ])
  );
  for (const owner of sourceOwnerRegistry.owners) {
    if (
      requirementById.get(owner.requirementId)?.sourceOwner !==
        owner.sourceOwnerId ||
      !fragmentIds.has(owner.fragmentId)
    ) {
      throw new Error(
        `source owner ${owner.sourceOwnerId} is not singularly bound to its requirement and fragment`
      );
    }
  }

  const projectionDescriptorSchema = schemaProjection(
    projections,
    "projection-descriptor.schema.json"
  );
  const registeredRecipes = new Set();
  for (const entry of projectionManifest.projections) {
    assertSchemaInstance(
      projectionDescriptorSchema,
      descriptorInstance(entry),
      `projection ${entry.recipeId}`
    );
    if (registeredRecipes.has(entry.recipeId)) {
      throw new Error(`duplicate projection recipe: ${entry.recipeId}`);
    }
    registeredRecipes.add(entry.recipeId);
  }
  for (const target of projections.values()) {
    if (!registeredRecipes.has(target.recipeId)) {
      throw new Error(
        `generated target ${target.path} has unregistered recipe ${target.recipeId}`
      );
    }
  }

  const metricSchema = schemaProjection(projections, "metric-descriptor.schema.json");
  const metricIds = new Set();
  for (const entry of metrics.metrics) {
    assertSchemaInstance(
      metricSchema,
      descriptorInstance(entry),
      `metric ${entry.metricId}`
    );
    if (metricIds.has(entry.metricId)) {
      throw new Error(`duplicate metric ID: ${entry.metricId}`);
    }
    metricIds.add(entry.metricId);
  }

  const testManifestSchema = await readJson(
    path.join(root, sourceSchemaDir, "test-manifest.schema.json")
  );
  lintSchema(testManifestSchema, "test-manifest.schema.json");
  assertSchemaInstance(testManifestSchema, tests, "tests.json");
  const testDescriptorSchema = await readJson(
    path.join(root, sourceSchemaDir, "test-descriptor.schema.json")
  );
  lintSchema(testDescriptorSchema, "test-descriptor.schema.json");
  const sortedDescriptorPaths = [...tests.descriptorPaths].sort((left, right) =>
    Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"))
  );
  if (JSON.stringify(sortedDescriptorPaths) !== JSON.stringify(tests.descriptorPaths)) {
    throw new Error("test descriptor registry paths must be bytewise sorted");
  }
  const descriptorInventory = await collectTree(
    path.join(root, "source/test-descriptors")
  );
  const registeredDescriptorPaths = new Set(tests.descriptorPaths);
  const inventoriedDescriptorPaths = new Set(
    descriptorInventory.map(
      (entry) => `source/test-descriptors/${entry.path}`
    )
  );
  if (
    registeredDescriptorPaths.size !== tests.descriptorPaths.length ||
    registeredDescriptorPaths.size !== inventoriedDescriptorPaths.size ||
    [...registeredDescriptorPaths].some(
      (descriptorPath) => !inventoriedDescriptorPaths.has(descriptorPath)
    )
  ) {
    throw new Error(
      "test descriptor registry is not an exact inventory of separate sidecars"
    );
  }
  const descriptorBytesByPath = new Map(
    descriptorInventory.map((entry) => [
      `source/test-descriptors/${entry.path}`,
      entry.bytes
    ])
  );
  const descriptorRecords = tests.descriptorPaths.map((descriptorPath) => {
    assertPortableRelativePath(descriptorPath);
    const descriptor = JSON.parse(
      descriptorBytesByPath.get(descriptorPath).toString("utf8")
    );
    assertSchemaInstance(
      testDescriptorSchema,
      descriptor,
      `test descriptor ${descriptorPath}`
    );
    return { descriptorPath, descriptor };
  });
  const descriptors = descriptorRecords.map((record) => record.descriptor);
  assertExactIdSet(
    tests.groups.map((entry) => entry.groupId),
    [
      "schemas",
      "composition",
      "projection",
      "lifecycle",
      "isolation",
      "orchestration",
      "roles",
      "controls",
      "scoring",
      "statistics",
      "evidence",
      "integration",
      "learning",
      "portability",
      "forward"
    ],
    "test group"
  );
  const allObligationIds = [
    ...requiredRequirementIds,
    ...expectedMechanismIds
  ];
  assertExactCoverageSet(
    descriptors.map((descriptor) => descriptor.obligationId),
    allObligationIds,
    "test evidence obligation"
  );
  const groupIds = new Set(tests.groups.map((group) => group.groupId));
  const implementedExecutables = new Set();
  const testIds = new Set();
  for (const { descriptorPath, descriptor } of descriptorRecords) {
    if (testIds.has(descriptor.testId)) {
      throw new Error(`duplicate test descriptor ID: ${descriptor.testId}`);
    }
    testIds.add(descriptor.testId);
    if (
      !mechanismIdSet.has(descriptor.mechanismId) ||
      !groupIds.has(descriptor.groupId)
    ) {
      throw new Error(
        `${descriptor.testId} references an unknown mechanism or test group`
      );
    }
    if (descriptor.obligationId.startsWith("EM")) {
      if (descriptor.mechanismId !== descriptor.obligationId) {
        throw new Error(
          `${descriptor.testId} does not test its own mechanism identity`
        );
      }
    } else if (
      !requirementById
        .get(descriptor.obligationId)
        ?.mechanismIds.includes(descriptor.mechanismId)
    ) {
      throw new Error(
        `${descriptor.testId} mechanism is not traced by its requirement`
      );
    }
    if (
      (descriptor.status === "planned-unimplemented") !==
      (descriptor.executable === null)
    ) {
      throw new Error(
        `${descriptor.testId} status/executable pair is inconsistent`
      );
    }
    if (
      (descriptor.status === "planned-unimplemented" &&
        descriptor.executionIsolationClass !== "not-applicable") ||
      (descriptor.status === "implemented" &&
        ![
          "read-only-package",
          "package-root-mutating"
        ].includes(descriptor.executionIsolationClass))
    ) {
      throw new Error(
        `${descriptor.testId} status/isolation-class pair is inconsistent`
      );
    }
    if (descriptor.status === "implemented") {
      assertPortableRelativePath(descriptor.executable);
      if (
        !descriptor.executable.startsWith("tests/") ||
        !descriptor.executable.endsWith(".test.mjs") ||
        implementedExecutables.has(descriptor.executable)
      ) {
        throw new Error(
          `${descriptor.testId} has a non-test, duplicate, or unsafe executable path`
        );
      }
      implementedExecutables.add(descriptor.executable);
      const executablePath = path.join(root, descriptor.executable);
      await access(executablePath);
      const resolvedExecutable = await realpath(executablePath);
      const relativeExecutable = path.relative(root, resolvedExecutable);
      if (
        relativeExecutable.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeExecutable)
      ) {
        throw new Error(`${descriptor.testId} executable escapes the package root`);
      }
      const executableSource = await readFile(executablePath, "utf8");
      const topLevelTestCount = [
        ...executableSource.matchAll(
          /^\s*test(?:\.(?:skip|todo|only))?\s*\(/gmu
        )
      ].length;
      if (
        !/from\s+["']node:test["']/u.test(executableSource) ||
        topLevelTestCount !== 1
      ) {
        throw new Error(
          `${descriptor.testId} executable must own exactly one top-level node:test behavior`
        );
      }
      if (
        descriptor.oneSentenceBehavior.length < 24 ||
        /^Prove (?:TE|EI|EM)\d{2}\b/u.test(descriptor.oneSentenceBehavior)
      ) {
        throw new Error(
          `${descriptor.testId} lacks a precise one-behavior evidence statement`
        );
      }
    }
    for (const fixture of descriptor.fixtures) {
      assertPortableRelativePath(fixture);
      const fixturePath = path.join(root, fixture);
      await access(fixturePath);
      const resolvedFixture = await realpath(fixturePath);
      const relativeFixture = path.relative(root, resolvedFixture);
      if (
        relativeFixture.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeFixture)
      ) {
        throw new Error(
          `${descriptor.testId} fixture escapes the package root`
        );
      }
    }
    if (
      descriptor.status === "planned-unimplemented" &&
      !descriptorPath.startsWith("source/test-descriptors/planned/")
    ) {
      throw new Error(
        `${descriptor.testId} planned descriptor is outside the planned registry`
      );
    }
    if (
      descriptor.status === "implemented" &&
      !descriptorPath.startsWith("source/test-descriptors/implemented/")
    ) {
      throw new Error(
        `${descriptor.testId} implemented descriptor is outside the implemented registry`
      );
    }
  }
  const testInventory = await collectTree(path.join(root, "tests"));
  const discoveredExecutables = testInventory
    .filter((entry) => entry.path.endsWith(".test.mjs"))
    .map((entry) => `tests/${entry.path}`);
  const unregisteredExecutables = discoveredExecutables.filter(
    (executable) => !implementedExecutables.has(executable)
  );
  const missingExecutables = [...implementedExecutables].filter(
    (executable) => !discoveredExecutables.includes(executable)
  );
  if (unregisteredExecutables.length > 0 || missingExecutables.length > 0) {
    throw new Error(
      `manifest-only executable inventory mismatch: unregistered=${JSON.stringify(
        unregisteredExecutables
      )} missing=${JSON.stringify(missingExecutables)}`
    );
  }
  const releaseReady = descriptors.every(
    (descriptor) => descriptor.status === "implemented"
  );
  if (
    (releaseReady && tests.releaseStatus !== "evidence-complete") ||
    (!releaseReady && tests.releaseStatus !== "incomplete")
  ) {
    throw new Error("test evidence release status is inconsistent");
  }

  const roleRegistrySchema = await readJson(
    path.join(root, sourceSchemaDir, "role-registry.schema.json")
  );
  const roleRegistry = await readJson(
    path.join(root, "source/fragments/roles/role-registry.json")
  );
  lintSchema(roleRegistrySchema, "role-registry.schema.json");
  assertSchemaInstance(roleRegistrySchema, roleRegistry, "role-registry.json");
  assertExactIdSet(
    roleRegistry.roles
      .filter((role) => role.awarenessRoleClass)
      .map((role) => role.roleId),
    [
      "survey-executor",
      "downstream-consumer",
      "incident-classifier",
      "semantic-judge",
      "adjudicator"
    ],
    "awareness role"
  );

  const authorityRegistrySchema = await readJson(
    path.join(root, sourceSchemaDir, "authority-registry.schema.json")
  );
  const authorityRegistry = await readJson(
    path.join(root, "source/fragments/authority/authority-registry.json")
  );
  lintSchema(authorityRegistrySchema, "authority-registry.schema.json");
  assertSchemaInstance(
    authorityRegistrySchema,
    authorityRegistry,
    "authority-registry.json"
  );
  const authorityIds = new Set();
  for (const authority of authorityRegistry.authorities) {
    if (authorityIds.has(authority.authorityId)) {
      throw new Error(`duplicate authority ID: ${authority.authorityId}`);
    }
    authorityIds.add(authority.authorityId);
  }
  const unresolvedAuthorityFixture = await readJson(
    path.join(root, "source/fixtures/composition/unresolved-authority.json")
  );
  if (
    unresolvedAuthorityFixture.expected !== "invalid" ||
    policyAuthorityIds(unresolvedAuthorityFixture.policy).every((authorityId) =>
      authorityIds.has(authorityId)
    )
  ) {
    throw new Error("unresolved-authority hostile fixture did not remain invalid");
  }

  const schemaCatalogSourceSchema = await readJson(
    path.join(root, sourceSchemaDir, "schema-catalog.schema.json")
  );
  lintSchema(schemaCatalogSourceSchema, "schema-catalog.schema.json");
  assertSchemaInstance(
    schemaCatalogSourceSchema,
    schemaCatalog,
    "schema-catalog.json"
  );

  validateResolvedLifecyclePolicies(
    lifecycleManifest,
    projections,
    authorityIds
  );
  await validateLoadBearingFixtures(root, projections);
  await validateHashAndGenesisVectors(root, projections);
  return { releaseReady };
}

function policyAuthorityIds(policy) {
  const ids = [];
  if (policy.commandAuthority?.authorityId) {
    ids.push(policy.commandAuthority.authorityId);
  }
  ids.push(...(policy.commandAuthority?.authorityIds ?? []));
  if (policy.guardOwnerId) ids.push(policy.guardOwnerId);
  for (const action of policy.orderedActionExecutors ?? []) {
    ids.push(action.executorAuthorityId);
  }
  ids.push(...(policy.requiredAttestationAuthorityIds ?? []));
  return ids;
}

function validateResolvedLifecyclePolicies(
  lifecycleManifest,
  projections,
  authorityIds
) {
  const participantSchema = schemaProjection(
    projections,
    "transition-participant-policy.schema.json"
  );
  const transitionSchema = schemaProjection(
    projections,
    "lifecycle-transition.schema.json"
  );
  const resolution = lifecycleManifest.participantPolicyResolution;
  const transitionIds = new Set(
    Object.values(lifecycleManifest.machines)
      .flat()
      .map((tuple) => tuple.split("|")[0])
  );
  for (const transitionId of Object.keys(resolution.transitionOverrides)) {
    if (!transitionIds.has(transitionId)) {
      throw new Error(`participant policy override is orphaned: ${transitionId}`);
    }
  }
  let resolvedCount = 0;
  for (const [machineId, tuples] of Object.entries(lifecycleManifest.machines)) {
    const defaultTemplateId = resolution.selectors[machineId];
    if (!defaultTemplateId) {
      throw new Error(`no participant policy selector for ${machineId}`);
    }
    for (const encodedTuple of tuples) {
      const [transitionId, eventType, fromState, toState] =
        encodedTuple.split("|");
      const templateId =
        resolution.transitionOverrides[transitionId] ?? defaultTemplateId;
      const template = resolution.templates[templateId];
      if (!template) {
        throw new Error(
          `${transitionId} resolves missing participant template ${templateId}`
        );
      }
      const unresolved = policyAuthorityIds(template).filter(
        (authorityId) => !authorityIds.has(authorityId)
      );
      if (unresolved.length > 0) {
        throw new Error(
          `${transitionId} resolves unregistered authorities: ${unresolved.join(", ")}`
        );
      }
      const participantPolicyId = `participants.${transitionId}`;
      assertSchemaInstance(
        participantSchema,
        {
          schemaVersion: "1.0.0",
          hashProfileId: HASH_PROFILE_ID,
          participantPolicyId,
          ...template
        },
        participantPolicyId
      );
      assertSchemaInstance(
        transitionSchema,
        {
          schemaVersion: "1.0.0",
          hashProfileId: HASH_PROFILE_ID,
          transitionId,
          machineId,
          eventType,
          fromState,
          toState,
          creationClass: fromState === "[*]" ? "absent" : "existing",
          guardId: `guard.${transitionId}`,
          actionPipelineId: `action.${transitionId}`,
          mutationId: `mutation.${transitionId}`,
          participantPolicyId,
          idempotencyClass:
            fromState === "[*]" ? "create_once" : "exact_replay",
          failureRoute: `quarantine.${machineId}`,
          learningTriggerPolicyId:
            lifecycleManifest.learningTriggerPolicyOverrides[transitionId] ??
            "none"
        },
        `transition ${transitionId}`
      );
      resolvedCount += 1;
    }
  }
  if (
    resolvedCount !== lifecycleManifest.transitionCount ||
    lifecycleManifest.actionPipelineResolution.requiredOrderedStages.length < 4 ||
    lifecycleManifest.mutationResolution.atomicOutputs.join("|") !==
      "event|materializedState|semanticCursor|pendingOutbox"
  ) {
    throw new Error("lifecycle policy/action/mutation resolution is incomplete");
  }
}

async function validateLoadBearingFixtures(root, projections) {
  const fixtureSet = await readJson(
    path.join(root, "source/fixtures/schemas/load-bearing-contracts.json")
  );
  if (
    fixtureSet.schemaVersion !== "1.0.0" ||
    !Array.isArray(fixtureSet.fixtures) ||
    fixtureSet.fixtures.length < 12
  ) {
    throw new Error("load-bearing schema fixture registry is incomplete");
  }
  const fixtureIds = new Set();
  let positiveCount = 0;
  let hostileCount = 0;
  for (const fixture of fixtureSet.fixtures) {
    if (fixtureIds.has(fixture.fixtureId)) {
      throw new Error(`duplicate contract fixture ID: ${fixture.fixtureId}`);
    }
    fixtureIds.add(fixture.fixtureId);
    const rootSchema = schemaProjection(projections, fixture.schema);
    const selectedSchema = fixture.definitionRef
      ? resolveInternalRef(rootSchema, fixture.definitionRef)
      : rootSchema;
    const errors = validateSchemaInstance(selectedSchema, fixture.instance);
    if (fixture.expected === "valid") {
      positiveCount += 1;
      if (errors.length > 0) {
        throw new Error(
          `${fixture.fixtureId} unexpectedly failed:\n${errors.join("\n")}`
        );
      }
    } else if (fixture.expected === "invalid") {
      hostileCount += 1;
      if (errors.length === 0) {
        throw new Error(`${fixture.fixtureId} hostile instance was accepted`);
      }
    } else {
      throw new Error(`${fixture.fixtureId} has unknown expected result`);
    }
  }
  if (positiveCount < 5 || hostileCount < 7) {
    throw new Error("load-bearing fixtures lack positive/hostile branch coverage");
  }
}

async function validateGeneratedTargetOwnership(root, projections) {
  const generatedDirectories = ["schemas", "references", "scripts", "assets"];
  const expected = new Set(projections.keys());
  for (const directory of generatedDirectories) {
    let entries;
    try {
      entries = await collectTree(path.join(root, directory));
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      const relativePath = `${directory}/${entry.path}`;
      if (!expected.has(relativePath)) {
        throw new Error(`unowned generated target: ${relativePath}`);
      }
    }
  }
}

async function validateHashAndGenesisVectors(root, projections) {
  const profile = await readJson(
    path.join(root, "source/fragments/evidence/hash-profile.json")
  );
  assertSchemaInstance(
    schemaProjection(projections, "hash-profile.schema.json"),
    {
      profileId: profile.profileId,
      semanticAlgorithm: profile.semanticAlgorithm,
      canonicalJson: profile.canonicalJson,
      framing: profile.framing,
      binaryEncoding: profile.binaryEncoding,
      digestEncoding: profile.digestEncoding,
      rawFileProfileId: profile.rawFileProfileId,
      namespace: profile.namespace
    },
    "hash-profile.json"
  );
  if (
    profile.manifestTag !== "evaluator-package-manifest/v1" ||
    profile.finalPackageTag !== "evaluator-package/v1" ||
    profile.absentStateTag !== "absent-authoritative-state/v1" ||
    canonicalize(profile.packageRootKinds) !==
      canonicalize({
        "candidate-package": { exclusions: [] },
        "evaluator-payload": { exclusions: ["package.manifest.json"] }
      })
  ) {
    throw new Error("hash profile package/genesis tag contract drifted");
  }
  const vectors = await readJson(
    path.join(root, "source/fragments/evidence/hash-vectors.json")
  );
  for (const vector of vectors.semantic) {
    if (
      canonicalize(vector.value) !== vector.canonicalJson ||
      semanticHash(vector.tag, vector.value) !== vector.expectedDigest
    ) {
      throw new Error(`semantic hash vector mismatch: ${vector.vectorId}`);
    }
  }
  for (const vector of vectors.raw) {
    if (
      rawSha256(Buffer.from(vector.utf8, "utf8")) !== vector.expectedDigest
    ) {
      throw new Error(`raw hash vector mismatch: ${vector.vectorId}`);
    }
  }
  for (const vector of vectors.inventory) {
    const result = foldPackageInventory(
      vector.rootKind,
      vector.entries.map((entry) => ({
        path: entry.path,
        mode: entry.mode,
        bytes: Buffer.from(entry.utf8, "utf8")
      })),
      vector.exclusions
    );
    if (
      canonicalize(result.inventory) !== canonicalize(vector.expectedInventory) ||
      result.root !== vector.expectedRoot
    ) {
      throw new Error(`inventory vector mismatch: ${vector.vectorId}`);
    }
  }
  const mustReject = [
    () =>
      foldPackageInventory(
        "candidate-package",
        [],
        ["package.manifest.json"]
      ),
    () =>
      foldPackageInventory(
        "evaluator-payload",
        [],
        ["package.manifest.json", "generated.lock.json"]
      ),
    () =>
      foldPackageInventory(
        "candidate-package",
        [
          { path: "A", mode: "0644", bytes: Buffer.alloc(0) },
          { path: "a", mode: "0644", bytes: Buffer.alloc(0) }
        ],
        []
      ),
    () =>
      foldPackageInventory(
        "candidate-package",
        [{ path: "run", mode: "0744", bytes: Buffer.alloc(0) }],
        []
      )
  ];
  for (const reject of mustReject) {
    let rejected = false;
    try {
      reject();
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("negative hash/inventory vector was accepted");
  }

  const genesisVectors = await readJson(
    path.join(root, "source/fragments/evidence/genesis-vectors.json")
  );
  const absent = absentAuthoritativeStateRoot(
    genesisVectors.absent.input.machineId,
    genesisVectors.absent.input.objectId,
    genesisVectors.absent.input.schemaVersion
  );
  if (absent !== genesisVectors.absent.expectedSentinel) {
    throw new Error("absent-authoritative-state vector mismatch");
  }
  const genesis = parentStagedGenesis(genesisVectors.parentStaged.input);
  for (const [field, expected] of Object.entries(
    genesisVectors.parentStaged.expected
  )) {
    if (genesis[field] !== expected) {
      throw new Error(`parent-staged genesis vector mismatch: ${field}`);
    }
  }
  if (
    genesis.semanticState.revision !== 0 ||
    genesis.authoritativeStateCore.eventLedger.length !== 0 ||
    genesis.authoritativeStateCore.outboxLedger.length !== 0
  ) {
    throw new Error("parent-staged genesis violates revision-zero empty-ledger rule");
  }
  for (const negative of genesisVectors.negative.filter((vector) =>
    vector.field.startsWith("initialSemanticPayload.")
  )) {
    const injected = structuredClone(genesisVectors.parentStaged.input);
    injected.initialSemanticPayload[
      negative.field.slice("initialSemanticPayload.".length)
    ] = negative.forbiddenValue;
    let rejected = false;
    try {
      parentStagedGenesis(injected);
    } catch {
      rejected = true;
    }
    if (!rejected) {
      throw new Error(`negative genesis vector was accepted: ${negative.vectorId}`);
    }
  }
}

async function sourceDigestRecords(root, sourcePaths) {
  const records = [];
  for (const sourcePath of [...new Set(sourcePaths)].sort()) {
    const bytes = await readFile(path.join(root, sourcePath));
    records.push({ path: sourcePath, rawFileSha256: rawSha256(bytes) });
  }
  return records;
}

async function buildGeneratedLock(root, projections, sourceRoot, compilerRoot) {
  const generatedEntries = [...projections.values()]
    .map((target) => ({
      path: target.path,
      mode: target.mode,
      bytes: target.bytes
    }))
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"))
    );
  const generatedTree = foldNamedTree("generated-target-tree", generatedEntries);
  const generatedTargets = [];
  for (const target of [...projections.values()].sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"))
  )) {
    const sources = await sourceDigestRecords(root, target.sourcePaths);
    generatedTargets.push({
      ...inventoryEntry(target),
      recipeId: target.recipeId,
      recipeDigest: semanticHash("projection-recipe/v1", {
        recipeId: target.recipeId
      }),
      sourceDigests: sources.map((source) => source.rawFileSha256),
      sourceAggregateDigest: semanticHash("projection-source-aggregate/v1", {
        recipeId: target.recipeId,
        sources
      }),
      compilerDigest: compilerRoot
    });
  }
  const lock = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    exclusions: LOCK_EXCLUSIONS,
    sourceRoot,
    compilerRoot,
    generatedTargetRoot: generatedTree.root,
    generatedTargets
  };
  return {
    bytes: canonicalBytes(lock),
    value: lock
  };
}

async function assertTargetBytes(root, desired) {
  const dirty = [];
  for (const target of desired.values()) {
    if (!(await bytesEqual(path.join(root, target.path), target.bytes))) {
      dirty.push(target.path);
    }
  }
  if (dirty.length > 0) {
    throw new Error(`generated targets are stale or absent:\n${dirty.join("\n")}`);
  }
}

async function writeTargets(root, desired) {
  for (const target of desired.values()) {
    const mode = target.mode === "0755" ? 0o755 : 0o644;
    await writeFileAtomic(path.join(root, target.path), target.bytes, mode);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const defaultRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.."
  );
  const root = await realpath(path.resolve(options.root ?? defaultRoot));
  const manifestDir = relativeWithin(root, options.manifestDir, "manifest directory");
  const sourceSchemaDir = relativeWithin(
    root,
    options.sourceSchemaDir,
    "source schema directory"
  );
  await access(path.join(root, sourceSchemaDir));

  const schemaCatalogPath = `${manifestDir}/schema-catalog.json`;
  const lifecycleManifestPath = `${manifestDir}/lifecycles.json`;
  const schemaCatalog = await readJson(path.join(root, schemaCatalogPath));
  const lifecycleManifest = await readJson(path.join(root, lifecycleManifestPath));
  validateSchemaCatalog(schemaCatalog);
  validateLifecycleManifest(lifecycleManifest);

  const projections = await createProjectionMap({
    root,
    schemaCatalog,
    schemaCatalogPath,
    lifecycleManifest
  });
  validateGeneratedSchemas(projections, schemaCatalog);
  await validateGeneratedTargetOwnership(root, projections);
  const authoredStatus = await validateAuthoredSources({
    root,
    manifestDir,
    sourceSchemaDir,
    projections,
    schemaCatalog,
    lifecycleManifest
  });
  if (options.releaseCheck && !authoredStatus.releaseReady) {
    throw new Error(
      "release check failed: planned-unimplemented test evidence remains"
    );
  }

  const sourceEntries = await collectTree(path.join(root, "source"));
  const compilerEntries = await collectTree(
    path.join(root, "source/executables/compiler")
  );
  const sharedCompilerEntries = (
    await collectTree(path.join(root, "source/executables/shared"))
  ).map((entry) => ({
    ...entry,
    path: `shared/${entry.path}`
  }));
  const analyticalContractCompilerEntries = (
    await collectTree(path.join(root, "source/executables/statistics"))
  )
    .filter((entry) =>
      ["contracts.mjs", "input-boundary.mjs"].includes(entry.path)
    )
    .map((entry) => ({
      ...entry,
      path: `statistics/${entry.path}`
    }));
  const sourceTree = foldNamedTree("canonical-source-tree", sourceEntries);
  const compilerTree = foldNamedTree("compiler-tree", [
    ...compilerEntries,
    ...sharedCompilerEntries,
    ...analyticalContractCompilerEntries
  ]);
  const generatedLock = await buildGeneratedLock(
    root,
    projections,
    sourceTree.root,
    compilerTree.root
  );
  assertSchemaInstance(
    schemaProjection(projections, "generated-lock.schema.json"),
    generatedLock.value,
    "generated.lock.json"
  );

  const desiredBeforeManifest = new Map(projections);
  desiredBeforeManifest.set(GENERATED_LOCK_PATH, {
    path: GENERATED_LOCK_PATH,
    bytes: generatedLock.bytes,
    mode: "0644",
    recipeId: "generated-lock/v1",
    sourcePaths: []
  });
  const overrideBytes = new Map(
    [...desiredBeforeManifest.values()].map((target) => [target.path, target.bytes])
  );
  const modeOverrides = new Map(
    [...desiredBeforeManifest.values()].map((target) => [target.path, target.mode])
  );
  const payloadEntries = await collectTree(root, {
    exclusions: PACKAGE_EXCLUSIONS,
    overrides: overrideBytes,
    modeOverrides
  });
  const payload = foldPackageInventory(
    "evaluator-payload",
    payloadEntries,
    PACKAGE_EXCLUSIONS
  );
  const packageManifest = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    skillName: "survey-skill-evaluator",
    rootKind: "evaluator-payload",
    exclusions: PACKAGE_EXCLUSIONS,
    entries: payload.inventory,
    entryCount: payload.inventory.length,
    payloadRoot: payload.root
  };
  assertSchemaInstance(
    schemaProjection(projections, "package-manifest.schema.json"),
    packageManifest,
    "package.manifest.json"
  );
  const manifestBytes = canonicalBytes(packageManifest);
  const manifestDigest = semanticHash(
    "evaluator-package-manifest/v1",
    packageManifest
  );
  const packageDigest = evaluatorPackageDigest(manifestDigest, payload.root);

  const desired = new Map(desiredBeforeManifest);
  desired.set(PACKAGE_MANIFEST_PATH, {
    path: PACKAGE_MANIFEST_PATH,
    bytes: manifestBytes,
    mode: "0644",
    recipeId: "package-manifest/v1",
    sourcePaths: []
  });

  if (options.check) {
    await assertTargetBytes(root, desired);
  } else {
    await writeTargets(root, desired);
  }

  if (options.verifyPackage) {
    const actualEntries = await collectTree(root, {
      exclusions: PACKAGE_EXCLUSIONS
    });
    const actualPayload = foldPackageInventory(
      "evaluator-payload",
      actualEntries,
      PACKAGE_EXCLUSIONS
    );
    if (
      actualPayload.root !== payload.root ||
      JSON.stringify(actualPayload.inventory) !== JSON.stringify(payload.inventory)
    ) {
      throw new Error("on-disk evaluator payload does not match its manifest");
    }
    const actualManifest = await readFile(path.join(root, PACKAGE_MANIFEST_PATH));
    if (!actualManifest.equals(manifestBytes)) {
      throw new Error("package manifest bytes are not canonical/current");
    }
  }

  process.stdout.write(
    `${JSON.stringify({
      schemaCount: schemaCatalog.schemas.length,
      machineCount: Object.keys(lifecycleManifest.machines).length,
      transitionCount: lifecycleManifest.transitionCount,
      generatedTargetCount: projections.size,
      sourceRoot: sourceTree.root,
      compilerRoot: compilerTree.root,
      generatedTargetRoot: generatedLock.value.generatedTargetRoot,
      payloadRoot: payload.root,
      manifestDigest,
      evaluatorPackageDigest: packageDigest,
      releaseReady: authoredStatus.releaseReady
    })}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
