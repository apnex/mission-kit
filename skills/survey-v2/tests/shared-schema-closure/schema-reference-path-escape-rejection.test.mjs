import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("refresh rejects a relative schema reference that escapes the authority root", async () => {
  const fixture = await createFixture();
  try {
    const questionPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const question = await readJson(questionPath);
    question.properties.spec.properties.response.$ref =
      "../../../outside.schema.json";
    await writeJson(questionPath, question);

    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "PATH_ESCAPE",
      /(?:reference|schema).*(?:escape|outside)|(?:escape|outside).*(?:reference|schema)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
