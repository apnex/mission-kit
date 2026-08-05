import assert from "node:assert/strict";
import test from "node:test";
import {
  applyEvidenceWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  errorCode,
  makeWorkspace,
  resource,
  stored,
} from "./support.mjs";

test("an exact resource version cannot be rebound to different bytes", () => {
  const original = resource("Brief", "brief-one");
  const changedEvidence = structuredClone(original);
  changedEvidence.evidence = { producer: "other" };
  const workspace = makeWorkspace({ resources: [original] });
  assert.equal(errorCode(() => applyEvidenceWorkspace({
    workspace,
    retainedResourceVersions: [stored(changedEvidence)],
    historyReferences: [],
    openAssignmentAfter: null,
  })), "RESOURCE_VERSION_IMMUTABILITY_VIOLATION");
});
