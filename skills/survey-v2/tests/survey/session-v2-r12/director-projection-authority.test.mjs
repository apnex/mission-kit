import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
  deriveDirectorQuestionProjectionAuthority,
} from "../../../source/authoring/survey/director-question-projection.mjs";

const definitionUrl = new URL(
  "../../../source/authoring/survey/current-question-projection.definition.json",
  import.meta.url,
);
const rendererUrl = new URL(
  "../../../source/authoring/survey/current-question-renderer.mjs",
  import.meta.url,
);
const outputSchemaUrl = new URL(
  "../../../schemas/v2/question-presentation.schema.json",
  import.meta.url,
);

const knownAuthority = Object.freeze({
  definition: Object.freeze({
    id: "survey.director.current-question/v1",
    digest:
      "sha256:d65c982ee6c4f2dceba8e7251ff091c341bf32e0558d2708e4026de833fc6ef6",
  }),
  engine: Object.freeze({
    id: "survey.director.current-question-renderer/v1",
    executableClosureDigest:
      "sha256:e63302cb896d15f3538bae70b8f1f2b7878d35155b95215c85043b13c7d152c8",
  }),
  outputSchema: Object.freeze({
    id: "urn:mission-kit:survey-v2:schema:question-presentation:v2",
    sourceDigest:
      "sha256:0b0eec105b59b356b60a052c03265385ec87eb55648ddf71bd74c53f10e9bb52",
  }),
});

async function authorityBytes() {
  return {
    definitionBytes: await readFile(definitionUrl),
    rendererBytes: await readFile(rendererUrl),
    outputSchemaBytes: await readFile(outputSchemaUrl),
  };
}

test(
  "director projection authority is exact, orthogonal, and relocatable",
  async (context) => {
await context.test(
  "the checked-in director projection authority matches all three known-answer pins",
  async () => {
    const derived = deriveDirectorQuestionProjectionAuthority(
      await authorityBytes(),
    );

    assert.deepEqual(derived, knownAuthority);
    assert.deepEqual(
      DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
      knownAuthority,
    );
    assert.deepEqual(
      Object.keys(derived),
      ["definition", "engine", "outputSchema"],
    );
  },
);

await context.test(
  "renderer and output-schema byte changes affect only their owned authority pin",
  async () => {
    const baselineBytes = await authorityBytes();
    const baseline =
      deriveDirectorQuestionProjectionAuthority(baselineBytes);
    const rendererChanged =
      deriveDirectorQuestionProjectionAuthority({
        ...baselineBytes,
        rendererBytes: Buffer.concat([
          baselineBytes.rendererBytes,
          Buffer.from("\n// orthogonality probe\n", "utf8"),
        ]),
      });
    const outputSchemaChanged =
      deriveDirectorQuestionProjectionAuthority({
        ...baselineBytes,
        outputSchemaBytes: Buffer.concat([
          baselineBytes.outputSchemaBytes,
          Buffer.from("\n", "utf8"),
        ]),
      });

    assert.deepEqual(
      rendererChanged.definition,
      baseline.definition,
    );
    assert.notDeepEqual(
      rendererChanged.engine,
      baseline.engine,
    );
    assert.deepEqual(
      rendererChanged.outputSchema,
      baseline.outputSchema,
    );

    assert.deepEqual(
      outputSchemaChanged.definition,
      baseline.definition,
    );
    assert.deepEqual(outputSchemaChanged.engine, baseline.engine);
    assert.notDeepEqual(
      outputSchemaChanged.outputSchema,
      baseline.outputSchema,
    );

    const changedDefinition = Buffer.from(
      baselineBytes.definitionBytes
        .toString("utf8")
        .replace(
          '"viewKind": "question"',
          '"viewKind": "tampered"',
        ),
      "utf8",
    );
    assert.throws(
      () =>
        deriveDirectorQuestionProjectionAuthority({
          ...baselineBytes,
          definitionBytes: changedDefinition,
        }),
      {
        name: "DirectorQuestionProjectionError",
        code: "DIRECTOR_PROJECTION_DEFINITION_INVALID",
      },
      "the closed semantic definition admits no alternate authority",
    );
  },
);

await context.test(
  "authority derivation is invariant when the exact three source files are relocated",
  async () => {
    const original = await authorityBytes();
    const directory = await mkdtemp(
      join(tmpdir(), "survey-v2-r12-projection-relocation-"),
    );
    const relocatedDirectory = join(directory, "unrelated", "root");
    try {
      await mkdir(relocatedDirectory, { recursive: true });
      await Promise.all([
        writeFile(
          join(relocatedDirectory, "definition.json"),
          original.definitionBytes,
        ),
        writeFile(
          join(relocatedDirectory, "renderer.mjs"),
          original.rendererBytes,
        ),
        writeFile(
          join(relocatedDirectory, "presentation.schema.json"),
          original.outputSchemaBytes,
        ),
      ]);
      const relocated = {
        definitionBytes:
          await readFile(
            join(relocatedDirectory, "definition.json"),
          ),
        rendererBytes:
          await readFile(
            join(relocatedDirectory, "renderer.mjs"),
          ),
        outputSchemaBytes:
          await readFile(
            join(
              relocatedDirectory,
              "presentation.schema.json",
            ),
          ),
      };

      assert.deepEqual(
        deriveDirectorQuestionProjectionAuthority(relocated),
        deriveDirectorQuestionProjectionAuthority(original),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

await context.test(
  "the one-member renderer closure rejects every module dependency syntax",
  async () => {
    const baseline = await authorityBytes();
    for (const dependencySource of [
      'import "./hidden-local.mjs";\nexport const value = 1;\n',
      'export * from "./hidden-local.mjs";\n',
      'export { value } from "./hidden-local.mjs";\n',
      'export async function load() { return import("./hidden-local.mjs"); }\n',
    ]) {
      assert.throws(
        () =>
          deriveDirectorQuestionProjectionAuthority({
            ...baseline,
            rendererBytes:
              Buffer.from(dependencySource, "utf8"),
          }),
        {
          name: "DirectorQuestionProjectionError",
          code:
            "DIRECTOR_PROJECTION_RENDERER_CLOSURE_INVALID",
        },
      );
    }
  },
);
  },
);
