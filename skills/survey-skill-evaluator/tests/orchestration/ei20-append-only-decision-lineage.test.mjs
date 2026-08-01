import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EI20 decision-lineage closure retains every revision ordinal and requires a terminal without refund for each", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["EDL02", "EDL03", "EDL05", "EDL08", "EDL06"],
    guardByTransition: {
      EDL02: ({ command, currentData }) => ({
        pass: currentData.authorizations.some(({ familyIdentity }) =>
            familyIdentity === command.input.familyIdentity),
      }),
      EDL03: ({ command, currentData: data }) => {
        return {
          pass:
            data.remainingEvidenceBudget > 0 &&
            !data.authorizations.some(
              ({ familyIdentity }) =>
                familyIdentity === command.input.familyIdentity,
            ),
        };
      },
      EDL05: ({ command, currentData }) => ({
        pass: currentData.authorizations.some(
              ({ familyIdentity, status }) =>
                familyIdentity === command.input.familyIdentity &&
                status === "bound",
            ),
      }),
      EDL08: ({ command, currentData }) => ({
        pass: currentData.authorizations.some(
              ({ familyIdentity, status }) =>
                familyIdentity === command.input.familyIdentity &&
                status === "issued",
            ),
      }),
      EDL06: ({ currentData }) => {
        const authorizations = currentData.authorizations;
        return {
          pass: authorizations.every(({ status }) =>
            ["bound_terminal", "unbound_adverse_terminal"].includes(status),
          ),
          completeAuthorizationCut: true,
        };
      },
    },
    mutationByTransition: {
      EDL02: ({ currentData }) => ({ ...currentData }),
      EDL03: ({ currentData, command }) => ({
        ...currentData,
        remainingEvidenceBudget: currentData.remainingEvidenceBudget - 1,
        reservedEvidenceBudget: currentData.reservedEvidenceBudget + 1,
        authorizations: [
          ...currentData.authorizations,
          {
            familyIdentity: command.input.familyIdentity,
            ordinal: currentData.authorizations.length,
            status: "issued",
          },
        ],
      }),
      EDL05: ({ currentData, command }) => ({
        ...currentData,
        authorizations: currentData.authorizations.map((authorization) =>
          authorization.familyIdentity === command.input.familyIdentity
            ? {
                ...authorization,
                status: "bound_terminal",
                terminalClass: command.input.terminalClass,
              }
            : authorization,
        ),
      }),
      EDL08: ({ currentData, command }) => ({
        ...currentData,
        authorizations: currentData.authorizations.map((authorization) =>
          authorization.familyIdentity === command.input.familyIdentity
            ? {
                ...authorization,
                status: "unbound_adverse_terminal",
                terminalClass: "authorization_retired",
              }
            : authorization,
        ),
      }),
      EDL06: ({ currentData }) => ({
        ...currentData,
        inclusiveCutSealed: true,
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "EDL03",
    objectId: "ei20-lineage",
    initialData: {
      remainingEvidenceBudget: 1,
      reservedEvidenceBudget: 1,
      authorizations: [
        { familyIdentity: "family-0", ordinal: 0, status: "bound" },
      ],
    },
  });
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL02",
      objectId: "ei20-lineage",
      expectedRevision: 0,
      idempotencyKey: "ei20/admin-rejoin",
      input: {
        familyIdentity: "family-0",
        administrativeName: "renamed-campaign",
      },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL03",
      objectId: "ei20-lineage",
      expectedRevision: 1,
      idempotencyKey: "ei20/revision-1",
      input: { familyIdentity: "family-1" },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EDL03",
        objectId: "ei20-lineage",
        expectedRevision: 2,
        idempotencyKey: "ei20/duplicate-revision",
        input: { familyIdentity: "family-1" },
      }),
    ),
    ConflictError,
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL05",
      objectId: "ei20-lineage",
      expectedRevision: 2,
      idempotencyKey: "ei20/family-0-terminal",
      input: {
        familyIdentity: "family-0",
        terminalClass: "execution_failed",
      },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EDL06",
        objectId: "ei20-lineage",
        expectedRevision: 3,
        idempotencyKey: "ei20/close-incomplete",
        input: {},
      }),
    ),
    ConflictError,
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL08",
      objectId: "ei20-lineage",
      expectedRevision: 3,
      idempotencyKey: "ei20/family-1-adverse-terminal",
      input: { familyIdentity: "family-1" },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EDL06",
      objectId: "ei20-lineage",
      expectedRevision: 4,
      idempotencyKey: "ei20/close-complete",
      input: { externalCloseAuthorization: true },
    }),
  );
  const state = await fixture.load(
    "evaluation-decision-lineage",
    "ei20-lineage",
    { required: true },
  );
  const data = state.authoritativeStateCore.semanticState.data;
  assert.equal(data.authorizations.length, 2);
  assert.deepEqual(
    [...data.authorizations].map(({ ordinal }) => ordinal),
    [0, 1],
  );
  assert.equal(data.reservedEvidenceBudget, 2);
  assert.equal(data.remainingEvidenceBudget, 0);
  assert.equal(data.inclusiveCutSealed, true);
});
