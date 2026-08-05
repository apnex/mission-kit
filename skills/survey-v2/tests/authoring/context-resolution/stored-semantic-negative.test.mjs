import test from "node:test";
import {
  resourceIntegrityDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resolveStoredResourceVersion
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

test("a stored resource body with a changed semantic core is rejected before integrity", () => {
  const input = scenario();
  const storedRecord = input.workspace.spec.resourceVersions[0];
  storedRecord.resource.spec.title = "changed semantics";
  storedRecord.integrityDigest = resourceIntegrityDigest(
    storedRecord.resource
  );

  assertContextError(
    () => resolveStoredResourceVersion(
      input.workspace,
      input.record.reference
    ),
    "STORED_RESOURCE_SEMANTIC_DIGEST_MISMATCH",
    "/workspace/spec/resourceVersions/0/reference"
  );
});
