import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateById } from "../../../generated/validators.mjs";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  validateSurveyResourceSemantics
} from "../../../source/authoring/survey/resource-semantics.mjs";

export const digest = (character) => `sha256:${character.repeat(64)}`;

export async function loadProfile() {
  return JSON.parse(await readFile(new URL(
    "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
    import.meta.url
  ), "utf8"));
}

export function trustedPolicyInput(profile) {
  return {
    profile,
    schemaBindings: [
      { id: "context-frame-schema", digest: digest("1") },
      { id: "question-schema", digest: digest("2") }
    ],
    validatorBindings: [
      { id: "context-frame-validator", digest: digest("3") },
      { id: "question-validator", digest: digest("4") }
    ],
    selectorBindings: [
      { id: "intake-source", digest: digest("5") },
      { id: "survey-policy", digest: digest("6") }
    ]
  };
}

export function assertSourceSnapshotValid(resource) {
  const structural = validateById(
    "urn:mission-kit:authoring:schema:source-snapshot:v1alpha1",
    resource
  );
  assert.equal(structural.valid, true, structural.errors.join("; "));
  assert.deepEqual(validateContractSemantics(resource), []);
}

export function assertSurveyPolicyValid(resource, profile) {
  const structural = validateById(
    "urn:mission-kit:survey:schema:survey-policy-snapshot:v1alpha1",
    resource
  );
  assert.equal(structural.valid, true, structural.errors.join("; "));
  assert.deepEqual(
    validateSurveyResourceSemantics(resource, {
      resolveReference(reference) {
        return reference.apiVersion === profile.apiVersion &&
          reference.kind === profile.kind &&
          reference.name === profile.metadata.name
          ? profile
          : undefined;
      }
    }),
    []
  );
}
