import test from "node:test";
import {
  mutationDigest,
  projectMutationCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("AuthoringMutation digest omits only mutationDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: mutationDigest,
    domain: "mutation",
    project: projectMutationCore,
    resource: selfDigestedResource("AuthoringMutation", "mutationDigest", {
      createdResources: []
    }),
    selfDigestField: "mutationDigest"
  });
});
