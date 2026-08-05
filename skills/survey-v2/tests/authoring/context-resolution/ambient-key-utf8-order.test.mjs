import test from "node:test";
import {
  resolveContextClosure,
  resolveStoredResourceVersion
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

const utf8Earlier = "\ue000";
const utf16EarlierButUtf8Later = "\u{10000}";

test("ambient-key diagnostics use UTF-8 byte order in both context modules", () => {
  const input = scenario();
  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector],
      [utf16EarlierButUtf8Later]: true,
      [utf8Earlier]: true
    }),
    "CONTEXT_RESOLUTION_INVOCATION_INVALID",
    `/${utf8Earlier}`
  );

  assertContextError(
    () => resolveStoredResourceVersion(
      input.workspace,
      {
        ...input.record.reference,
        [utf16EarlierButUtf8Later]: true,
        [utf8Earlier]: true
      }
    ),
    "RESOURCE_REFERENCE_INVALID",
    `/reference/${utf8Earlier}`
  );
});
