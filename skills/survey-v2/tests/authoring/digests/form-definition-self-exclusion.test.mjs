import test from "node:test";
import {
  formDefinitionDigest,
  projectFormDefinitionCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("AuthoringFormDefinition digest omits only formDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: formDefinitionDigest,
    domain: "form-definition",
    project: projectFormDefinitionCore,
    resource: selfDigestedResource(
      "AuthoringFormDefinition",
      "formDigest",
      { fields: [{ id: "purpose", type: "paragraph" }] }
    ),
    selfDigestField: "formDigest"
  });
});
