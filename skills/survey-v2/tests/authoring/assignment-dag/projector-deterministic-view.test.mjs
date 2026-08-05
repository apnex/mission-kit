import assert from "node:assert/strict";
import test from "node:test";
import {
  reproduceAssignmentView,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  renderBlankTextForm,
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  issueK10TextAssignment,
} from "./support.mjs";

test(
  "a supplied projector deterministically owns the exact Assignment view bytes",
  async () => {
    let calls = 0;
    function renderProjection(input) {
      calls += 1;
      assert.deepEqual(
        Object.keys(input).sort(),
        [
          "contextClosure",
          "formDefinition",
          "projectionBinding",
          "request",
          "requestHandle",
        ],
      );
      assert.equal(Object.isFrozen(input), true);
      assert.equal(Object.isFrozen(input.projectionBinding.engine), true);
      const builtIn = renderBlankTextForm({
        formDefinition: input.formDefinition,
        contextClosure: input.contextClosure,
        requestHandle: input.requestHandle,
      });
      return Buffer.concat([
        builtIn,
        Buffer.from("\nprojection-owner: test-projector\n", "utf8"),
      ]);
    }

    const issued = await issueK10TextAssignment({
      renderProjection,
    });
    assert.equal(calls, 2);
    assert.match(
      issued.blankViewBytes.toString("utf8"),
      /projection-owner: test-projector\n$/u,
    );
    assert.deepEqual(
      textContentBytes(
        issued.projectionArtifact.spec.output.content,
      ),
      issued.blankViewBytes,
    );
    assert.deepEqual(
      reproduceAssignmentView({
        ...issued,
        renderProjection,
      }),
      issued.blankViewBytes,
    );
    assert.equal(calls, 3);
  },
);
