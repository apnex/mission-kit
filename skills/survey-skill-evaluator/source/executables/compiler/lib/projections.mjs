import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonicalBytes } from "./hash.mjs";
import { generateSchemas } from "./schemas.mjs";

const COMMANDS = new Map([
  ["campaign-init.mjs", "campaign init"],
  ["campaign-seal.mjs", "campaign seal"],
  ["campaign-validate.mjs", "campaign validate"],
  ["campaign-run.mjs", "campaign run"],
  ["campaign-resume.mjs", "campaign resume"],
  ["campaign-status.mjs", "campaign status"],
  ["campaign-report.mjs", "campaign report"],
  ["package-check.mjs", "package check"]
]);

const REFERENCES = new Map([
  [
    "authority.md",
    `# Authority and isolation

Use a closed-world, default-deny capability policy. Keep every knowledge-bearing
role in a fresh context and workspace. Route protected material only through
the deterministic orchestrator, which may validate and deliver bytes but may
not interpret intent, score evidence, adjudicate, or promote.

The synthetic Director has full authority only inside its disposable
\`eval://\` session. The Survey executor receives one assigned package and no
explicit arm map, direction, semantic key, or peer result. Judges receive
frozen anonymized evidence after execution. Promotion, package installation,
assurance signing, and real-Director authority are always external.

Reject a campaign before assignment when the host cannot enforce fresh
contexts, isolated workspaces, restricted tools/catalogs, protected payload
routing, controlled network access, and absence of production credentials.
Record every denied access or isolation failure as evidence.
`
  ],
  [
    "campaign.md",
    `# Campaign workflow

Create authored inputs with \`campaign init\`. Before execution, seal the exact
candidate and control bytes, claim, estimand, population, scenarios, semantic
keys, assignments, reviewer allocation, stopping rule, metrics, judging policy,
analysis plan, and recommendation policy.

Validate all schemas, package roots, authority bindings, family/cohort
authorizations, assurance admission, and lifecycle preconditions. Advance state
only through the registered lifecycle transition tuples. Persist accepted or
rejected event, resulting state, semantic cursor, and outbox atomically.

Use \`campaign run\` for a first advance and \`campaign resume\` after a crash.
Replay identical commands idempotently; reject changed bytes under the same
identity. Status is read-only. Reports derive only from sealed evidence.

Retain every assignment and terminal attempt. Failure first fences new work and
drains the complete realized-child cut, including never-granted positions,
before terminal campaign closure.
`
  ],
  [
    "evidence-analysis.md",
    `# Evidence and analysis

Freeze complete observable inputs, outputs, state, tool actions, telemetry,
failures, and provenance without requiring private reasoning. Seal an output
before its immutable derivation sidecar. Keep protected evidence and redacted
disclosures separate and cross-digest-bound.

Publish three explicit population views: all assigned, instrument-valid causal,
and release-qualified. Preserve denominators, failures, missingness, exclusions,
and assumptions. Use independently committed ballots for semantic or ordinal
judgment and preserve pre-adjudication disagreement.

Report empirical distributions, blocked or paired effects, dependence-aware
uncertainty, tails, failure rates, sensitivity bounds, ties, Pareto sets, and
rank uncertainty. Do not assume normality. Treat missing telemetry as missing.
Classify attention as toil or protected learning investment; never optimize
learning investment as an adverse cost.

The canonical recommendation is deterministic evidence with
\`promotionAuthorized: false\`.
`
  ],
  [
    "learning.md",
    `# Learning protocol

Capture an actor-authored completion reflection for every completed work unit
and create durable learning evidence for registered failures, findings,
insights, friction, and completion triggers.

The sovereign LR product may grant one diagnostic debate. DB commits at least
two independent peer-masked opening slots, closes the opening barrier before
cross-response work, preserves all contributions and dissent, and emits one
typed terminal result. Capacity unavailability, incomplete cuts, and
unverifiable source state remain distinct terminal evidence.

Source transitions own immutable SourceRequests. The deterministic projector
maps \`lr03_diagnosis\`, \`completion_reflection\`, and
\`recognized_insight_trigger\` only to LC01, and
\`post_lr4_payback_observation\` only to LC02. LCR alone admits, fences, and
reconciles a request. LC consumes an eligible grant and never authors the
source. A registered observer authors the immutable pre-LCR PaybackObservation.

Request-scoped quarantine must not block unrelated requests. Only an
LR03-origin LC01 request may return terminal capital recovery to LR; direct
LC01 and every LC02 conflict or terminal result remain immutable LCR/LC
evidence without reopening LR4.
`
  ],
  [
    "assurance.md",
    `# Assurance and package boundary

The evaluator root is sovereign and relocatable. It must not import the
governance project, canonical Survey v1, candidate Survey v2, a repository
parent, or a sibling runtime package.

\`source/evidence/e0-baseline-evidence.json\` is the package-owned E0
prerequisite and threat-model record. It freezes the ratified Survey v2
design, normative lifecycle projection refinement, exact candidate commit and
mechanical package identity, evaluator design/intent, Mission Kit baseline,
terminal-ratification erratum and canonical v1 characterization identities
without importing those external sources. Its deterministic assurance ceiling
is E5; it claims no E6, E7, canary, release, or promotion result.

\`compile.sh\` is the sole build authority. It generates schemas, operator
references, role capsules, scripts, UI metadata, \`generated.lock.json\`, and
\`package.manifest.json\`. Generated targets never become canonical inputs.

The package manifest inventories every regular file except itself using exact
path, portable mode, byte length, and raw SHA-256. Its payload fold uses
\`evaluator-payload\`. The generated lock excludes itself and the package
manifest from its internal generated-target fold, while the finished lock is an
ordinary payload member. The external evaluator digest is derived from the
semantic manifest digest and payload root and is never stored in the manifest.

Reject unsafe links, special files, path traversal, ASCII case-fold collisions,
invalid UTF-8 paths, and partial execute-bit modes. A recommendation or
assurance certificate is evidence, never release authority.
`
  ],
  [
    "index.md",
    `# Schema and lifecycle index

The generated \`schemas/\` directory contains exactly 141 uniquely identified,
closed JSON Schema 2020-12 contracts. The canonical catalog is
\`source/manifests/schema-catalog.json\`; generated schemas are projections and
must not be edited.

The canonical lifecycle manifest contains exactly 17 machines and 267 labeled
transition tuples. Runtime transition admission must resolve through that
manifest; diagrams and readable tables are projections only.

Key definition ownership is closed:

- Diagnostic debate state owns WorkOrder, SlotDisposition, and ResultDelivery.
- Diagnostic debate result owns TerminalResult.
- Outbox message owns BrokerDeliveryClaim and DrainReceipt.
- Learning-capital request state owns SourceRequest, ConditionalTerminalizer,
  and RequestResultLedger.
- Learning-capital operation grant owns eligible and denied branches.
- Learning-capital source disposition owns ordinary and terminal branches.
- PaybackObservation is registered-observer-authored before LCR admission.

Run \`compile.sh --check --verify-package\` to validate catalog counts, schema
IDs, generated bytes, source/compiler/generated roots, payload inventory, and
external package identity.
`
  ]
]);

