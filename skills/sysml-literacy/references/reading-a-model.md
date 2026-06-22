# Reading a model to answer a question

A repeatable six-step pass. It works for any SysML v2 model; practise it on `assets/example.sysml`.

## The pass

1. **Orient.** Read the `package` `doc` and the `enum def`s first — they are the model's *vocabulary*
   (the named states, kinds, classifications everything else refers to).
2. **Components.** Find the `part def`s (and `item def`s). For each, note its `attribute`s (its data) and
   its `ref`s (what it points at). The `ref`s are dependency edges.
3. **Behaviour.** Find the `state def`(s). Build the transition table: each
   `transition … first FROM accept EVENT then TO` is one row. The `entry; then X;` line is the start state.
4. **Workflow.** Find the `action def`(s). Chain the `action X; then Y;` lines into the ordered sequence;
   note `in`/`out` pins for the activity's inputs/outputs.
5. **Relations.** Follow the edges — `ref`, `:>` (specialize/subset), `:>>` (bind), qualified names
   (`Pkg::Thing`) — to trace dependencies and instance→type links across the model.
6. **Answer — only from the text.** The model asserts exactly what it writes. If a relationship isn't
   stated or derivable, the answer is "not specified" — do not infer beyond the model.

## Worked questions against `assets/example.sysml`

- *"What is the start state of `BuildLifecycle`?"* → step 3, the `entry; then idle;` line → **idle**.
- *"From `running`, what events are legal and where do they go?"* → step 3, scan `first running` →
  `TestsGreen → passed`, `TestsRed → failed`.
- *"Can you deploy from a `failed` build?"* → a **Step-6 lesson.** The model has **no deploy action**, and
  `GreenBeforeDeploy` is only an `attribute statement : String` — unformalized prose, **not** an enforced
  constraint. Honest answer: *the model does not formally forbid it; the only hard fact is there is no
  `failed → passed` path (failed reaches `running` only via `Retried`).* Reading the English requirement
  string as an enforceable rule is exactly the inference Step 6 forbids — don't.
- *"What does a `Deployer` depend on?"* → step 2, its `ref builtBy : Builder` → a **Builder** (which in
  turn `ref source : Repository`) → transitively, a Repository.
- *"What is the build step order?"* → step 4, `RunBuild` → checkout → compile → runTests → publish.
- *"What is `nightlyPipeline`'s `fastBuilder`?"* (the instance) → step 5: `fastBuilder : Builder :> builders`
  → a **Builder** that subsets the Pipeline's `builders` feature, with `:>> parallelJobs = 8` → **a Builder
  with parallelJobs redefined to 8**.

**Also scan for:** unreachable states (no transition's `then` targets them) and declared-but-unused events
or elements — a model may declare more than it wires up. Note them rather than assume they are active.

## The capstone (the dogfood)

This six-step pass is itself modelled, in the notation you just learned, as an `action def` in
[`assets/reading-procedure.sysml`](../assets/reading-procedure.sysml). Read it with the pass above: it is
a `state`-free `action def` whose `action X; then Y;` chain *is* the six steps. If you can read it, the
skill has done its job — you read a model of the method by using the method.
