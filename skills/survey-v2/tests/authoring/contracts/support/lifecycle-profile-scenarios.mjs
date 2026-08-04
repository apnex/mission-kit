import {
  contextSelectorDigest,
  profileManifestDigest
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  loadContractFixture
} from "./contract-validation.mjs";

export async function profileWithSelector(mutator) {
  const profile = await loadContractFixture(
    "positive",
    "authoring-profile-manifest"
  );
  const selector = profile.spec.tasks[0].contextSelectors[0];
  mutator(selector, profile);
  if (Object.hasOwn(selector, "lifecycleRule")) {
    selector.selectorDigest = contextSelectorDigest(selector);
  }
  profile.spec.profileDigest = profileManifestDigest(profile);
  return { profile, selector };
}
