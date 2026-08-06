import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
  deriveCurrentQuestionProjectionRecipe,
  directorProjectionRecipeDigest,
  verifyCurrentQuestionProjectionRecipe,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  excludedProjectionSentinels,
  expectedQuestionProjection,
  projectionFixtureSources,
} from "./projection-support.mjs";

const expectedTopLevelKeys = [
  "$schema",
  "generationContext",
  "instrument",
  "projection",
  "recipeDigest",
  "schemaVersion",
  "sourceSelections",
  "unit",
  "viewKind",
];

test(
  "the Q1 projection recipe is deterministic, least-context, and tamper-evident",
  async (context) => {
await context.test(
  "Q1 recipe derivation is deterministic, self-digested, and pinned to the closed projection authority",
  async () => {
    const sources = projectionFixtureSources();
    const first = deriveCurrentQuestionProjectionRecipe(sources);
    const second = deriveCurrentQuestionProjectionRecipe(
      structuredClone(sources),
    );

    assert.deepEqual(first, second);
    assert.deepEqual(Object.keys(first), expectedTopLevelKeys);
    assert.equal(
      first.$schema,
      "urn:mission-kit:survey-v2:schema:director-projection-recipe:v1",
    );
    assert.equal(first.schemaVersion, "1.0.0");
    assert.equal(first.viewKind, "question");
    assert.equal(
      first.recipeDigest,
      directorProjectionRecipeDigest(first),
    );
    assert.deepEqual(
      first.projection,
      DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
    );
    assert.deepEqual(first.instrument, {
      reference: sources.instrumentVersion.reference,
      integrityDigest: sources.instrumentVersion.integrityDigest,
    });
    assert.deepEqual(first.generationContext, {
      reference: sources.generationContextVersion.reference,
      integrityDigest:
        sources.generationContextVersion.integrityDigest,
    });
    assert.deepEqual(
      verifyCurrentQuestionProjectionRecipe(first, sources),
      first,
    );
    assert.ok(Object.isFrozen(first));
    assert.ok(Object.isFrozen(first.sourceSelections));
    assert.ok(Object.isFrozen(first.projection));

    const schema = JSON.parse(await readFile(
      new URL(
        "../../../schemas/v2/director-projection-recipe.schema.json",
        import.meta.url,
      ),
      "utf8",
    ));
    const validate = new Ajv2020({
      allErrors: true,
      strict: true,
    }).compile(schema);
    assert.equal(
      validate(first),
      true,
      JSON.stringify(validate.errors),
    );
  },
);

await context.test(
  "the recipe selects only the four closed semantic sources and excludes every ambient sentinel",
  () => {
    const recipe = deriveCurrentQuestionProjectionRecipe(
      projectionFixtureSources(),
    );

    assert.deepEqual(
      recipe.sourceSelections.map(
        ({ ordinal, role, selectedValues }) => ({
          ordinal,
          role,
          paths: selectedValues.map(({ path }) => path),
        }),
      ),
      [
        {
          ordinal: 1,
          role: "survey-frame",
          paths: ["/spec/synopsis"],
        },
        {
          ordinal: 2,
          role: "round-frame",
          paths: ["/spec/synopsis"],
        },
        {
          ordinal: 3,
          role: "question-frame",
          paths: ["/spec/synopsis"],
        },
        {
          ordinal: 4,
          role: "question",
          paths: [
            "/spec/prompt",
            "/spec/response/options",
            "/spec/response/cardinality",
          ],
        },
      ],
    );
    assert.deepEqual(
      recipe.sourceSelections.map(({ selectedValues }) =>
        selectedValues.map(({ value }) => value)),
      [
        [expectedQuestionProjection.surveySynopsis],
        [expectedQuestionProjection.roundSynopsis],
        [expectedQuestionProjection.questionSynopsis],
        [
          expectedQuestionProjection.prompt,
          expectedQuestionProjection.options,
          expectedQuestionProjection.cardinality,
        ],
      ],
    );

    const serialized = JSON.stringify(recipe);
    for (const sentinel of excludedProjectionSentinels) {
      assert.equal(
        serialized.includes(sentinel),
        false,
        `${sentinel} escaped into the recipe`,
      );
    }
    assert.equal(serialized.includes("MutuallyExclusive"), false);
  },
);

await context.test(
  "verification rejects each independently tampered recipe field class",
  () => {
    const sources = projectionFixtureSources();
    const recipe = deriveCurrentQuestionProjectionRecipe(sources);
    const tamperCases = [
      [
        "instrument reference",
        (value) => {
          value.instrument.reference.name = "wrong-instrument";
        },
      ],
      [
        "generation-context integrity",
        (value) => {
          value.generationContext.integrityDigest =
            `sha256:${"1".repeat(64)}`;
        },
      ],
      [
        "unit binding",
        (value) => {
          value.unit.questionOrdinal = 2;
        },
      ],
      [
        "selection source reference",
        (value) => {
          value.sourceSelections[0].sourceReference.name =
            "wrong-survey-frame";
        },
      ],
      [
        "selection source integrity",
        (value) => {
          value.sourceSelections[1].sourceIntegrityDigest =
            `sha256:${"2".repeat(64)}`;
        },
      ],
      [
        "selection path",
        (value) => {
          value.sourceSelections[2].selectedValues[0].path =
            "/spec/purpose";
        },
      ],
      [
        "selection value",
        (value) => {
          value.sourceSelections[3].selectedValues[0].value.text =
            "Tampered prompt";
        },
      ],
      [
        "source selection order",
        (value) => {
          [
            value.sourceSelections[0],
            value.sourceSelections[1],
          ] = [
            value.sourceSelections[1],
            value.sourceSelections[0],
          ];
        },
      ],
      [
        "projection definition digest",
        (value) => {
          value.projection.definition.digest =
            `sha256:${"3".repeat(64)}`;
        },
      ],
      [
        "projection authority pin",
        (value) => {
          value.projection.engine.executableClosureDigest =
            `sha256:${"4".repeat(64)}`;
        },
      ],
      [
        "projection output-schema source digest",
        (value) => {
          value.projection.outputSchema.sourceDigest =
            `sha256:${"5".repeat(64)}`;
        },
      ],
      [
        "recipe digest",
        (value) => {
          value.recipeDigest = `sha256:${"6".repeat(64)}`;
        },
      ],
    ];

    for (const [label, tamper] of tamperCases) {
      const candidate = structuredClone(recipe);
      tamper(candidate);
      assert.throws(
        () =>
          verifyCurrentQuestionProjectionRecipe(
            candidate,
            sources,
          ),
        {
          name: "DirectorQuestionProjectionError",
          code: "DIRECTOR_PROJECTION_RECIPE_DIVERGENT",
        },
        label,
      );
    }
  },
);
  },
);
