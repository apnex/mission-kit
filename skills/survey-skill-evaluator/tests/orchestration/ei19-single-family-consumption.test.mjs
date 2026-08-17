import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EI19 one exact family admits one allocation one capacity lineage and one campaign consumer under races", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: [
      "CF03a",
      "CF03b",
      "CF05",
      "CF07",
      "RC01",
      "RCF01",
    ],
    guardByTransition: {
      CF03a: ({ currentData }) => ({
        pass: currentData.allocation === null,
      }),
      CF03b: ({ currentData }) => ({
        pass: currentData.allocation === null,
      }),
      CF05: ({ currentData }) => ({
        pass: currentData.capacityFence === null,
      }),
      CF07: ({ command, currentData: data }) => {
        return {
          pass:
            data.consumer === null &&
            data.capacityFence !== null &&
            command.input.capacityGrantRoot === "c".repeat(64),
        };
      },
    },
    mutationByTransition: {
      CF03a: ({ currentData, command }) => ({
        ...currentData,
        allocation: {
          class: "fresh",
          allocationRoot: command.input.allocationRoot,
        },
      }),
      CF03b: ({ currentData, command }) => ({
        ...currentData,
        allocation: {
          class: "inherited",
          allocationRoot: command.input.allocationRoot,
        },
      }),
      CF05: ({ currentData, command }) => ({
        ...currentData,
        capacityFence: command.input.capacityRequestKey,
      }),
      CF07: ({ currentData, command }) => ({
        ...currentData,
        consumer: command.input.campaignId,
        capacityGrantRoot: command.input.capacityGrantRoot,
      }),
      RC01: ({ currentData, command }) => ({
        ...currentData,
        requestKey: command.input.requestKey,
        reservationId: command.input.reservationId,
        disposition: "granted",
      }),
      RCF01: ({ currentData, command }) => ({
        ...currentData,
        requestKey: command.input.requestKey,
        disposition: "denied",
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "CF03a",
    objectId: "ei19-family",
    initialData: {
      allocation: null,
      capacityFence: null,
      consumer: null,
    },
  });
  const allocationRace = await Promise.allSettled([
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "CF03a",
        objectId: "ei19-family",
        expectedRevision: 0,
        idempotencyKey: "ei19/allocation/fresh",
        input: { allocationRoot: "a".repeat(64) },
      }),
    ),
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "CF03b",
        objectId: "ei19-family",
        expectedRevision: 0,
        idempotencyKey: "ei19/allocation/inherited",
        input: { allocationRoot: "b".repeat(64) },
      }),
    ),
  ]);
  assert.equal(
    allocationRace.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  assert.ok(
    allocationRace.find(({ status }) => status === "rejected").reason
      instanceof ConflictError,
  );

  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "CF05",
      objectId: "ei19-family",
      expectedRevision: 1,
      idempotencyKey: "ei19/capacity-fence",
      input: { capacityRequestKey: "family-allocation-key" },
    }),
  );
  await fixture.seed({
    transitionId: "RC01",
    objectId: "ei19-capacity",
    initialData: {},
  });
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "RC01",
      objectId: "ei19-capacity",
      expectedRevision: 0,
      idempotencyKey: "ei19/capacity/grant",
      input: {
        requestKey: "family-allocation-key",
        reservationId: "reservation-1",
      },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "RCF01",
        objectId: "ei19-capacity",
        expectedRevision: 1,
        idempotencyKey: "ei19/capacity/changed-denial",
        input: { requestKey: "family-allocation-key" },
      }),
    ),
    ConflictError,
  );

  const consumptionRace = await Promise.allSettled([
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "CF07",
        objectId: "ei19-family",
        expectedRevision: 2,
        idempotencyKey: "ei19/consume/campaign-a",
        input: {
          campaignId: "campaign-a",
          capacityGrantRoot: "c".repeat(64),
        },
      }),
    ),
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "CF07",
        objectId: "ei19-family",
        expectedRevision: 2,
        idempotencyKey: "ei19/consume/campaign-b",
        input: {
          campaignId: "campaign-b",
          capacityGrantRoot: "c".repeat(64),
        },
      }),
    ),
  ]);
  assert.equal(
    consumptionRace.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  const family = await fixture.load(
    "confirmatory-family",
    "ei19-family",
    { required: true },
  );
  assert.ok(["campaign-a", "campaign-b"].includes(
    family.authoritativeStateCore.semanticState.data.consumer,
  ));
  assert.equal(
    family.authoritativeStateCore.eventLedger.filter(
      ({ core }) => core.transitionId === "CF07",
    ).length,
    1,
  );
});
