import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
  canonicalize,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("TE16 every assigned success failure contamination and missing result remains in the inclusive population", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["AT01", "AT04", "AT05", "AT06"],
    guardByTransition: {
      AT06: ({ current }) => ({
        pass:
          typeof current.authoritativeStateCore.semanticState.data
            .outcomeClass === "string",
        requiresTypedOutcome: true,
      }),
    },
    mutationByTransition: {
      AT01: ({ currentData, command }) => ({
        ...currentData,
        attemptId: command.input.attemptId,
      }),
      AT04: ({ currentData, command }) => ({
        ...currentData,
        outcomeClass: command.input.outcomeClass,
        evidenceDigest: command.input.evidenceDigest,
      }),
      AT05: ({ currentData, command }) => ({
        ...currentData,
        outcomeClass: "missing_result",
        evidenceDigest: command.input.evidenceDigest,
      }),
      AT06: ({ currentData }) => ({
        ...currentData,
        populationClass: "all_assigned",
        included: true,
      }),
    },
  });
  t.after(fixture.cleanup);
  const outcomes = [
    ["assignment-success", "success"],
    ["assignment-failure", "candidate_failure"],
    ["assignment-contaminated", "harness_contamination"],
    ["assignment-missing", "missing_result"],
  ];
  for (const [assignmentId] of outcomes) {
    await fixture.seed({
      transitionId: "AT01",
      objectId: assignmentId,
      initialData: { sealedAssignmentId: assignmentId },
    });
  }

  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "AT06",
        objectId: "assignment-success",
        expectedRevision: 0,
        idempotencyKey: "te16/include-before-outcome",
        input: {},
      }),
    ),
    ConflictError,
  );

  for (const [assignmentId, outcomeClass] of outcomes) {
    if (outcomeClass === "missing_result") {
      await fixture.engine.execute(
        fixture.commandFor({
          transitionId: "AT05",
          objectId: assignmentId,
          expectedRevision: 0,
          idempotencyKey: `te16/${assignmentId}/never-started`,
          input: { evidenceDigest: hashCanonical("missing/v1", assignmentId) },
        }),
      );
    } else {
      await fixture.engine.execute(
        fixture.commandFor({
          transitionId: "AT01",
          objectId: assignmentId,
          expectedRevision: 0,
          idempotencyKey: `te16/${assignmentId}/start`,
          input: { attemptId: `${assignmentId}:attempt-1` },
        }),
      );
      await fixture.engine.execute(
        fixture.commandFor({
          transitionId: "AT04",
          objectId: assignmentId,
          expectedRevision: 1,
          idempotencyKey: `te16/${assignmentId}/outcome`,
          input: {
            outcomeClass,
            evidenceDigest: hashCanonical("outcome/v1", {
              assignmentId,
              outcomeClass,
            }),
          },
        }),
      );
    }
    const outcomeRevision = outcomeClass === "missing_result" ? 1 : 2;
    await fixture.engine.execute(
      fixture.commandFor({
        transitionId: "AT06",
        objectId: assignmentId,
        expectedRevision: outcomeRevision,
        idempotencyKey: `te16/${assignmentId}/include`,
        input: { populationClass: "all_assigned" },
      }),
    );
  }

  const retained = [];
  for (const [assignmentId] of outcomes) {
    const state = await fixture.load("assignment", assignmentId, {
      required: true,
    });
    const data = state.authoritativeStateCore.semanticState.data;
    retained.push({
      assignmentId,
      outcomeClass: data.outcomeClass,
      included: data.included,
    });
  }
  assert.equal(
    canonicalize(retained),
    canonicalize(
      outcomes.map(([assignmentId, outcomeClass]) => ({
        assignmentId,
        outcomeClass,
        included: true,
      })),
    ),
  );
});
