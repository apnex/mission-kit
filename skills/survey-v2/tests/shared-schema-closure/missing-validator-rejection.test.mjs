import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  rm
} from "./support/fixture.mjs";

test("refresh rejects a missing catalog-bound semantic-validator entry module", async () => {
  const fixture = await createFixture();
  try {
    await rm(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "SOURCE_UNAVAILABLE",
      /(?:missing|unavailable|absent).*(?:validator|module)|(?:validator|module).*(?:missing|unavailable|absent)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