function projection(pathname, bytes, recipeId, sourcePaths, mode = "0644") {
  return {
    path: pathname,
    bytes: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, "utf8"),
    mode,
    recipeId,
    sourcePaths
  };
}

function scriptBytes(forcedCommand) {
  return Buffer.from(
    `#!/usr/bin/env node
import { runCommand } from "../source/executables/cli/index.mjs";

const result = await runCommand(process.argv.slice(2), {
  forcedCommand: ${JSON.stringify(forcedCommand)}
});
if (Number.isInteger(result)) process.exitCode = result;
`,
    "utf8"
  );
}

export async function createProjectionMap({
  root,
  schemaCatalog,
  schemaCatalogPath,
  lifecycleManifest
}) {
  const projections = new Map();
  const skillTemplatePath = "source/templates/SKILL.template.md";
  const uiTemplatePath = "source/templates/openai.yaml";
  const campaignTemplatePath =
    "source/templates/campaign/campaign-input.template.json";
  const boundariesTemplatePath =
    "source/templates/assets/role-boundaries.template.json";
  const capsuleTemplatePath =
    "source/templates/role-capsules/role-capsule.template.json";
  const roleRegistryPath = "source/fragments/roles/role-registry.json";

  projections.set(
    "SKILL.md",
    projection(
      "SKILL.md",
      await readFile(path.join(root, skillTemplatePath)),
      "public-skill/v1",
      [skillTemplatePath]
    )
  );
  projections.set(
    "agents/openai.yaml",
    projection(
      "agents/openai.yaml",
      await readFile(path.join(root, uiTemplatePath)),
      "openai-interface/v1",
      [uiTemplatePath, skillTemplatePath]
    )
  );
  projections.set(
    "assets/campaign-input.template.json",
    projection(
      "assets/campaign-input.template.json",
      canonicalBytes(
        JSON.parse(await readFile(path.join(root, campaignTemplatePath), "utf8"))
      ),
      "campaign-input-template/v1",
      [campaignTemplatePath]
    )
  );
  const roleRegistry = JSON.parse(
    await readFile(path.join(root, roleRegistryPath), "utf8")
  );
  const roleBoundaries = JSON.parse(
    await readFile(path.join(root, boundariesTemplatePath), "utf8")
  );
  roleBoundaries.roles = roleRegistry.roles.map((role) => ({
    roleId: role.roleId,
    awarenessRoleClass: role.awarenessRoleClass,
    authorizedContents: role.authorizedContents,
    forbiddenContents: role.forbiddenContents,
    allowedCapabilities: role.allowedCapabilities,
    forbiddenCapabilities: role.forbiddenCapabilities
  }));
  projections.set(
    "assets/role-boundaries.json",
    projection(
      "assets/role-boundaries.json",
      canonicalBytes(roleBoundaries),
      "role-boundaries/v1",
      [boundariesTemplatePath, roleRegistryPath]
    )
  );

  for (const [relativePath, schema] of generateSchemas(schemaCatalog, {
    lifecycleManifest
  })) {
    projections.set(
      relativePath,
      projection(
        relativePath,
        canonicalBytes(schema),
        "runtime-schema/v1",
        [
          schemaCatalogPath,
          "source/manifests/lifecycles.json",
          "source/executables/compiler/lib/schemas.mjs",
          "source/executables/compiler/lib/hash.mjs",
          "source/executables/compiler/lib/schema-contracts/catalog.mjs",
          "source/executables/compiler/lib/schema-contracts/execution.mjs",
          "source/executables/compiler/lib/schema-contracts/governance.mjs",
          "source/executables/compiler/lib/schema-contracts/handoffs.mjs",
          "source/executables/compiler/lib/schema-contracts/primitives.mjs",
          "source/executables/statistics/contracts.mjs",
          "source/executables/statistics/input-boundary.mjs"
        ]
      )
    );
  }

  for (const [filename, contents] of REFERENCES) {
    const relativePath = `references/${filename}`;
    projections.set(
      relativePath,
      projection(
        relativePath,
        contents,
        "operator-reference/v1",
        ["source/executables/compiler/lib/projections.mjs"]
      )
    );
  }

  const capsuleTemplate = JSON.parse(
    await readFile(path.join(root, capsuleTemplatePath), "utf8")
  );
  for (const role of roleRegistry.roles) {
    const roleId = role.roleId;
    const contents = {
      ...capsuleTemplate,
      roleId,
      awarenessRoleClass: role.awarenessRoleClass,
      authorizedContents: role.authorizedContents,
      forbiddenContents: role.forbiddenContents,
      allowedCapabilities: role.allowedCapabilities,
      forbiddenCapabilities: role.forbiddenCapabilities,
      budgets: roleRegistry.budgets
    };
    const relativePath = `references/role-capsules/${roleId}.json`;
    projections.set(
      relativePath,
      projection(
        relativePath,
        canonicalBytes(contents),
        "role-capsule/v1",
        [capsuleTemplatePath, roleRegistryPath]
      )
    );
  }

  for (const [filename, forcedCommand] of COMMANDS) {
    const relativePath = `scripts/${filename}`;
    projections.set(
      relativePath,
      projection(
        relativePath,
        scriptBytes(forcedCommand),
        "runtime-command-wrapper/v1",
        ["source/executables/compiler/lib/projections.mjs"],
        "0755"
      )
    );
  }

  return projections;
}
