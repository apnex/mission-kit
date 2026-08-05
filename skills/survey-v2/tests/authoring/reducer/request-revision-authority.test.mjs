import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  resolveContextClosure,
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  selectRevisionAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  buildRevisionRequestDraft,
} from "../../../source/authoring/kernel/request-planner.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
} from "./support.mjs";

test(
  "revision request planning rejects a unit or plan body that differs from exact profile authority",
  async () => {
    const scenario = await loadReducerScenario();
    const mutation = JSON.parse(
      await readFile(
        new URL(
          "../../fixtures/authoring/contracts/positive/authoring-mutation.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const created = mutation.spec.createdResources[0];
    scenario.workspace.spec.resourceVersions.push({
      reference: structuredClone(created.reference),
      integrityDigest: created.integrityDigest,
      resource: structuredClone(created.resource),
    });
    scenario.workspace.spec.activeHeads.push({
      slot: "brief",
      reference: structuredClone(created.reference),
    });
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
    const selected = selectRevisionAuthority({
      ...scenario,
      unitId: "brief-unit",
      eventId: "REVISE",
    });
    const contextClosure = resolveContextClosure({
      workspace: scenario.workspace,
      selectors: selected.normalTask.contextSelectors,
      requestInputs: {},
    });
    const forged = structuredClone(selected.unit);
    forged.replacementTargets[0].resourceType.kind = "Rogue";
    assert.throws(
      () => buildRevisionRequestDraft({
        ...scenario,
        unit: forged,
        plan: selected.plan,
        normalTask: selected.normalTask,
        contextClosure,
        requestInputs: {},
      }),
      (error) => {
        assert.equal(error.code, "REQUEST_REVISION_AUTHORITY_MISMATCH");
        return true;
      },
    );
  },
);
