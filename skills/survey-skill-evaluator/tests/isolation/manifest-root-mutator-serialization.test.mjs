import assert from "node:assert/strict";
import { setImmediate as yieldTurn } from "node:timers/promises";
import test from "node:test";
import { runDescriptorSchedule } from "../run-manifest.mjs";

test("manifest scheduling never overlaps a package-root mutator with another test and preserves descriptor order", async () => {
  const records = [
    {
      descriptor: {
        testId: "read.a",
        executionIsolationClass: "read-only-package",
      },
    },
    {
      descriptor: {
        testId: "read.b",
        executionIsolationClass: "read-only-package",
      },
    },
    {
      descriptor: {
        testId: "mutate",
        executionIsolationClass: "package-root-mutating",
      },
    },
    {
      descriptor: {
        testId: "read.c",
        executionIsolationClass: "read-only-package",
      },
    },
  ];
  let activeReaders = 0;
  let activeMutators = 0;
  const overlapFaults = [];

  const results = await runDescriptorSchedule(
    records,
    2,
    async ({ descriptor }) => {
      if (descriptor.executionIsolationClass === "package-root-mutating") {
        if (activeReaders !== 0 || activeMutators !== 0) {
          overlapFaults.push(descriptor.testId);
        }
        activeMutators += 1;
      } else {
        if (activeMutators !== 0) overlapFaults.push(descriptor.testId);
        activeReaders += 1;
      }
      await yieldTurn();
      if (descriptor.executionIsolationClass === "package-root-mutating") {
        activeMutators -= 1;
      } else {
        activeReaders -= 1;
      }
      return descriptor.testId;
    },
  );

  assert.deepEqual(overlapFaults, []);
  assert.deepEqual(results, ["read.a", "read.b", "mutate", "read.c"]);
});
