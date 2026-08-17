import test from "node:test";
import assert from "node:assert/strict";
import { scoreRegisteredRubric } from "../../source/executables/evidence/index.mjs";

test("bounded transforms reject out-of-domain native observations instead of clamping", () => {
  assert.throws(
    () =>
      scoreRegisteredRubric(
        { quality: 11 },
        {
          rubricId: "bounded",
          dimensions: [
            {
              dimensionId: "quality",
              sourcePath: "quality",
              transform: "bounded",
              minimum: 0,
              maximum: 10,
              nativeUnit: "points",
            },
          ],
        },
      ),
    /outside its registered domain/,
  );
});
