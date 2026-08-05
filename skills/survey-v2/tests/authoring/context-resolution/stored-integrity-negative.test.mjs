import test from "node:test";
import {
  resolveStoredResourceVersion
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

test("a semantic-preserving status change is rejected by full stored-resource integrity", () => {
  const input = scenario();
  input.workspace.spec.resourceVersions[0].resource.status.phase = "changed";

  assertContextError(
    () => resolveStoredResourceVersion(
      input.workspace,
      input.record.reference
    ),
    "STORED_RESOURCE_INTEGRITY_MISMATCH",
    "/workspace/spec/resourceVersions/0/integrityDigest"
  );
});
