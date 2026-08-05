import { readFile } from "node:fs/promises";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  applyEvidenceWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  issueAssignmentFromTask,
} from "../../../source/authoring/runtime/transaction-resources.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "../reducer/support.mjs";

const fixtureRoot = new URL(
  "../../fixtures/authoring/contracts/positive/",
  import.meta.url,
);

export async function transactionFixture(stem) {
  return JSON.parse(
    await readFile(new URL(`${stem}.json`, fixtureRoot), "utf8"),
  );
}

export async function createIssuedTransactionScenario() {
  const scenario = await loadReducerScenario();
  const [formDefinition, trusted] = await Promise.all([
    transactionFixture("authoring-form-definition"),
    trustedReducerInputs(),
  ]);
  const task = reduceAuthoring(
    scenario.profile,
    scenario.protocol,
    scenario.workspace,
    { class: "next", inputs: {} },
    trusted,
  );
  if (task.kind !== "task") {
    throw new Error("transaction support did not select one task");
  }
  const issued = issueAssignmentFromTask({
    taskResult: task,
    profile: scenario.profile,
    workspace: scenario.workspace,
    staticInventory: [formDefinition],
    validateRequestContract: trusted.validateContract,
  });
  return {
    ...scenario,
    formDefinition,
    trusted,
    task,
    issued,
  };
}

export function persistIssuedAssignment(scenario) {
  return applyEvidenceWorkspace({
    workspace: scenario.workspace,
    retainedResourceVersions: scenario.issued.retainedResourceVersions,
    historyReferences: scenario.issued.historyReferences,
    openAssignmentAfter: scenario.issued.openAssignment,
  });
}
