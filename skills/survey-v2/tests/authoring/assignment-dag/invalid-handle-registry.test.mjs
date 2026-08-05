import assert from "node:assert/strict";
import test from "node:test";
import { deriveRequestHandle } from "../../../source/authoring/kernel/assignment-dag.mjs";
import { AuthoringAssignmentDagError } from "../../../source/authoring/kernel/assignment-dag.mjs";
import { digestWithPrefix } from "./support.mjs";

test("malformed occupied-handle registries are rejected as a closed input", () => {
  const requestDigest = digestWithPrefix("12345678", "a");
  const duplicate = {
    handle: "abcdef12",
    requestDigest: digestWithPrefix("abcdef12", "b")
  };
  const invalidRegistries = [
    null,
    [{ handle: "too-short", requestDigest }],
    [{ handle: "12345678", requestDigest: "sha256:not-a-digest" }],
    [
      duplicate,
      {
        handle: duplicate.handle,
        requestDigest: digestWithPrefix("abcdef12", "c")
      }
    ],
    [
      {
        handle: "abcdef12",
        requestDigest: digestWithPrefix("12345678", "d")
      }
    ],
    [
      {
        handle: "abcdef12",
        requestDigest: digestWithPrefix("abcdef123", "e")
      },
      {
        handle: "abcdef123",
        requestDigest: digestWithPrefix("abcdef123", "e")
      }
    ]
  ];

  for (const occupied of invalidRegistries) {
    assert.throws(
      () => deriveRequestHandle({ requestDigest, occupied }),
      (error) => {
        assert.equal(error instanceof AuthoringAssignmentDagError, true);
        assert.equal(error.code, "HANDLE_REGISTRY_INVALID");
        return true;
      }
    );
  }
});
