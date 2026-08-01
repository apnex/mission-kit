import test from "node:test";
import assert from "node:assert/strict";
import { IntegrityError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("an idempotency key reused with changed input is an integrity fault", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  await fixture.engine.execute(fixture.command());
  await assert.rejects(
    fixture.engine.execute(fixture.command({ value: 99 })),
    (error) => error instanceof IntegrityError,
  );
});
