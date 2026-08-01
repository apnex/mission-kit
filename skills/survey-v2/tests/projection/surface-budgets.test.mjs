import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

function lineCount(text) {
  return text.endsWith("\n") ? text.slice(0, -1).split("\n").length : text.split("\n").length;
}

test("generated surfaces meet line, word, hop and no-preview budgets", async () => {
  const projectionFiles = [
    "agent-metadata",
    "assets",
    "build-metadata",
    "diagrams",
    "executables",
    "indexes",
    "references",
    "skill-md",
    "validators"
  ];
  for (const name of projectionFiles) {
    const recipe = JSON.parse(
      await readFile(`${surveyRoot}/source/projections/${name}.projection.json`, "utf8")
    );
    for (const target of recipe.targets) {
      const output = await readFile(path.join(surveyRoot, target), "utf8");
      assert.ok(lineCount(output) <= recipe.budget.maxLines, `${target} line budget`);
      assert.ok((output.match(/\S+/g)?.length ?? 0) <= recipe.budget.maxWords, `${target} word budget`);
    }
  }

  const skill = await readFile(`${surveyRoot}/SKILL.md`, "utf8");
  const links = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
  assert.deepEqual(links.sort(), [
    "references/dependency-resolution.md",
    "references/director-flow.md",
    "references/envelope-contract.md",
    "references/interaction-protocol.md",
    "references/interpretation.md",
    "references/mechanism-index.md",
    "references/protocol-fsm.md",
    "references/question-design.md",
    "references/state-and-resume.md",
    "references/validation.md"
  ]);
  for (const link of links) {
    assert.doesNotMatch(await readFile(path.join(surveyRoot, link), "utf8"), /\]\(\.\.\//);
  }

  const agentSurface = await readFile(`${surveyRoot}/agents/openai.yaml`, "utf8");
  assert.doesNotMatch(agentSurface, /\bQ[1-6]\s*[:—-]/);
  assert.doesNotMatch(agentSurface, /^\s*[a-d][.)]\s+/m);
  assert.match(skill, /Present only the current question/);
  assert.match(skill, /Do not reveal a later title/);
});
