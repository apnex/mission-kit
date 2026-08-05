import test from "node:test";
import {
  resolveStoredResourceVersion
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  clone,
  scenario
} from "./support.mjs";

test("duplicate bodies for one exact stored-resource reference fail closed", () => {
  const input = scenario();
  input.workspace.spec.resourceVersions.push(clone(input.record));

  assertContextError(
    () => resolveStoredResourceVersion(
      input.workspace,
      input.record.reference
    ),
    "STORED_RESOURCE_VERSION_DUPLICATE",
    "/workspace/spec/resourceVersions/1"
  );
});
