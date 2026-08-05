import assert from "node:assert/strict";
import test from "node:test";
import {
  symlink,
} from "node:fs/promises";
import path from "node:path";
import {
  captureSourceFiles,
} from "../../../source/executables/runtime/lib/surveyctl-io.mjs";
import {
  createSurveyctlHarness,
} from "./support.mjs";

test(
  "surveyctl source capture refuses a symlink without reading its target",
  async (testContext) => {
    const harness = await createSurveyctlHarness(testContext);
    const link = path.join(harness.sourceRoot, "linked.txt");
    await symlink(harness.sourceFile, link);

    await assert.rejects(
      captureSourceFiles({
        sourceRoot: harness.sourceRoot,
        sources: ["linked.txt"],
      }),
      (error) => {
        assert.equal(
          error?.code,
          "SURVEYCTL_SYMLINK_FORBIDDEN",
        );
        return true;
      },
    );
  },
);
