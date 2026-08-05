import assert from "node:assert/strict";
import test from "node:test";
import {
  exactTextContent,
  textContentBytes,
} from "../../../../source/authoring/kernel/text-forms.mjs";
import {
  defaultProjectorInvoke,
} from "../../reducer/support.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

function taggedProjector(tag) {
  return (input) => {
    const standard = defaultProjectorInvoke(input);
    return {
      status: "accept",
      content: exactTextContent(Buffer.concat([
        textContentBytes(standard.content),
        Buffer.from(`\nprojection-owner: ${tag}\n`, "utf8"),
      ])),
    };
  };
}

test(
  "cold coordinator reproduction rejects divergent bytes from the same claimed projector identity",
  async () => {
    const warm = await createCoordinatorHarness({
      projectorInvoke: taggedProjector("original"),
    });
    await issueAssignment(warm);
    const before = await warm.store.read(warm.storeId);

    const cold = await createCoordinatorHarness({
      storeId: warm.storeId,
      driver: warm.driver,
      persistence: warm.persistence,
      initialize: false,
      projectorInvoke: taggedProjector("divergent"),
    });

    await assert.rejects(
      () => cold.coordinator.read(cold.storeId),
      (error) =>
        error?.code === "DAG_VIEW_REPRODUCTION_MISMATCH",
    );

    const after = await cold.store.read(cold.storeId);
    assert.deepEqual(after, before);
    assert.equal(after.commitRevision, 1);
  },
);
