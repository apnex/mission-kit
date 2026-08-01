import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMPLEMENTATION_SURFACE } from "../../source/executables/runtime/lib/engine.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("manifest action/mutation pairs have an exact one-to-one engine handler surface.", async () => {
  const protocol = JSON.parse(await readFile(path.join(surveyRoot, "source/protocol/survey.protocol.json"), "utf8"));
  const expected = Object.fromEntries(protocol.machines.map((machine) => [
    machine.id,
    [...machine.transitions, ...machine.families]
      .map((transition) => `${transition.action}/${transition.mutation}`)
      .sort()
  ]));
  assert.deepEqual(IMPLEMENTATION_SURFACE.phase, expected.phase);
  assert.deepEqual(IMPLEMENTATION_SURFACE.runtime, expected.runtime);
});
