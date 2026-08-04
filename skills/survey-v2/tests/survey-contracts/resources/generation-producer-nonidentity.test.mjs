import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("GenerationRecord producer and evidence changes do not alter its created-resource references", async () => {
  await runObligationScenario("O-AS10-07");
});
