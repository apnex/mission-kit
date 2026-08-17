import assert from "node:assert/strict";
import test from "node:test";
import { LifecycleEngine } from "../../source/executables/engine/index.mjs";
import {
  makeDbf00Fixture,
  rootedBrokerClaim,
} from "../helpers/dbf00-fixture.mjs";

test("DBF00 requires broker closure and authoritative verified debate absence", async (t) => {
  const fixture = await makeDbf00Fixture();
  t.after(fixture.cleanup);
  const outcome = await fixture.learning.buildDbf00Result({
    diagnosticDebateResultId: "db-result-1",
    terminalResultId: "terminal-1",
    diagnosticDebateId: "db-1",
    lr02GrantId: "lr02-grant-1",
    brokerClaim: rootedBrokerClaim(),
  });
  assert.equal(
    outcome.result.terminalResult.brokerClosure,
    "fenced_before_delivery",
  );
  assert.equal(
    outcome.result.terminalResult.terminalType,
    "diagnosis_unavailable",
  );

  const engine = new LifecycleEngine({
    registry: null,
    stateStore: fixture.stateStore,
  });
  await engine.createParentStagedGenesis({
    machineId: "diagnostic-debate",
    objectId: "db-existing",
    initialState: "DB0_OPEN",
    parentBinding: {
      parentMachineId: "learning-record",
      parentObjectId: "lr-1",
      parentPriorAuthoritativeRoot: "a".repeat(64),
      parentOrderId: "lr-1/db-existing",
      parentFence: 0,
    },
  });
  await assert.rejects(
    fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-1",
      terminalResultId: "terminal-1",
      diagnosticDebateId: "db-existing",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: rootedBrokerClaim({ operationId: "db-existing" }),
    }),
    /cannot overwrite/u,
  );
  await assert.rejects(
    fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-1",
      terminalResultId: "terminal-1",
      diagnosticDebateId: "db-1",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: rootedBrokerClaim({
        state: "pending",
        fenceEvidence: undefined,
        fencedAtMs: undefined,
      }),
    }),
    /requires a fenced-before-delivery/u,
  );
  await assert.rejects(
    fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-1",
      terminalResultId: "terminal-1",
      diagnosticDebateId: "db-1",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: rootedBrokerClaim(),
      absenceReceipt: {
        machineId: "diagnostic-debate",
        objectId: "db-1",
        absentAuthoritativeStateRoot: "f".repeat(64),
      },
    }),
    /must be obtained from the authoritative StateStore/u,
  );
});
