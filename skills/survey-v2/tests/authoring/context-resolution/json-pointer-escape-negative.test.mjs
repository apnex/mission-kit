import test from "node:test";
import {
  resolveJsonPointer
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { assertContextError } from "./support.mjs";

test("a non-canonical JSON Pointer escape fails closed", () => {
  assertContextError(
    () => resolveJsonPointer({ value: 1 }, "/value~2"),
    "JSON_POINTER_INVALID",
    "/pointer"
  );
});
