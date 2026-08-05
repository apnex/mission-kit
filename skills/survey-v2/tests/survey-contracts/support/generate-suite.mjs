#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { surveyContractSuite } from "./suite-definition.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
const contractRoot = path.resolve(supportRoot, "..");

function fixturePath(name) {
  if (name.startsWith("authoring/")) {
    return `tests/fixtures/authoring/contracts/positive/${name.slice(10)}.json`;
  }
  if (name.startsWith("negative/")) {
    return `tests/fixtures/survey/contracts/negative/${name.slice(9)}.json`;
  }
  return `tests/fixtures/survey/contracts/positive/${name}.json`;
}

for (const item of surveyContractSuite) {
  const categoryRoot = path.join(contractRoot, item.category);
  await mkdir(categoryRoot, { recursive: true });
  const executable =
    `tests/survey-contracts/${item.category}/${item.name}.test.mjs`;
  const testSource = [
    'import test from "node:test";',
    'import { runObligationScenario } from "../support/obligation-scenarios.mjs";',
    "",
    `test(${JSON.stringify(item.statement)}, async () => {`,
    `  await runObligationScenario(${JSON.stringify(item.obligationId)});`,
    "});",
    ""
  ].join("\n");
  const fixtures = [
    "tests/survey-contracts/support/contract-validation.mjs",
    "tests/survey-contracts/support/obligation-scenarios.mjs",
    ...item.fixtures.map(fixturePath)
  ];
  const descriptor = {
    $schema: "urn:mission-kit:survey-v2:schema:test-evidence:v2",
    schemaVersion: "2.0.0",
    id:
      `urn:mission-kit:survey-v2:test:survey-contracts:${item.name}`,
    obligationId: item.obligationId,
    requirementIds: [],
    invariantIds: [item.invariantId],
    verification: {
      precondition:
        "The sovereign Survey schemas, semantic validator, and mapped fixtures exist as package-owned files.",
      stimulus: `Execute ${executable} with node:test.`,
      expectedSemanticState:
        `The contract satisfies only ${item.obligationId}: ${item.statement}.`,
      expectedEvidenceState:
        `The runner reports the literal assertion: ${item.statement}`,
      forbiddenMutation:
        "Do not infer runtime persistence, Director judgment, adapter parity, transport behavior, or any obligation beyond the literal assertion.",
      applicability: {
        mode: "not-applicable",
        transports: [],
        adapters: []
      },
      inspectedAuthorities: [
        `schemas/survey/v1alpha1/${item.schema}`,
        "source/authoring/survey/resource-semantics.mjs",
        "tests/survey-contracts/support/obligation-scenarios.mjs"
      ]
    },
    behavior: item.statement,
    evidenceClass: item.evidenceClass,
    runner: "node:test",
    executable,
    fixtures: [...new Set(fixtures)],
    prerequisites: [],
    resultSchema: "urn:mission-kit:survey-v2:test-result:v2"
  };
  await Promise.all([
    writeFile(
      path.join(categoryRoot, `${item.name}.test.mjs`),
      testSource,
      "utf8"
    ),
    writeFile(
      path.join(categoryRoot, `${item.name}.test.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
      "utf8"
    )
  ]);
}
