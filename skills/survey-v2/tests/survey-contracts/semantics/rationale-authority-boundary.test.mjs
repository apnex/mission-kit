import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("semantic validators check structural ancestry and rationale presence without judging rationale truth", async () => {
  await runObligationScenario("O-SV09-01");
});
