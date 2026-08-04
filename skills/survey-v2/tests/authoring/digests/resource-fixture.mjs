import assert from "node:assert/strict";
import { authoringDigest } from "../../../source/authoring/kernel/digests.mjs";

export const digestA = `sha256:${"a".repeat(64)}`;
export const digestB = `sha256:${"b".repeat(64)}`;

export function exampleResource({
  name = "frame.alpha",
  labels = { owner: "alpha" },
  status = { lifecycle: "active" },
  subject = "Alpha"
} = {}) {
  return {
    apiVersion: "example.mission-kit/v1alpha1",
    kind: "ExampleFrame",
    metadata: {
      name,
      labels,
      annotations: { evidence: "retained" }
    },
    spec: {
      subject,
      values: ["one", "two"]
    },
    status
  };
}

export function selfDigestedResource(kind, selfDigestField, extraSpec = {}) {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind,
    metadata: {
      name: `${kind.toLowerCase()}.alpha`,
      labels: { evidence: "excluded-from-semantic-core" }
    },
    spec: {
      [selfDigestField]: digestA,
      binding: digestB,
      value: "alpha",
      ...extraSpec
    }
  };
}

export function authoringSubmission({
  digest = digestA,
  normalizedValues = { purpose: "Alpha" },
  rawData = "Zmlyc3Q=",
  producerId = "producer-one"
} = {}) {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringSubmission",
    metadata: { name: "submission.alpha" },
    spec: {
      normalizedSubmissionDigest: digest,
      assignment: {
        reference: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringAssignment",
          name: "assignment.alpha",
          semanticDigest: digestB
        },
        assignmentDigest: digestA
      },
      normalizedValues
    },
    evidence: {
      rawEvidence: {
        content: {
          mediaType: "text/plain",
          encoding: "base64",
          byteLength: Buffer.from(rawData, "base64").byteLength,
          data: rawData
        },
        rawEvidenceDigest: digestB
      },
      producerProvenance: {
        producerId,
        producerClass: "agent",
        evidenceDigest: digestB
      }
    }
  };
}

export function assertResourceSelfExclusion({
  digest,
  domain,
  project,
  resource,
  selfDigestField
}) {
  const core = project(resource);
  assert.equal(Object.hasOwn(core.spec, selfDigestField), false);
  assert.equal(Object.hasOwn(core, "metadata"), false);
  assert.equal(digest(resource), authoringDigest(domain, core));

  const changedSelf = structuredClone(resource);
  changedSelf.spec[selfDigestField] = `sha256:${"f".repeat(64)}`;
  assert.equal(digest(resource), digest(changedSelf));

  const changedValue = structuredClone(resource);
  changedValue.spec.value = "beta";
  assert.notEqual(digest(resource), digest(changedValue));
}
