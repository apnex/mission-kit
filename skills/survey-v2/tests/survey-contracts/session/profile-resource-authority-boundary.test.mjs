import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  profileManifestDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  contextClosureResource,
  makeWorkspace,
  matrixSession,
  sealWorkspace,
  storedResourceVersion
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

const profileTemplate = JSON.parse(await readFile(
  new URL(
    "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
    import.meta.url
  ),
  "utf8"
));
const mutationTemplate = JSON.parse(await readFile(
  new URL(
    "../../fixtures/authoring/contracts/positive/authoring-mutation.json",
    import.meta.url
  ),
  "utf8"
));
const brief = structuredClone(
  mutationTemplate.spec.createdResources[0].resource
);

function sessionWithResources(resources, { profile = null } = {}) {
  const session = matrixSession({
    authoringState: "survey_frame_required",
    phaseState: "round_1_drafting"
  });
  const stored = resources.map(storedResourceVersion);
  const workspace = session.authoring.workspace;
  workspace.spec.resourceVersions = stored;
  workspace.spec.activeHeads = [{
    slot: "authority-boundary-subject",
    reference: stored.at(-1).reference
  }];
  if (profile) {
    workspace.spec.profile = {
      reference: resourceReferenceFrom(profile),
      profileDigest: profile.spec.profileDigest
    };
  }
  sealWorkspace(workspace);
  const journal = structuredClone(session.journal);
  journal.at(-1).after.semanticStateDigest = "$workspace";
  return attachJournal(session, journal);
}

function unboundIssueAt(session, suffix) {
  return validateSessionSemantics(session).find(
    (candidate) => (
      candidate.code === "SESSION_RESOURCE_TYPE_UNBOUND" &&
      candidate.field.endsWith(suffix)
    )
  );
}

test("a v2 session rejects unbound profile resources at every containment position and a stored manifest cannot self-authorize validation", async () => {
  assert.deepEqual(validateContractSemantics(mutationTemplate), []);
  const containmentCases = [
    {
      label: "top-level workspace resource version",
      resource: brief,
      suffix:
        "/authoring/workspace/spec/resourceVersions/0/resource"
    },
    {
      label: "AuthoringMutation created resource",
      resource: mutationTemplate,
      suffix: "/spec/createdResources/0/resource"
    },
    {
      label: "ContextClosure source snapshot",
      resource: contextClosureResource(brief, {
        name: "unbound-profile-resource-closure"
      }),
      suffix: "/spec/layers/0/sourceSnapshot"
    },
    {
      label: "nested AuthoringWorkspace resource version",
      resource: makeWorkspace({
        resourceVersions: [storedResourceVersion(brief)]
      }),
      suffix: "/spec/resourceVersions/0/resource"
    }
  ];
  for (const candidate of containmentCases) {
    const session = sessionWithResources([candidate.resource]);
    assert.equal(
      (await validateSessionStructure(session)).valid,
      true,
      candidate.label
    );
    assert.ok(
      unboundIssueAt(session, candidate.suffix),
      candidate.label
    );
  }

  const selectedProfile = structuredClone(profileTemplate);
  selectedProfile.spec.profileDigest = profileManifestDigest(selectedProfile);
  const selfAuthorized = sessionWithResources(
    [selectedProfile, mutationTemplate],
    { profile: selectedProfile }
  );
  assert.equal(
    (await validateSessionStructure(selfAuthorized)).valid,
    true
  );
  assert.ok(unboundIssueAt(
    selfAuthorized,
    "/spec/createdResources/0/resource"
  ));
});
