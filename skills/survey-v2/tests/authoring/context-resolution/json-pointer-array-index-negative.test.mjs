import test from "node:test";
import {
  resolveJsonPointer
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { assertContextError } from "./support.mjs";

test("an array index with a leading zero is not a canonical RFC 6901 array selection", () => {
  assertContextError(
    () => resolveJsonPointer({ values: ["zero", "one"] }, "/values/01"),
    "JSON_POINTER_ARRAY_INDEX_INVALID",
    "/pointer"
  );
});
