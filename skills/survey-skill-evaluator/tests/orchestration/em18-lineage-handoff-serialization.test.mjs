import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EM18 one lineage serializes revision family intake adverse terminal and sole release-facing handoff", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: [
      "EDL03",
      "EDL04",
      "EDL09b",
      "EDL05",
      "EDL06",
    ],
    guardByTransition: {
      EDL03: ({ command, currentData }) => ({
        pass: !currentData.authorizations.some(
          ({ familyId }) => familyId === command.input.familyId,
        ),
      }),
      EDL04: ({ command, currentData }) => ({
        pass: currentData.authorizations.some(
            ({ familyId, status }) =>
              familyId === command.input.familyId && status === "issued",
          ),
      }),
      EDL09b: ({ command, currentData }) => ({
        pass:
          command.input.conclusiveReject === true &&
          !currentData.intakes.some(
            ({ intakeId }) => intakeId === command.input.intakeId,
          ),
      }),
      EDL05: ({ command, currentData }) => ({
        pass: currentData.authorizations.some(
            ({ familyId, status }) =>
              familyId === command.input.familyId && status === "bound",
          ),
      }),
      EDL06: ({ currentData: data }) => {
        return {
          pass:
            data.authorizations.every(
              ({ status }) => status === "terminal",
            ) &&
            data.intakes.every(({ deliveryDrained }) => deliveryDrained),
          completeLineageCut: true,
        };
      },
    },
    mutationByTransition: {
      EDL03: ({ currentData, command }) => ({
        ...currentData,
        authorizations: [
          ...currentData.authorizations,
          {
            familyId: command.input.familyId,
            ordinal: currentData.authorizations.length,
            status: "issued",
          },
        ],
      }),
      EDL04: ({ currentData, command }) => ({
        ...currentData,
        authorizations: currentData.authorizations.map((authorization) =>
          authorization.familyId === command.input.familyId
            ? { ...authorization, status: "bound" }
            : authorization,
        ),
      }),
      EDL09b: ({ currentData, command }) => ({
        ...currentData,
        intakes: [
          ...currentData.intakes,
          {
            intakeId: command.input.intakeId,
            disposition: "rejected",
            immutableHandoffRoot: command.input.handoffRoot,
            deliveryDrained: true,
          },
        ],
      }),
      EDL05: ({ currentData, command }) => ({
        ...currentData,
        authorizations: currentData.authorizations.map((authorization) =>
          authorization.familyId === command.input.familyId
            ? {
                ...authorization,
                status: "terminal",
                terminalClass: command.input.terminalClass,
              }
            : authorization,
        ),
      }),
      EDL06: ({ currentData, command }) => ({
        ...currentData,
        lineageHandoffRoot: command.input.lineageHandoffRoot,
        releaseEffect: false,
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "EDL03",
    objectId: "em18-lineage",
    initialData: { authorizations: [], intakes: [] },
  });
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL03",
      objectId: "em18-lineage",
      expectedRevision: 0,
      idempotencyKey: "em18/authorize",
      input: { familyId: "family-1" },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL04",
      objectId: "em18-lineage",
      expectedRevision: 1,
      idempotencyKey: "em18/bind",
      input: { familyId: "family-1" },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL09b",
      objectId: "em18-lineage",
      expectedRevision: 2,
      idempotencyKey: "em18/intake",
      input: {
        intakeId: "intake-1",
        handoffRoot: "a".repeat(64),
        conclusiveReject: true,
      },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EDL09b",
        objectId: "em18-lineage",
        expectedRevision: 3,
        idempotencyKey: "em18/intake-conflict",
        input: {
          intakeId: "intake-1",
          handoffRoot: "b".repeat(64),
          conclusiveReject: true,
        },
      }),
    ),
    ConflictError,
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL05",
      objectId: "em18-lineage",
      expectedRevision: 3,
      idempotencyKey: "em18/adverse-terminal",
      input: {
        familyId: "family-1",
        terminalClass: "handoff_intake_rejected",
      },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL06",
      objectId: "em18-lineage",
      expectedRevision: 4,
      idempotencyKey: "em18/close",
      input: { lineageHandoffRoot: "c".repeat(64) },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EDL09b",
        objectId: "em18-lineage",
        expectedRevision: 5,
        idempotencyKey: "em18/post-close-intake",
        input: {
          intakeId: "intake-2",
          handoffRoot: "d".repeat(64),
          conclusiveReject: true,
        },
      }),
    ),
    ConflictError,
  );
  const state = await fixture.load(
    "evaluation-decision-lineage",
    "em18-lineage",
    { required: true },
  );
  const data = state.authoritativeStateCore.semanticState.data;
  assert.equal(data.intakes.length, 1);
  assert.equal(data.authorizations.length, 1);
  assert.equal(data.lineageHandoffRoot, "c".repeat(64));
  assert.equal(data.releaseEffect, false);
});
