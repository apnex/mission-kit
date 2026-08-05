import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assignmentDigest,
  blankViewDigest,
  commitReceiptDigest,
  contextClosureDigest,
  contextSelectorDigest,
  formDefinitionDigest,
  journalRecordDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  profileManifestDigest,
  projectionArtifactDigest,
  rawEvidenceDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  sourceSnapshotDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../source/authoring/kernel/digests.mjs";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const fixtureRoot = path.join(
  packageRoot,
  "tests/fixtures/authoring/contracts/positive"
);
const nonResourceFixtures = new Set([
  "authoring-journal-record",
  "authoring-workspace-effect"
]);

async function loadResources() {
  const resources = {};
  for (const name of (await readdir(fixtureRoot)).sort()) {
    if (name === "resource-reference.json" || !name.endsWith(".json")) continue;
    resources[name.slice(0, -5)] = JSON.parse(
      await readFile(path.join(fixtureRoot, name), "utf8")
    );
  }
  return resources;
}

function exactBytes(content) {
  return Buffer.from(content.data, "base64");
}

function identitySnapshot(resources) {
  const named = {
    assignment: assignmentDigest(resources["authoring-assignment"]),
    commitReceipt: commitReceiptDigest(resources["authoring-commit-receipt"]),
    contextClosure: contextClosureDigest(resources["context-closure"]),
    contextSelector: contextSelectorDigest(
      resources["authoring-profile-manifest"].spec.tasks[0].contextSelectors[0]
    ),
    formDefinition: formDefinitionDigest(
      resources["authoring-form-definition"]
    ),
    journalRecord: journalRecordDigest(
      resources["authoring-journal-record"]
    ),
    mutation: mutationDigest(resources["authoring-mutation"]),
    normalizedSubmission: normalizedSubmissionDigest(
      resources["authoring-submission"]
    ),
    profileManifest: profileManifestDigest(
      resources["authoring-profile-manifest"]
    ),
    projectionArtifact: projectionArtifactDigest(
      resources["projection-artifact"]
    ),
    request: requestCoreDigest(resources["authoring-request"]),
    sourceSnapshot: sourceSnapshotDigest(resources["source-snapshot"]),
    workspaceIntegrity: workspaceIntegrityDigest(
      resources["authoring-workspace"]
    ),
    workspaceSemanticState: workspaceSemanticStateDigest(
      resources["authoring-workspace"]
    )
  };
  const resourceIdentities = Object.fromEntries(
    Object.entries(resources)
      .filter(([name]) => !nonResourceFixtures.has(name))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, resource]) => {
        const reference = resourceReferenceFrom(resource);
        return [
          name,
          {
            integrity: resourceIntegrityDigest(resource),
            reference: resourceReferenceDigest(reference),
            semantics: resourceSemanticDigest(resource)
          }
        ];
      })
  );
  const assignment = resources["authoring-assignment"];
  const submission = resources["authoring-submission"];
  return {
    exactBytes: {
      blankView: blankViewDigest(
        exactBytes(assignment.spec.uneditedSkeleton.content)
      ),
      rawEvidence: rawEvidenceDigest(
        exactBytes(submission.evidence.rawEvidence.content)
      )
    },
    named,
    resourceIdentities
  };
}

test("all authoring identity digests are independent of process working directory", async () => {
  const resources = await loadResources();
  const originalDirectory = process.cwd();
  const firstDirectory = await mkdtemp(path.join(os.tmpdir(), "authoring-cwd-a-"));
  const secondDirectory = await mkdtemp(path.join(os.tmpdir(), "authoring-cwd-b-"));

  try {
    process.chdir(firstDirectory);
    const first = identitySnapshot(resources);
    process.chdir(secondDirectory);
    const second = identitySnapshot(resources);
    assert.deepEqual(first, second);
  } finally {
    process.chdir(originalDirectory);
    await rm(firstDirectory, { recursive: true, force: true });
    await rm(secondDirectory, { recursive: true, force: true });
  }
});
