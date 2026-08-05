import {
  contextSelectorDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  createReducerSubmissionScenario,
  executableDigest,
  passRegistrySource,
  reducerCommandBase,
  reducerSubmissionInventory,
  rehashAuthority,
  trustedReducerInputs,
} from "../reducer/support.mjs";

export async function createEventInputScenario() {
  const scenario = await createReducerSubmissionScenario();
  scenario.workspace.spec.authoringState = "awaiting_acceptance";
  const reference =
    scenario.workspace.spec.resourceVersions[0].reference;
  const selector = {
    id: "event-intake",
    selectorDigest: `sha256:${"0".repeat(64)}`,
    ordinal: 1,
    role: "intake",
    resourceType: {
      apiVersion: reference.apiVersion,
      kind: reference.kind,
    },
    cardinality: { min: 1, max: 1 },
    requiredLifecycleState: "frozen",
    lifecycleRule: { mode: "workspace-resource-version" },
    selection: {
      mode: "event-input",
      inputKey: "intake",
    },
    projection: {
      id: "event-intake-projection",
      digest: executableDigest("4"),
      fields: ["/spec/inventory"],
    },
  };
  selector.selectorDigest = contextSelectorDigest(selector);
  scenario.profile.spec.transitionBindings.find(
    (binding) => binding.transitionId === "AT02",
  ).inputSelectors = [selector];
  rehashAuthority(scenario);
  return { reference, scenario, selector };
}

export async function reduceEventInputs(
  inputs,
  { aliasSecondInput = false } = {},
) {
  const { reference, scenario, selector } =
    await createEventInputScenario();
  let aliasSelector;
  if (aliasSecondInput) {
    aliasSelector = structuredClone(selector);
    aliasSelector.id = "event-policy";
    aliasSelector.ordinal = 2;
    aliasSelector.role = "policy";
    aliasSelector.selection.inputKey = "policy";
    aliasSelector.selectorDigest =
      contextSelectorDigest(aliasSelector);
    scenario.profile.spec.transitionBindings.find(
      (binding) => binding.transitionId === "AT02",
    ).inputSelectors.push(aliasSelector);
    rehashAuthority(scenario);
  }
  const calls = [];
  let observed;
  const result = reduceAuthoring(
    scenario.profile,
    scenario.protocol,
    scenario.workspace,
    {
      class: "event",
      eventId: "ACCEPT",
      base: reducerCommandBase(scenario.workspace),
      commandDigest: executableDigest("1"),
      payloadDigest: executableDigest("2"),
      evidenceDigest: executableDigest("3"),
      inputs,
      externalCouplings: [],
    },
    await trustedReducerInputs({
      executables: passRegistrySource({
        handlerInvoke(input) {
          calls.push("handler");
          observed = input;
          return { status: "accept", products: [] };
        },
      }),
      inventory: reducerSubmissionInventory(scenario),
    }),
  );
  return {
    calls,
    observed,
    reference,
    result,
    scenario,
    selector,
    aliasSelector,
  };
}
