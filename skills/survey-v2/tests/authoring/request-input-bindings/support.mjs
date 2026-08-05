import {
  contextSelectorDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  rehashAuthority,
} from "../reducer/support.mjs";

function firstTask(scenario) {
  return scenario.profile.spec.tasks[0];
}

export function configureActiveHeadInputBinding(
  scenario,
  inputKey = "intake_ancestry",
) {
  const task = firstTask(scenario);
  const selector = task.contextSelectors[0];
  task.requestInputBindings = [{
    inputKey,
    selectorId: selector.id,
  }];
  rehashAuthority(scenario);
  return { inputKey, selector, task };
}

export function configureRequestReferenceInputBinding(
  scenario,
  inputKey = "intake_reference",
) {
  const task = firstTask(scenario);
  const selector = task.contextSelectors[0];
  selector.selection = {
    mode: "request-reference",
    inputKey,
  };
  selector.selectorDigest = contextSelectorDigest(selector);
  task.requestInputBindings = [{
    inputKey,
    selectorId: selector.id,
  }];
  rehashAuthority(scenario);
  return { inputKey, selector, task };
}

export function configureAliasedRequestReferenceBindings(
  scenario,
) {
  const task = firstTask(scenario);
  const first = task.contextSelectors[0];
  first.selection = {
    mode: "request-reference",
    inputKey: "intake_reference",
  };
  first.selectorDigest = contextSelectorDigest(first);
  const second = structuredClone(first);
  second.id = "brief-source-alias";
  second.ordinal = 2;
  second.role = "policy";
  second.selection.inputKey = "policy_reference";
  second.selectorDigest = contextSelectorDigest(second);
  task.contextSelectors = [first, second];
  task.requestInputBindings = [
    {
      inputKey: first.selection.inputKey,
      selectorId: first.id,
    },
    {
      inputKey: second.selection.inputKey,
      selectorId: second.id,
    },
  ];
  rehashAuthority(scenario);
  return { first, second, task };
}
