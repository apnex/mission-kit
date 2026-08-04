import test from "node:test";
import {
  assignmentDigest,
  projectAssignmentCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("AuthoringAssignment digest omits only assignmentDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: assignmentDigest,
    domain: "assignment",
    project: projectAssignmentCore,
    resource: selfDigestedResource("AuthoringAssignment", "assignmentDigest"),
    selfDigestField: "assignmentDigest"
  });
});
