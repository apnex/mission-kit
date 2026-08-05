import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  selector,
  sourceResource,
  stored,
  workspaceWith
} from "./support.mjs";

const inventorySize = 512;
const selectedLayerCount = 24;

test("a bounded 512-version inventory resolves 24 layers deterministically", () => {
  const records = [];
  const heads = [];
  const selectors = [];
  for (let index = 0; index < inventorySize; index += 1) {
    const suffix = String(index).padStart(4, "0");
    const record = stored(sourceResource({
      name: `brief-${suffix}`,
      title: `Brief ${suffix}`
    }));
    records.push(record);
    if (index >= selectedLayerCount) continue;
    const selectedSuffix = String(index).padStart(2, "0");
    const slot = `slot-${selectedSuffix}`;
    heads.push({ slot, reference: record.reference });
    selectors.push(selector({
      id: `context-${selectedSuffix}`,
      ordinal: index + 1,
      role: `role-${selectedSuffix}`,
      selection: { mode: "active-head", slot },
      fields: ["/spec/title"]
    }));
  }
  const workspace = workspaceWith({ records, heads });

  const first = resolveContextClosure({ workspace, selectors });
  const second = resolveContextClosure({ workspace, selectors });

  assert.deepEqual(first, second);
  assert.equal(first.spec.layers.length, selectedLayerCount);
  assert.deepEqual(
    first.spec.layers.map((layer) => layer.ordinal),
    Array.from(
      { length: selectedLayerCount },
      (_, index) => index + 1
    )
  );
});
