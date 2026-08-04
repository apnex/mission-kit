import test from "node:test";
import {
  contextClosureDigest,
  projectContextClosureCore
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("ContextClosure digest omits only closureDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: contextClosureDigest,
    domain: "context-closure",
    project: projectContextClosureCore,
    resource: selfDigestedResource("ContextClosure", "closureDigest", {
      layers: []
    }),
    selfDigestField: "closureDigest"
  });
});
