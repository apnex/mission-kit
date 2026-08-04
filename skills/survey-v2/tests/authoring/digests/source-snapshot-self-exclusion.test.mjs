import test from "node:test";
import {
  projectSourceSnapshotCore,
  sourceSnapshotDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertResourceSelfExclusion,
  selfDigestedResource
} from "./resource-fixture.mjs";

test("SourceSnapshot digest omits only sourceDigest from its semantic resource core", () => {
  assertResourceSelfExclusion({
    digest: sourceSnapshotDigest,
    domain: "source-snapshot",
    project: projectSourceSnapshotCore,
    resource: selfDigestedResource("SourceSnapshot", "sourceDigest", {
      content: {
        mediaType: "text/plain",
        encoding: "base64",
        byteLength: 6,
        data: "c291cmNl"
      }
    }),
    selfDigestField: "sourceDigest"
  });
});
