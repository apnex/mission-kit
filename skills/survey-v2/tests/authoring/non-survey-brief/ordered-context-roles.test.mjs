import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createBriefHarness,
  issueBriefAssignment,
  submitBriefAssignment,
  textSubmissionFor,
} from "./support.mjs";

function assertExactLayer(
  layer,
  {
    ordinal,
    role,
    resource,
    selectedValue,
  },
) {
  assert.equal(layer.ordinal, ordinal);
  assert.equal(layer.role, role);
  assert.equal(layer.requiredLifecycleState, "frozen");
  assert.deepEqual(
    layer.sourceReference,
    resourceReferenceFrom(resource),
  );
  assert.deepEqual(layer.sourceSnapshot, resource);
  assert.deepEqual(layer.selectedValue, selectedValue);
}

test(
  "the Brief profile preserves intake, constraints, and outline as ordered context roles",
  async () => {
    const harness = await createBriefHarness();
    const objective =
      "Bound the launch by explicit readiness and reversal criteria.";
    const outlineAssignment = await issueBriefAssignment(harness);
    const intake = harness.fixture.initialResources.find(
      ({ kind }) => kind === "BriefIntake",
    );
    const constraints = harness.fixture.initialResources.find(
      ({ kind }) => kind === "BriefConstraints",
    );

    assert.deepEqual(
      outlineAssignment.contextClosure.spec.layers.map(
        (layer) => layer.role,
      ),
      ["intake", "constraints"],
    );
    assertExactLayer(
      outlineAssignment.contextClosure.spec.layers[0],
      {
        ordinal: 1,
        role: "intake",
        resource: intake,
        selectedValue: [
          {
            path: "/spec/problem",
            value: intake.spec.problem,
          },
          {
            path: "/spec/audience",
            value: intake.spec.audience,
          },
        ],
      },
    );
    assertExactLayer(
      outlineAssignment.contextClosure.spec.layers[1],
      {
        ordinal: 2,
        role: "constraints",
        resource: constraints,
        selectedValue: [
          {
            path: "/spec/maxWords",
            value: constraints.spec.maxWords,
          },
          {
            path: "/spec/tone",
            value: constraints.spec.tone,
          },
        ],
      },
    );
    assert.match(
      outlineAssignment.viewBytes.toString("utf8"),
      /"role":"intake"/u,
    );
    assert.match(
      outlineAssignment.viewBytes.toString("utf8"),
      /"role":"constraints"/u,
    );

    const outline = textSubmissionFor(
      harness,
      outlineAssignment,
      {
        name: "ordered-context-outline",
        values: { objective },
      },
    );
    await submitBriefAssignment(
      harness,
      outlineAssignment,
      outline.submission,
    );
    const briefAssignment = await issueBriefAssignment(harness);
    const layers = briefAssignment.contextClosure.spec.layers;

    assert.deepEqual(
      layers.map((layer) => layer.role),
      ["intake", "constraints", "outline"],
    );
    assert.deepEqual(
      layers.map((layer) => layer.ordinal),
      [1, 2, 3],
    );
    assertExactLayer(layers[0], {
      ordinal: 1,
      role: "intake",
      resource: intake,
      selectedValue: [
        {
          path: "/spec/problem",
          value: intake.spec.problem,
        },
        {
          path: "/spec/audience",
          value: intake.spec.audience,
        },
      ],
    });
    assertExactLayer(layers[1], {
      ordinal: 2,
      role: "constraints",
      resource: constraints,
      selectedValue: [
        {
          path: "/spec/maxWords",
          value: constraints.spec.maxWords,
        },
        {
          path: "/spec/tone",
          value: constraints.spec.tone,
        },
      ],
    });
    const outlineResource = {
      apiVersion: "brief.example/v1alpha1",
      kind: "BriefOutline",
      metadata: { name: "brief-outline" },
      spec: { objective },
    };
    assertExactLayer(layers[2], {
      ordinal: 3,
      role: "outline",
      resource: outlineResource,
      selectedValue: [{
        path: "/spec/objective",
        value: objective,
      }],
    });
    assert.equal(
      layers[2].sourceReference.kind,
      "BriefOutline",
    );
    assert.match(
      briefAssignment.viewBytes.toString("utf8"),
      /"role":"outline"/u,
    );
  },
);
