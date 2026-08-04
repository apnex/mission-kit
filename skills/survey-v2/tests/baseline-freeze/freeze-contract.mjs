import { sha256Bytes, sha256Value } from "../../source/executables/runtime/lib/canonical.mjs";

const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const RAW_DIGEST = /^[0-9a-f]{64}$/u;

export class BaselineFreezeContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "BaselineFreezeContractError";
    this.code = "BASELINE_FREEZE_INVALID";
  }
}

function fail(message) {
  throw new BaselineFreezeContractError(message);
}

function record(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    fail(`${label} must be a plain object`);
  }
  return value;
}

function exactKeys(value, keys, label) {
  record(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} has unexpected fields`);
  }
}

function literal(value, expected, label) {
  if (value !== expected) fail(`${label} must equal ${JSON.stringify(expected)}`);
}

function rawDigest(value, label) {
  if (typeof value !== "string" || !RAW_DIGEST.test(value)) {
    fail(`${label} must be a lowercase SHA-256`);
  }
}

function digest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    fail(`${label} must be a prefixed lowercase SHA-256`);
  }
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) fail(`${label} must be a positive integer`);
}

function inventory(value, expectedCount, label) {
  exactKeys(
    value,
    ["algorithm", "contentAggregate", "entries", "fileCount", "totalBytes"],
    label
  );
  literal(value.algorithm, "sha256-canonical-json(entries)/v1", `${label}.algorithm`);
  literal(value.fileCount, expectedCount, `${label}.fileCount`);
  positiveInteger(value.totalBytes, `${label}.totalBytes`);
  digest(value.contentAggregate, `${label}.contentAggregate`);
  if (!Array.isArray(value.entries) || value.entries.length !== expectedCount) {
    fail(`${label}.entries must contain exactly ${expectedCount} members`);
  }
  const seen = new Set();
  let totalBytes = 0;
  let previous = null;
  for (const [index, entry] of value.entries.entries()) {
    exactKeys(entry, ["byteLength", "mode", "path", "rawFileSha256"], `${label}.entries[${index}]`);
    if (
      typeof entry.path !== "string" ||
      entry.path.length === 0 ||
      entry.path.startsWith("/") ||
      entry.path.split("/").some((part) => part === "" || part === "." || part === "..")
    ) {
      fail(`${label}.entries[${index}].path is unsafe`);
    }
    if (seen.has(entry.path) || (previous !== null && previous >= entry.path)) {
      fail(`${label}.entries must be unique and bytewise ordered`);
    }
    seen.add(entry.path);
    previous = entry.path;
    if (!["0644", "0755"].includes(entry.mode)) fail(`${label}.entries[${index}].mode is invalid`);
    positiveInteger(entry.byteLength, `${label}.entries[${index}].byteLength`);
    rawDigest(entry.rawFileSha256, `${label}.entries[${index}].rawFileSha256`);
    totalBytes += entry.byteLength;
  }
  literal(totalBytes, value.totalBytes, `${label}.totalBytes`);
  literal(sha256Value(value.entries), value.contentAggregate, `${label}.contentAggregate`);
}

export function validateCanonicalV1Freeze(value) {
  exactKeys(
    value,
    [
      "assertions",
      "discovery",
      "installedCopy",
      "inventory",
      "kind",
      "ratifiedAggregate",
      "recovery",
      "schemaVersion",
      "source"
    ],
    "canonical v1 freeze"
  );
  literal(value.schemaVersion, "1.0.0", "canonical v1 freeze.schemaVersion");
  literal(value.kind, "CanonicalSurveyV1Freeze", "canonical v1 freeze.kind");
  exactKeys(value.source, ["commit", "gitTree", "path", "repository"], "canonical v1 freeze.source");
  literal(value.source.repository, "apnex/mission-kit", "canonical v1 freeze.source.repository");
  literal(value.source.path, "skills/survey", "canonical v1 freeze.source.path");
  literal(value.source.commit, "8c511bd01d2200e93ef33a44b85f277380b8f8ff", "canonical v1 freeze.source.commit");
  literal(value.source.gitTree, "5af20e397ae30bd2a744c348c99f2ba57ed2ad7e", "canonical v1 freeze.source.gitTree");
  exactKeys(value.assertions, ["format", "initialization", "total", "validation"], "canonical v1 freeze.assertions");
  literal(value.assertions.initialization, 17, "canonical v1 freeze.assertions.initialization");
  literal(value.assertions.format, 12, "canonical v1 freeze.assertions.format");
  literal(value.assertions.validation, 24, "canonical v1 freeze.assertions.validation");
  literal(value.assertions.total, 53, "canonical v1 freeze.assertions.total");
  inventory(value.inventory, 10, "canonical v1 freeze.inventory");
  exactKeys(
    value.ratifiedAggregate,
    ["algorithm", "authority", "domain", "value"],
    "canonical v1 freeze.ratifiedAggregate"
  );
  digest(value.ratifiedAggregate.value, "canonical v1 freeze.ratifiedAggregate.value");
  literal(
    value.ratifiedAggregate.algorithm,
    "sha256-canonical-json({domain,members})/v1",
    "canonical v1 freeze.ratifiedAggregate.algorithm"
  );
  literal(
    value.ratifiedAggregate.domain,
    "mission-kit-survey-v1-freeze/v1",
    "canonical v1 freeze.ratifiedAggregate.domain"
  );
  const aggregateMembers = value.inventory.entries.map(
    ({ path, byteLength, rawFileSha256 }) => ({
      path,
      bytes: byteLength,
      sha256: `sha256:${rawFileSha256}`
    })
  );
  literal(
    sha256Value({
      domain: value.ratifiedAggregate.domain,
      members: aggregateMembers
    }),
    "sha256:943ab3f2e10cb96077ce1c225bab3b1850e40da58ba82ddfb65d64d28efe859c",
    "canonical v1 freeze.ratifiedAggregate.value"
  );
  literal(
    value.ratifiedAggregate.value,
    sha256Value({
      domain: value.ratifiedAggregate.domain,
      members: aggregateMembers
    }),
    "canonical v1 freeze.ratifiedAggregate.value"
  );
  exactKeys(value.installedCopy, ["expectedRelationship", "path"], "canonical v1 freeze.installedCopy");
  literal(value.installedCopy.expectedRelationship, "byte-identical", "canonical v1 freeze.installedCopy.expectedRelationship");
  exactKeys(value.discovery, ["entrypoint", "routingClass", "skillName", "triggerSource"], "canonical v1 freeze.discovery");
  literal(value.discovery.skillName, "survey", "canonical v1 freeze.discovery.skillName");
  exactKeys(value.recovery, ["method", "rehearsalGate"], "canonical v1 freeze.recovery");
  literal(value.recovery.method, "git-archive-subtree", "canonical v1 freeze.recovery.method");
  return value;
}

export function validateProtocolV1Freeze(value) {
  exactKeys(
    value,
    [
      "compatibilityPolicy",
      "kind",
      "normalizedTestResult",
      "packageManifest",
      "projectionLock",
      "protocol",
      "representativeSessions",
      "schemaVersion",
      "source",
      "testManifest"
    ],
    "protocol v1 freeze"
  );
  literal(value.schemaVersion, "1.0.0", "protocol v1 freeze.schemaVersion");
  literal(value.kind, "SurveyProtocolV1Freeze", "protocol v1 freeze.kind");
  exactKeys(
    value.source,
    ["gitTree", "path", "recoveredCommit", "sourceCommit", "trackedPathCount"],
    "protocol v1 freeze.source"
  );
  literal(value.source.sourceCommit, "a9e569415d9bb07da097ea6b5e84821ed888279f", "protocol v1 freeze.source.sourceCommit");
  literal(value.source.recoveredCommit, "294b565ce5684b90ca6a5a585483c6f2ad48b80a", "protocol v1 freeze.source.recoveredCommit");
  literal(value.source.gitTree, "3b81de74b9e2955638e5515d549e6af64a2b48b5", "protocol v1 freeze.source.gitTree");
  literal(value.source.trackedPathCount, 244, "protocol v1 freeze.source.trackedPathCount");
  for (const [name, expectedPath, expectedCount] of [
    ["testManifest", "tests/test-evidence.manifest.json", 63],
    ["packageManifest", "survey-v2.package.json", 244]
  ]) {
    exactKeys(value[name], ["entryCount", "path", "rawFileSha256"], `protocol v1 freeze.${name}`);
    literal(value[name].path, expectedPath, `protocol v1 freeze.${name}.path`);
    literal(value[name].entryCount, expectedCount, `protocol v1 freeze.${name}.entryCount`);
    rawDigest(value[name].rawFileSha256, `protocol v1 freeze.${name}.rawFileSha256`);
  }
  exactKeys(value.projectionLock, ["aggregateDigest", "path", "rawFileSha256"], "protocol v1 freeze.projectionLock");
  literal(
    value.projectionLock.aggregateDigest,
    "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c",
    "protocol v1 freeze.projectionLock.aggregateDigest"
  );
  rawDigest(value.projectionLock.rawFileSha256, "protocol v1 freeze.projectionLock.rawFileSha256");
  exactKeys(value.protocol, ["canonicalDigest", "path", "rawFileSha256"], "protocol v1 freeze.protocol");
  digest(value.protocol.canonicalDigest, "protocol v1 freeze.protocol.canonicalDigest");
  rawDigest(value.protocol.rawFileSha256, "protocol v1 freeze.protocol.rawFileSha256");
  exactKeys(value.normalizedTestResult, ["rawFileSha256", "value"], "protocol v1 freeze.normalizedTestResult");
  rawDigest(value.normalizedTestResult.rawFileSha256, "protocol v1 freeze.normalizedTestResult.rawFileSha256");
  literal(
    sha256Bytes(
      Buffer.from(
        `${JSON.stringify(value.normalizedTestResult.value, null, 2)}\n`,
        "utf8"
      )
    ).slice("sha256:".length),
    value.normalizedTestResult.rawFileSha256,
    "protocol v1 freeze.normalizedTestResult.rawFileSha256"
  );
  literal(value.normalizedTestResult.value.registeredTestCount, 63, "protocol v1 freeze normalized registered count");
  literal(value.normalizedTestResult.value.passedTestCount, 63, "protocol v1 freeze normalized pass count");
  literal(value.normalizedTestResult.value.failedTestCount, 0, "protocol v1 freeze normalized failure count");
  exactKeys(value.representativeSessions, ["exporter", "requiredProjectionDigest", "states"], "protocol v1 freeze.representativeSessions");
  if (
    JSON.stringify(value.representativeSessions.states) !==
    JSON.stringify(["initialized", "round_1_q1_awaiting", "awaiting_ratification", "intent_captured"])
  ) {
    fail("protocol v1 freeze representative session geometry is invalid");
  }
  exactKeys(
    value.compatibilityPolicy,
    [
      "exactMatch",
      "mismatch",
      "productionRuntimeEnforcementClaimed",
      "requiredPackage",
      "scope"
    ],
    "protocol v1 freeze.compatibilityPolicy"
  );
  literal(value.compatibilityPolicy.exactMatch, "admit-and-resume", "protocol v1 freeze.compatibilityPolicy.exactMatch");
  literal(value.compatibilityPolicy.mismatch, "refuse-before-runtime", "protocol v1 freeze.compatibilityPolicy.mismatch");
  literal(value.compatibilityPolicy.productionRuntimeEnforcementClaimed, false, "protocol v1 freeze compatibility claim");
  exactKeys(
    value.compatibilityPolicy.requiredPackage,
    ["id", "projectionDigest", "protocolDigest", "version"],
    "protocol v1 freeze.compatibilityPolicy.requiredPackage"
  );
  literal(
    value.compatibilityPolicy.requiredPackage.projectionDigest,
    value.projectionLock.aggregateDigest,
    "protocol v1 freeze required package projection"
  );
  literal(
    value.compatibilityPolicy.requiredPackage.protocolDigest,
    value.protocol.canonicalDigest,
    "protocol v1 freeze required package protocol"
  );
  return value;
}

export function validateSharedSchemaFreeze(value) {
  exactKeys(
    value,
    ["catalog", "inventory", "kind", "schemaIds", "schemaVersion", "source", "testCount", "transitiveClosure", "validators"],
    "shared schema freeze"
  );
  literal(value.schemaVersion, "1.0.0", "shared schema freeze.schemaVersion");
  literal(value.kind, "SharedSchemaV1Freeze", "shared schema freeze.kind");
  exactKeys(value.source, ["commit", "gitTree", "path"], "shared schema freeze.source");
  literal(value.source.commit, "8c511bd01d2200e93ef33a44b85f277380b8f8ff", "shared schema freeze.source.commit");
  literal(value.source.gitTree, "e419bc796ed780ed25a1a39e2f560f26e5bc13ea", "shared schema freeze.source.gitTree");
  literal(value.testCount, 44, "shared schema freeze.testCount");
  inventory(value.inventory, 16, "shared schema freeze.inventory");
  const expectedSchemaIds = [
    "urn:mission-kit:schemas:common:resource-metadata:v1alpha1",
    "urn:mission-kit:schemas:question:choice-response:v1alpha1",
    "urn:mission-kit:schemas:question:v1alpha1"
  ];
  literal(
    JSON.stringify(value.schemaIds),
    JSON.stringify(expectedSchemaIds),
    "shared schema freeze.schemaIds"
  );
  exactKeys(value.catalog, ["path", "rawFileSha256", "resourceBindings"], "shared schema freeze.catalog");
  literal(value.catalog.path, "catalog.json", "shared schema freeze.catalog.path");
  literal(
    value.catalog.rawFileSha256,
    "edf53731587fb85bc30589a12a276d01555e79541900576dda4390ce358e36b4",
    "shared schema freeze.catalog.rawFileSha256"
  );
  if (!Array.isArray(value.catalog.resourceBindings) || value.catalog.resourceBindings.length !== 1) {
    fail("shared schema freeze catalog must bind exactly one resource");
  }
  literal(
    JSON.stringify(value.catalog.resourceBindings[0]),
    JSON.stringify({
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "Question",
      schemaId: "urn:mission-kit:schemas:question:v1alpha1",
      semanticValidator: "question/v1alpha1/question.validator.mjs"
    }),
    "shared schema freeze catalog resource binding"
  );
  if (!Array.isArray(value.validators) || value.validators.length !== 1) {
    fail("shared schema freeze must bind exactly one semantic validator");
  }
  literal(
    JSON.stringify(value.validators[0]),
    JSON.stringify({
      path: "question/v1alpha1/question.validator.mjs",
      rawFileSha256: "4ea3d752f2b846448f131b9a8fc479dc39576bb3665816b354bcbc78491f2bc9"
    }),
    "shared schema freeze validator"
  );
  const expectedClosure = [
    {
      id: "urn:mission-kit:schemas:question:v1alpha1",
      path: "question/v1alpha1/question.schema.json",
      semanticDigest:
        "sha256:226ea872a1f246e43c1060ca0e52dc9f50ba702a13e673e55d9941234f7f31ae",
      references: [
        "urn:mission-kit:schemas:common:resource-metadata:v1alpha1",
        "urn:mission-kit:schemas:question:choice-response:v1alpha1"
      ]
    },
    {
      id: "urn:mission-kit:schemas:common:resource-metadata:v1alpha1",
      path: "common/v1alpha1/resource-metadata.schema.json",
      semanticDigest:
        "sha256:6b693b4cee7a36a7df0d072b0f1965cf14ce51f88c93efdef8f0b6a2039ec64a",
      references: []
    },
    {
      id: "urn:mission-kit:schemas:question:choice-response:v1alpha1",
      path: "question/v1alpha1/choice-response.schema.json",
      semanticDigest:
        "sha256:504b4858ac15217d6df0e560bca4920de7667e49c630cebc1e7a57009872a632",
      references: []
    }
  ];
  literal(
    JSON.stringify(value.transitiveClosure),
    JSON.stringify(expectedClosure),
    "shared schema freeze.transitiveClosure"
  );
  const inventoryByPath = new Map(
    value.inventory.entries.map((entry) => [entry.path, entry])
  );
  for (const entry of expectedClosure) {
    if (!inventoryByPath.has(entry.path)) {
      fail(`shared schema freeze closure path ${entry.path} is absent from inventory`);
    }
    digest(entry.semanticDigest, `shared schema freeze semantic digest ${entry.id}`);
  }
  return value;
}

export function validateTestDisposition(value) {
  exactKeys(value, ["entries", "kind", "schemaVersion", "semantics", "sourceManifest"], "test disposition");
  literal(value.schemaVersion, "1.0.0", "test disposition.schemaVersion");
  literal(value.kind, "ProtocolV1TestDisposition", "test disposition.kind");
  exactKeys(
    value.sourceManifest,
    ["entryCount", "identityAggregate", "path", "rawFileSha256"],
    "test disposition.sourceManifest"
  );
  literal(
    value.sourceManifest.path,
    "tests/test-evidence.manifest.json",
    "test disposition.sourceManifest.path"
  );
  literal(value.sourceManifest.entryCount, 63, "test disposition.sourceManifest.entryCount");
  literal(
    value.sourceManifest.rawFileSha256,
    "b9f059f3509986f080d2b65d7c187cfd2a8b07a76485fdc2bf01e69b04a9cb74",
    "test disposition.sourceManifest.rawFileSha256"
  );
  literal(
    value.sourceManifest.identityAggregate,
    "sha256:d2e1013dca326570500edf71b57fada1e16a55684483eebc06ea3d9dcf5047a8",
    "test disposition.sourceManifest.identityAggregate"
  );
  exactKeys(
    value.semantics,
    ["replacedByV2Equivalent", "retained", "retiredWithProtocolV1"],
    "test disposition.semantics"
  );
  if (!Array.isArray(value.entries) || value.entries.length !== 63) {
    fail("test disposition must contain exactly 63 entries");
  }
  const ids = new Set();
  const paths = new Set();
  for (const [index, entry] of value.entries.entries()) {
    exactKeys(
      entry,
      ["classification", "descriptorPath", "retirementClause", "testId", "v2Evidence"],
      `test disposition.entries[${index}]`
    );
    if (
      typeof entry.testId !== "string" ||
      !entry.testId.startsWith("urn:mission-kit:survey-v2:test:") ||
      typeof entry.descriptorPath !== "string" ||
      !entry.descriptorPath.endsWith(".test.json")
    ) {
      fail("test disposition entries must name valid predecessor identities and paths");
    }
    if (ids.has(entry.testId) || paths.has(entry.descriptorPath)) {
      fail("test disposition entries must be exactly-once by identity and path");
    }
    ids.add(entry.testId);
    paths.add(entry.descriptorPath);
    if (!["retained", "replaced-by-v2-equivalent", "retired-with-protocol-v1"].includes(entry.classification)) {
      fail(`test disposition.entries[${index}].classification is invalid`);
    }
    if (entry.classification === "retained") {
      if (entry.v2Evidence !== null || entry.retirementClause !== null) {
        fail("retained disposition cannot name replacement or retirement evidence");
      }
    } else if (entry.classification === "replaced-by-v2-equivalent") {
      if (
        typeof entry.v2Evidence !== "string" ||
        !entry.v2Evidence.startsWith("urn:mission-kit:survey-v2:test:v2-") ||
        entry.retirementClause !== null
      ) {
        fail("replacement disposition must name one v2 test and no retirement clause");
      }
    } else if (
      entry.v2Evidence !== null ||
      typeof entry.retirementClause !== "string" ||
      entry.retirementClause.length < 8
    ) {
      fail("retirement disposition must name one ratified design clause and no v2 test");
    }
  }
  literal(
    sha256Value(
      value.entries.map(({ testId, descriptorPath }) => ({
        id: testId,
        path: descriptorPath
      }))
    ),
    value.sourceManifest.identityAggregate,
    "test disposition predecessor identity aggregate"
  );
  return value;
}

export function validateDiscoveryRoutingFreeze(value) {
  exactKeys(
    value,
    [
      "activeDiscoveryRoots",
      "kind",
      "operationalDiscovery",
      "repositoryCatalogObservation",
      "routingSnapshot",
      "schemaVersion",
      "staging"
    ],
    "discovery routing freeze"
  );
  literal(value.schemaVersion, "1.0.0", "discovery routing freeze.schemaVersion");
  literal(value.kind, "SurveyV1DiscoveryRoutingFreeze", "discovery routing freeze.kind");
  if (
    JSON.stringify(value.activeDiscoveryRoots) !==
    JSON.stringify(["/home/apnex/.codex/skills"])
  ) {
    fail("discovery routing freeze active roots are invalid");
  }
  exactKeys(
    value.operationalDiscovery,
    ["matchingEntrypoints", "resolvedEntrypoint", "skillName", "unambiguous"],
    "discovery routing freeze.operationalDiscovery"
  );
  literal(
    JSON.stringify(value.operationalDiscovery),
    JSON.stringify({
      skillName: "survey",
      matchingEntrypoints: [
        "/home/apnex/.codex/skills/survey/SKILL.md"
      ],
      resolvedEntrypoint: "/home/apnex/.codex/skills/survey/SKILL.md",
      unambiguous: true
    }),
    "discovery routing freeze operational discovery"
  );
  exactKeys(
    value.staging,
    ["discoverable", "reason", "repositoryPath"],
    "discovery routing freeze.staging"
  );
  literal(value.staging.repositoryPath, "skills/survey-v2", "discovery routing freeze staging path");
  literal(value.staging.discoverable, false, "discovery routing freeze staging discovery");
  exactKeys(
    value.repositoryCatalogObservation,
    [
      "matchingEntrypoints",
      "operationallyActive",
      "resolutionRule",
      "resolvedEntrypoint",
      "skillName",
      "tool",
      "warning"
    ],
    "discovery routing freeze.repositoryCatalogObservation"
  );
  literal(
    JSON.stringify(value.repositoryCatalogObservation),
    JSON.stringify({
      tool: "tools/skill-graph.mjs",
      skillName: "survey",
      matchingEntrypoints: [
        "skills/survey/SKILL.md",
        "skills/survey-v2/SKILL.md"
      ],
      warning:
        "WARN  survey-v2/SKILL.md declares name 'survey' (should match folder)",
      resolutionRule: "later-map-write-wins",
      resolvedEntrypoint: "skills/survey-v2/SKILL.md",
      operationallyActive: false
    }),
    "discovery routing freeze repository observation"
  );
  exactKeys(
    value.routingSnapshot,
    ["aggregateDigest", "algorithm", "domain", "members"],
    "discovery routing freeze.routingSnapshot"
  );
  literal(
    value.routingSnapshot.algorithm,
    "sha256-canonical-json({domain,members})/v1",
    "discovery routing freeze routing algorithm"
  );
  if (!Array.isArray(value.routingSnapshot.members) || value.routingSnapshot.members.length !== 7) {
    fail("discovery routing freeze must bind seven routing members");
  }
  let previous = null;
  for (const [index, member] of value.routingSnapshot.members.entries()) {
    exactKeys(member, ["bytes", "path", "sha256"], `discovery routing member ${index}`);
    positiveInteger(member.bytes, `discovery routing member ${index}.bytes`);
    digest(member.sha256, `discovery routing member ${index}.sha256`);
    if (previous !== null && previous >= member.path) {
      fail("discovery routing members must be bytewise ordered");
    }
    previous = member.path;
  }
  literal(
    sha256Value({
      domain: value.routingSnapshot.domain,
      members: value.routingSnapshot.members
    }),
    value.routingSnapshot.aggregateDigest,
    "discovery routing freeze aggregate"
  );
  return value;
}
