import test from "node:test";
import {
  resolveJsonPointer
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { assertContextError } from "./support.mjs";

test("JSON Pointer resolution never traverses an inherited object property", () => {
  assertContextError(
    () => resolveJsonPointer({}, "/toString"),
    "JSON_POINTER_UNRESOLVED",
    "/pointer"
  );
});
