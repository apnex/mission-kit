import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

test("generated Director FLOW names every question lane and every protocol transition", async () => {
  const flow = await readFile(`${surveyRoot}/references/director-flow.md`, "utf8");
  const protocol = JSON.parse(await readFile(`${surveyRoot}/source/protocol/survey.protocol.json`, "utf8"));
  for (const question of ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]) {
    assert.match(flow, new RegExp(`\\b${question}\\b`));
  }
  for (const machine of protocol.machines) {
    for (const transition of [...machine.transitions, ...machine.families]) {
      assert.match(flow, new RegExp(`\\b${transition.id}\\b`));
    }
  }
});
