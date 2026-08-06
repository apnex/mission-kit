import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  deriveCurrentQuestionProjectionRecipe,
  renderCurrentQuestionPresentation,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  excludedProjectionSentinels,
  expectedPresentation,
  projectionFixtureSources,
} from "./projection-support.mjs";

test(
  "the dormant current-question renderer is closed, schema-valid, and tamper-evident",
  async (context) => {
await context.test(
  "the dormant renderer emits the exact closed Q1 presentation",
  async () => {
    const recipe = deriveCurrentQuestionProjectionRecipe(
      projectionFixtureSources(),
    );
    const presentation =
      renderCurrentQuestionPresentation(recipe);

    assert.deepEqual(presentation, expectedPresentation());
    assert.deepEqual(Object.keys(presentation), [
      "$schema",
      "schemaVersion",
      "kind",
      "questionId",
      "context",
      "prompt",
      "options",
      "responseGuidance",
    ]);
    assert.equal(
      presentation.responseGuidance.syntax,
      "Pick one or more option letters.",
    );
    assert.ok(Object.isFrozen(presentation));

    const schema = JSON.parse(await readFile(
      new URL(
        "../../../schemas/v2/question-presentation.schema.json",
        import.meta.url,
      ),
      "utf8",
    ));
    const validate = new Ajv2020({
      allErrors: true,
      strict: true,
    }).compile(schema);
    assert.equal(
      validate(presentation),
      true,
      JSON.stringify(validate.errors),
    );
  },
);

await context.test(
  "the rendered director view contains no excluded source sentinel",
  () => {
    const presentation = renderCurrentQuestionPresentation(
      deriveCurrentQuestionProjectionRecipe(
        projectionFixtureSources(),
      ),
    );
    const serialized = JSON.stringify(presentation);

    for (const sentinel of excludedProjectionSentinels) {
      assert.equal(
        serialized.includes(sentinel),
        false,
        `${sentinel} escaped into the director presentation`,
      );
    }
    assert.equal(serialized.includes("MutuallyExclusive"), false);
  },
);

await context.test(
  "the public renderer refuses a stale tamper before invoking the dormant rendering closure",
  () => {
    const recipe = structuredClone(
      deriveCurrentQuestionProjectionRecipe(
        projectionFixtureSources(),
      ),
    );
    recipe.sourceSelections[3].selectedValues[0].value.text =
      "Tampered prompt";

    assert.throws(
      () => renderCurrentQuestionPresentation(recipe),
      {
        name: "DirectorQuestionProjectionError",
        code: "DIRECTOR_PROJECTION_RENDER_ADMISSION_INVALID",
      },
    );
  },
);
  },
);
