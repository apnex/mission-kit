import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EI10 failure closure waits for every consumed issued and never-granted realized child position", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["EC37a", "EC45a", "EC46a", "ECF04a"],
    guardByTransition: {
      EC37a: ({ currentData }) => ({
        pass: currentData.failureFence !== true,
      }),
      EC45a: ({ currentData }) => ({
        pass: currentData.failureFence !== true,
      }),
      EC46a: ({ command, currentData: data }) => {
        return {
          pass:
            data.failureFence === true &&
            data.realizedChildCut.some(
              ({ positionId }) => positionId === command.input.positionId,
            ) &&
            !data.drainReceipts.some(
              ({ positionId }) => positionId === command.input.positionId,
            ),
        };
      },
      ECF04a: ({ currentData: data }) => {
        return {
          pass:
            data.failureFence === true &&
            data.realizedChildCut.length === data.drainReceipts.length &&
            data.realizedChildCut.every(({ positionId }) =>
              data.drainReceipts.some(
                (receipt) => receipt.positionId === positionId,
              ),
            ),
          completeChildCutChecked: true,
        };
      },
    },
    mutationByTransition: {
      EC37a: ({ currentData, command }) => ({
        ...currentData,
        grants: [
          ...(currentData.grants ?? []),
          { positionId: command.input.positionId, state: "issued" },
        ],
      }),
      EC45a: ({ currentData }) => ({
        ...currentData,
        failureFence: true,
        drainReceipts: [],
      }),
      EC46a: ({ currentData, command }) => ({
        ...currentData,
        drainReceipts: [
          ...currentData.drainReceipts,
          {
            positionId: command.input.positionId,
            disposition: command.input.disposition,
          },
        ],
      }),
      ECF04a: ({ currentData }) => ({
        ...currentData,
        failureClosed: true,
      }),
    },
  });
  t.after(fixture.cleanup);
  const cut = [
    { positionId: "consumed-child", preFenceClass: "consumed" },
    { positionId: "issued-child", preFenceClass: "issued" },
    { positionId: "never-granted-child", preFenceClass: "no_grant" },
  ];
  await fixture.seed({
    transitionId: "EC45a",
    objectId: "ei10-campaign",
    initialData: {
      failureFence: false,
      realizedChildCut: cut,
      grants: [
        { positionId: "consumed-child", state: "consumed" },
        { positionId: "issued-child", state: "issued" },
      ],
    },
  });
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EC45a",
      objectId: "ei10-campaign",
      expectedRevision: 0,
      idempotencyKey: "ei10/fence",
      input: { cause: "irrecoverable-active-failure" },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC37a",
        objectId: "ei10-campaign",
        expectedRevision: 1,
        idempotencyKey: "ei10/late-grant",
        input: { positionId: "late-child" },
      }),
    ),
    ConflictError,
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "ECF04a",
        objectId: "ei10-campaign",
        expectedRevision: 1,
        idempotencyKey: "ei10/close-early",
        input: {},
      }),
    ),
    ConflictError,
  );

  const dispositions = ["source_advanced", "not_committed", "no_grant"];
  for (const [index, position] of cut.entries()) {
    await fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC46a",
        objectId: "ei10-campaign",
        expectedRevision: index + 1,
        idempotencyKey: `ei10/drain/${position.positionId}`,
        input: {
          positionId: position.positionId,
          disposition: dispositions[index],
        },
      }),
    );
  }
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "ECF04a",
      objectId: "ei10-campaign",
      expectedRevision: 4,
      idempotencyKey: "ei10/close",
      input: { completeCut: true },
    }),
  );
  const state = await fixture.load("campaign", "ei10-campaign", {
    required: true,
  });
  assert.equal(
    state.authoritativeStateCore.semanticState.state,
    "EC_FAILED_CLOSED",
  );
  assert.equal(
    state.authoritativeStateCore.semanticState.data.drainReceipts.length,
    3,
  );
});
