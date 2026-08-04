import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("RoundInterpretation runtime ingress resolves only a typed RoundResponseSet artifact", async () => {
  await runObligationScenario("O-SV13-03");
});
