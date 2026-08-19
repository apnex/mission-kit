---
id: S11
category: style
title: Technical identifiers in prose use backticks
added: 2026-05-24
status: active
supersedes: []
related: [S2, S5, S8]
---

# S11 - Technical identifiers in prose use backticks

## Rule

When a technical identifier appears in prose - paragraphs, bullets, headings, table cells, anywhere - wrap it in backticks (inline code formatting).

Counts as a technical identifier:

- Command / executable names: `apply.sh`, `kubectl`, `docker`.
- File paths: `/dev/nvidia*`, `/lib/modules/<kver>/build`,
  `/etc/modprobe.d/`.
- Filenames: `docker-compose.yml`, `nvidia.ko`, `Dockerfile`.
- Flags: `--purge`, `--skip-k3s`, `-n kube-system`.
- Variable / env / config names: `KUBECONFIG`, `NVreg_TbEgpuRecoverEnable`,
  `runtimeClassName`.
- API endpoints, k8s resource kinds + names: `nvidia.driver/state`,
  `DaemonSet`, `ServiceAccount/foo`.
- Architectural-term identifiers used as proper names: `Layer 0`,
  `Path A`, `Phase 3`.
- Function / type / class names in code prose: `cmd_uninstall`,
  `tb_egpu_pcie_state`.
- Package / module / image names: `nvidia-container-toolkit`,
  `apnex/nvidia-driver-diag`.

Format identifiers identically across contexts - backticks in a paragraph render the same as in a heading, table cell, or bullet.

---

## Don't backtick

- **Generic English words.** "The container starts." not "The `container`
  starts."
- **Product names used colloquially.** "Runs on Kubernetes." not "Runs
  on `Kubernetes`." But: "the `kubectl` binary" - that IS an identifier.
- **Narrative subjects.** "The workload uses the GPU." not "`The workload`
  uses the GPU."
- **People / organization names.** "NVIDIA's open driver" not "`NVIDIA`'s
  open driver." But: "the `nvidia.ko` module" - that IS an identifier.
- **URLs in markdown link targets.** The `[text](url)` form needs
  backticks on `text` if it's an identifier, but the `url` is already
  link-styled - no backticks there.
- **Section headings that ARE the artifact, in a fixed convention.** The
  `mod-*` Terraform-module SYN layout heads its sections `main.tf` and
  `apply`, bare, where the heading labels the whole section by what it
  produces rather than mentioning a file in passing. That is a
  structural label, like an Install heading. Backticking it fights the
  convention and reads as emphasis. The carve-out is narrow: it covers a
  heading that names the section's own subject, not one that merely
  mentions an identifier. A heading about configuring a specific binary
  still backticks that binary.

The test for borderline cases: *is this the literal name of a specific thing in the system that I could grep for?* If yes -> identifier -> backticks.\
If no -> English word -> no backticks.

---

## Rationale

**Visual distinction.** Inline code styling signals "this is a specific named thing." Without it, identifiers blend into surrounding prose visually - the reader has to parse syntax + context to know whether "layer 1" is "the first layer in the system's design" or "first-layer neural-network jargon." Backticks remove the ambiguity at a glance.

**Grep friendliness.** A reader who reads "the `apply.sh` script" and wants to find that script can grep the codebase for the literal string.\
Unmarked "the apply.sh script" works too, but mixed-with-prose identifiers are harder to extract by sight, and AI doc-parsers / indexers similarly benefit from the explicit marker.

**Consistency cost.** Once you backtick *some* identifiers, mixing in unmarked ones reads as accidental inconsistency.\
Either commit to the rule everywhere or don't backtick at all - picking sporadically is worse than either pole.

---

## Examples

**Bad:**

> Run apply.sh to set up Layer 1; the nvidia.driver/state label
> appears after kubectl rollout status succeeds.

**Good:**

> Run `apply.sh` to set up `Layer 1`; the `nvidia.driver/state` label
> appears after `kubectl rollout status` succeeds.

**Bad (mixed):**

> Run `apply.sh` to set up Layer 1; the `nvidia.driver/state` label
> appears after kubectl rollout status succeeds.

(Backticked `apply.sh` + unbackticked `Layer 1` + backticked label + unbackticked command = looks accidental even though some are right.)

---

## When to apply

- Authoring any new prose in any doc, anywhere in the project.
- Reviewing a PR diff - scan for bare identifiers that should be
  backticked.
- Opportunistic cleanups when editing an existing doc; touch what
  you're already touching, don't bulk-backfill speculatively.

---

## Origin

2026-05-24 README pass extended backtick treatment from commands + filenames (existing informal convention in the project) to architectural-term identifiers (`Layer N`).\
Surfacing the broader pattern showed it was already followed informally throughout the docs but never codified - promoting from convention to sanctioned rule eliminates the "is this case included?" judgment call.
