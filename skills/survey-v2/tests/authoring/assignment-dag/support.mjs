import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  contextClosureDigest,
  formDefinitionDigest,
  requestCoreDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  AuthoringAssignmentDagError,
  issueTextAssignment
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  renderBlankTextForm,
  renderPopulatedTextForm
} from "../../../source/authoring/kernel/text-forms.mjs";

const positiveFixtureRoot = new URL(
  "../../fixtures/authoring/contracts/positive/",
  import.meta.url
);

export const evidenceDigest =
  `sha256:${"e".repeat(64)}`;

export function deterministicTestRenderer({
  contextClosure,
  formDefinition,
  requestHandle
}) {
  return renderBlankTextForm({
    formDefinition,
    contextClosure,
    requestHandle
  });
}

async function loadPositiveFixture(stem) {
  return JSON.parse(
    await readFile(new URL(`${stem}.json`, positiveFixtureRoot), "utf8")
  );
}

/**
 * Adapt fresh clones of the K10 positive fixtures to the executable K11
 * assignment path. No persisted fixture is changed.
 */
export async function loadK10AssignmentScenario() {
  const [
    request,
    contextClosure,
    formDefinition,
    profileManifest
  ] = await Promise.all([
    "authoring-request",
    "context-closure",
    "authoring-form-definition",
    "authoring-profile-manifest"
  ].map(loadPositiveFixture));

  formDefinition.spec.formDigest = formDefinitionDigest(formDefinition);
  contextClosure.spec.closureDigest = contextClosureDigest(contextClosure);

  const projectionBinding = structuredClone(
    profileManifest.spec.projectionBindings[0]
  );
  request.spec.contextClosure = {
    reference: resourceReferenceFrom(contextClosure),
    closureDigest: contextClosure.spec.closureDigest
  };
  request.spec.bindings.form = {
    ...request.spec.bindings.form,
    digest: formDefinition.spec.formDigest
  };
  request.spec.submissionContract.form =
    structuredClone(request.spec.bindings.form);
  request.spec.bindings.projection = {
    id: projectionBinding.id,
    digest: projectionBinding.definitionDigest
  };
  request.spec.requestDigest = requestCoreDigest(request);

  return {
    request,
    contextClosure,
    formDefinition,
    projectionBinding
  };
}

export async function issueK10TextAssignment({
  projectionName = "brief-projection",
  assignmentName = "brief-assignment",
  occupiedHandles = [],
  renderProjection = deterministicTestRenderer
} = {}) {
  const scenario = await loadK10AssignmentScenario();
  const issued = issueTextAssignment({
    ...scenario,
    projectionName,
    assignmentName,
    occupiedHandles,
    renderProjection
  });
  return { ...scenario, ...issued, renderProjection };
}

export function populatedTextBytes(
  scenario,
  normalizedValues = { summary: "A useful brief." }
) {
  return renderPopulatedTextForm({
    formDefinition: scenario.formDefinition,
    contextClosure: scenario.contextClosure,
    requestHandle: scenario.handle,
    values: normalizedValues
  });
}

export function producerProvenance(
  producerId = "text-adapter",
  producerClass = "adapter"
) {
  return {
    producerId,
    producerClass,
    evidenceDigest
  };
}

export function assertDagError(operation, expectedCode) {
  assert.throws(operation, (error) => {
    assert.equal(error instanceof AuthoringAssignmentDagError, true);
    assert.equal(error.code, expectedCode);
    return true;
  });
}

export function digestWithPrefix(prefix, fill = "0") {
  if (
    !/^[0-9a-f]+$/.test(prefix) ||
    !/^[0-9a-f]$/.test(fill) ||
    prefix.length > 64
  ) {
    throw new TypeError("digest prefix must be lowercase hexadecimal");
  }
  return `sha256:${`${prefix}${fill.repeat(64)}`.slice(0, 64)}`;
}
