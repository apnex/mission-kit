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

test(
  "Assignment issuance dispatches the digest-pinned projector and retains its exact view",
  async () => {
    let calls = 0;
    const harness = await createCoordinatorHarness({
      projectorInvoke(input) {
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
        const standard = defaultProjectorInvoke(input);
        return {
          status: "accept",
          content: exactTextContent(Buffer.concat([
            textContentBytes(standard.content),
            Buffer.from(
              "\nprojection-owner: registered-projector\n",
              "utf8",
            ),
          ])),
        };
      },
    });

    const issued = await issueAssignment(harness);
    assert.equal(calls, 3);
    assert.match(
      Buffer.from(issued.viewBytes).toString("utf8"),
      /projection-owner: registered-projector\n$/u,
    );
    assert.deepEqual(
      textContentBytes(
        issued.projectionArtifact.spec.output.content,
      ),
      Buffer.from(issued.viewBytes),
    );

    const { pending } = await harness.coordinator.read(
      harness.storeId,
    );
    assert.equal(calls, 4);
    assert.deepEqual(
      Buffer.from(pending.viewBytes),
      Buffer.from(issued.viewBytes),
    );
  },
);
