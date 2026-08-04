import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("QuestionFrameSet is a coordination container and not a ContextFrame altitude", async () => {
  await runObligationScenario("O-SV02-01");
});
