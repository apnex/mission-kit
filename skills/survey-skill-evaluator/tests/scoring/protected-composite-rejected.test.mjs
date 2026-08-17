import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRegisteredComposite } from "../../source/executables/evidence/index.mjs";

test("registered composites reject protected learning and Director judgment as objectives", () => {
  assert.throws(
    () =>
      evaluateRegisteredComposite({
        compositeId: "bad-objective",
        components: [
          {
            componentId: "judgment",
            status: "observed",
            normalizedValue: 1,
            weight: 1,
            subtype: "director_strategic_judgment",
          },
        ],
      }),
    /cannot consume protected learning/,
  );
});
