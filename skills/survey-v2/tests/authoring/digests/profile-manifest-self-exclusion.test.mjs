import test from "node:test";
import {
  profileManifestDigest,
  projectProfileManifestCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("AuthoringProfileManifest digest omits only profileDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: profileManifestDigest,
    domain: "profile-manifest",
    project: projectProfileManifestCore,
    resource: selfDigestedResource(
      "AuthoringProfileManifest",
      "profileDigest"
    ),
    selfDigestField: "profileDigest"
  });
});
