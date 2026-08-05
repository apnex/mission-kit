import assert from "node:assert/strict";
import test from "node:test";
import {
  completeBriefFlow,
  createBriefHarness,
  resolveActiveResource,
} from "./support.mjs";

test(
  "the non-Survey Brief profile completes two manifest-owned text-form transitions",
  async () => {
    const harness = await createBriefHarness();
    const flow = await completeBriefFlow(harness);
    const snapshot = await harness.store.read(harness.storeId);
    const outline = resolveActiveResource(snapshot, "outline");
    const brief = resolveActiveResource(snapshot, "brief");

    assert.equal(flow.outlineAssignment.kind, "assignment");
    assert.equal(
      flow.outlineAssignment.request.spec.operation.task.transitionId,
      "BA01",
    );
    assert.equal(flow.outlineText.parsed.normalizedValues.objective,
      flow.objective);
    assert.equal(flow.outlineCommit.kind, "committed");
    assert.equal(flow.briefAssignment.kind, "assignment");
    assert.equal(
      flow.briefAssignment.request.spec.operation.task.transitionId,
      "BA02",
    );
    assert.equal(flow.briefText.parsed.normalizedValues.summary,
      flow.summary);
    assert.equal(flow.briefCommit.kind, "committed");
    assert.deepEqual(flow.terminal, {
      kind: "terminal",
      state: {
        id: "complete",
        label: "Complete",
        class: "terminal",
      },
    });
    assert.equal(snapshot.workspace.spec.authoringState, "complete");
    assert.deepEqual(outline.spec, {
      objective: flow.objective,
    });
    assert.deepEqual(brief.spec, {
      objective: flow.objective,
      summary: flow.summary,
    });
    assert.deepEqual(
      snapshot.workspace.spec.handoffProducts,
      snapshot.workspace.spec.activeHeads.filter(
        (entry) => entry.slot === "brief",
      ),
    );
  },
);
