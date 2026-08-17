import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EM20 child-grant and failure-fence races produce one cut then require its exact drain before closure", async (t) => {
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
            data.cut.some(
              ({ positionId }) => positionId === command.input.positionId,
            ) &&
            !data.receipts.some(
              ({ positionId }) => positionId === command.input.positionId,
            ),
        };
      },
      ECF04a: ({ currentData: data }) => {
        return {
          pass:
            data.failureFence === true &&
            data.cut.length === data.receipts.length,
        };
      },
    },
    mutationByTransition: {
      EC37a: ({ currentData, command }) => ({
        ...currentData,
        grant: {
          positionId: command.input.positionId,
          state: "issued",
        },
      }),
      EC45a: ({ currentData }) => ({
        ...currentData,
        failureFence: true,
        cut: [
          {
            positionId: "position-1",
            branch:
              currentData.grant?.state === "issued" ? "issued" : "no_grant",
          },
        ],
        receipts: [],
      }),
      EC46a: ({ currentData, command }) => ({
        ...currentData,
        receipts: [
          ...currentData.receipts,
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
  await fixture.seed({
    transitionId: "EC37a",
    objectId: "em20-campaign",
    initialData: { failureFence: false, grant: null, cut: [], receipts: [] },
  });
  const race = await Promise.allSettled([
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC37a",
        objectId: "em20-campaign",
        expectedRevision: 0,
        idempotencyKey: "em20/grant",
        input: { positionId: "position-1" },
      }),
    ),
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC45a",
        objectId: "em20-campaign",
        expectedRevision: 0,
        idempotencyKey: "em20/fence",
        input: { cause: "active-failure" },
      }),
    ),
  ]);
  assert.equal(
    race.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  let state = await fixture.load("campaign", "em20-campaign", {
    required: true,
  });
  let revision = state.authoritativeStateCore.semanticState.revision;
  if (
    state.authoritativeStateCore.semanticState.data.failureFence !== true
  ) {
    await fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC45a",
        objectId: "em20-campaign",
        expectedRevision: revision,
        idempotencyKey: "em20/fence-after-grant",
        input: { cause: "active-failure" },
      }),
    );
    revision += 1;
  }

  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC37a",
        objectId: "em20-campaign",
        expectedRevision: revision,
        idempotencyKey: "em20/post-fence-grant",
        input: { positionId: "late-position" },
      }),
    ),
    ConflictError,
  );
  state = await fixture.load("campaign", "em20-campaign", {
    required: true,
  });
  const branch =
    state.authoritativeStateCore.semanticState.data.cut[0].branch;
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EC46a",
      objectId: "em20-campaign",
      expectedRevision: revision,
      idempotencyKey: "em20/drain",
      input: {
        positionId: "position-1",
        disposition:
          branch === "issued" ? "not_committed" : "no_grant",
      },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "ECF04a",
      objectId: "em20-campaign",
      expectedRevision: revision + 1,
      idempotencyKey: "em20/close",
      input: { completeCut: true },
    }),
  );
  state = await fixture.load("campaign", "em20-campaign", {
    required: true,
  });
  assert.equal(
    state.authoritativeStateCore.semanticState.data.cut.length,
    1,
  );
  assert.equal(
    state.authoritativeStateCore.semanticState.data.receipts.length,
    1,
  );
  assert.equal(
    state.authoritativeStateCore.semanticState.state,
    "EC_FAILED_CLOSED",
  );
});
