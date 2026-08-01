import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("TE32 hostile work items and role outputs cannot smuggle evaluator authority or executable accessors", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);

  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "survey_executor",
        workOrderId: "te32-forbidden-input",
        inputProjection: {
          workItem: {
            instruction: "ordinary text",
            promotionCredential: "candidate-controlled",
          },
        },
        outputSchemaId: "role-output/survey-executor/v1",
      }),
    AuthorizationError,
  );

  let getterCalls = 0;
  const accessorInput = {};
  Object.defineProperty(accessorInput, "workItem", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "execute me";
    },
  });
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "survey_executor",
        workOrderId: "te32-accessor-input",
        inputProjection: accessorInput,
        outputSchemaId: "role-output/survey-executor/v1",
      }),
    ValidationError,
  );
  assert.equal(getterCalls, 0);

  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const safeCapsule = buildRoleCapsule({
    roleClass: "survey_executor",
    workOrderId: "te32-hostile-output",
    inputProjection: { workItem: "ordinary text" },
    outputSchemaId: "role-output/survey-executor/v1",
  });
  await assert.rejects(
    runner.run(safeCapsule, async () => async () => ({
      artifact: { title: "candidate output" },
      promotion: { authorized: true },
    })),
    AuthorizationError,
  );
});
