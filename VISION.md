# mission-kit - Vision

**Status: enduring.**\
This document states why mission-kit exists and what it will never be.\
It carries no current state, no roadmap, and no schedule.\
What this corpus has found about itself and not yet done belongs to [`docs/BACKLOG.md`](docs/BACKLOG.md).

Holding this document authorises nothing.\
It ratifies no entry, admits no layer, and settles no rule.\
Those powers belong to the charter in [`README.md`](README.md) and to the checkers in [`tools/`](tools/README.md), and a change of direction is recorded there and absorbed here afterwards.

---

## North star

> Engineering judgement is a thing you can point at, hand over whole, and hold
> to account - so that any agent, anywhere, starting cold, reasons like the best
> engineer who ever worked on the problem, and can be shown to have done so.

Five terms in that sentence carry weight, so this document defines them rather than leaving them to the reader.

**Judgement**, not knowledge.\
Facts about a system belong to that system.\
What travels is the reasoning that separates a measurement from an inference, a boundary from a preference, a deferral from forgetting - the moves a good engineer makes without being asked, that no codebase contains and no cold reader acquires by looking harder.

**Point at** is the whole delivery mechanism.\
Adoption is a reference, not an installation, a migration, or a training run.\
An agent handed one address arrives holding the discipline, and the cost of adopting it does not scale with the size of what it governs.

**Hand over whole** means nothing essential is left in a head.\
The reasoning, the reason behind the reasoning, the failure it was learned from, and the condition under which it stops applying all transfer together.\
What survives a handover today is the conclusion; what is lost is everything that would let a later reader challenge it.

**Anywhere** is not a claim about file formats.\
The discipline answers to no language, no stack, no company, and no vendor, so the same reasoning holds for a kernel and for a spreadsheet.\
Judgement that works in one ecosystem only is that ecosystem's convention, and conventions do not compound.

**Held to account** is the half that keeps the rest from becoming exhortation.\
A judgement that cannot be checked is advice, and advice decays silently.\
Where a property can be verified by a machine it is, where it cannot the corpus says so plainly, and a claim nobody can falsify is a defect rather than a strength.

---

## The terminal state

The far end of this is not a better-organised corpus.\
It is a condition in which **engineering discipline has stopped being tacit.**

Today the reasoning that separates competent work from excellent work lives in senior heads, transmits by apprenticeship, degrades in the retelling, and leaves when its holder does.\
Every organisation rediscovers the same failure modes at its own expense, and the rediscovery is invisible because nobody counts it.\
The industry shares code freely and has never learned to share the understanding that produced it.

At the terminal state:

- **A newcomer inherits a discipline rather than absorbing one.** Anyone joining any project reasons at the level of that project's best practitioner immediately, because judgement was addressable rather than resident.
- **A lesson is learned once, anywhere.** A failure mode named in one programme is reachable from every other, so the second team to meet it recognises it instead of paying for it.
- **Nothing load-bearing is unfalsifiable.** Every claim carries its evidence, every rule states what would violate it, and a machine holds whatever a machine can hold - so being wrong is discoverable rather than merely possible.
- **The discipline outlives its authors and shows its own corrections.** What was believed stays readable beside what replaced it, because a record showing only the current answer teaches that answers never change.
- **Judgement compounds across organisations instead of resetting at each boundary.** This is the prize. Shared libraries mean nobody rewrites a parser; nothing equivalent exists for knowing which boundary to draw, so every team derives it again.

**None of this is true yet, and the distance is the programme.**\
This corpus is materially incomplete: layers exist that nothing consumes, rules exist that nothing checks, and its own instances are only now being written.\
That is a statement about where the work is, not a hedge on where it is going.

---

## Why mission-kit exists

An organisation staffed by humans accumulates practice in heads.\
It survives turnover badly and survives absence well: the person who knows why the boundary is there is usually still reachable.

An organisation staffed by agents has the opposite problem.\
Its workers start cold, retain nothing, and are individually capable of excellent reasoning they cannot carry forward.\
Nothing accrues.\
The same defect is rediscovered, the same boundary redrawn, the same lesson learned and lost, at a rate no human organisation could sustain and no human organisation has had to.

So institutional memory has to be external, or it does not exist.

That much is necessary and nowhere near sufficient, which is the part usually missed.\
A document nobody can reach is not memory.\
A rule nobody can cite cannot be applied.\
A principle that never changes what gets built is not in force.\
A claim nothing checks decays into decoration at exactly the speed it stops being true.

mission-kit exists because the gap between *written down* and *actually load-bearing* is where engineering discipline goes to die, and closing that gap is a construction problem rather than a documentation problem.

---

## What mission-kit is

**The portable specification of how an engineering organisation reasons** - reachable by any agent, structured so a rule arrives at the moment it is needed rather than the moment someone remembers it.

Three properties do the work, and they compose.

**Reachable.**\
Every entry states the condition under which to open it, so a reader finds a rule by recognising their own situation rather than by knowing the rule exists.\
This is the property that scales: a corpus of ten entries can be read end to end, and a corpus large enough to matter cannot.

**Citable.**\
Every entry has a stable identity, so a decision names the principle it rests on and a later reader follows the citation back.\
Reasoning that cannot be traced cannot be challenged, and reasoning that cannot be challenged stops being reasoning and becomes custom.

**Held by mechanism wherever mechanism can hold it.**\
Prose states intent; machines hold the properties machines can hold.\
What cannot be mechanised is named as such, so an unchecked rule is never mistaken for a checked one.

Two further commitments are structural rather than stylistic.

**It expects to be wrong, and is built to survive being corrected.**\
Entries carry correction banners rather than being quietly amended, deferrals carry the condition that revives them, and claims record whether they were measured or inferred.\
A corpus that could not be shown to be wrong would have no route to improvement and would be trusted anyway, which is the worse failure.

**It is one thing, not a family.**\
There is one place a given piece of judgement lives, and everything else cites it.\
A rule restated in two places reads as authoritative in both and drifts in one, and the drift is silent - so the discipline of a single home is not tidiness, it is the only reason the corpus can be trusted at scale.

---

## What mission-kit is not

The boundary is the half of a purpose that travels, so it is stated positively rather than left as an absence.

**Not a knowledge base.**\
It holds no facts about any system, no architecture of anything real, no answer to a domain question.\
Content that would be wrong on a different project belongs to that project.

**Not a style guide with ambitions.**\
Its writing rules exist because a document a cold agent cannot parse cannot carry judgement.\
They are the delivery mechanism, never the payload, and a corpus whose most-cited layer was its formatting rules would have failed.

**Not a process framework.**\
It prescribes no ceremony, no cadence, no meeting, and no status ritual.\
Where it prescribes a shape, the shape exists because its absence was observed to cost something specific.

**Not an autonomy substitute.**\
It amplifies a director's intent and never supplies it.\
Purpose, ratification, and the authority to change direction are human and remain so; a corpus that could generate its own mandate would be reasoning in a circle and calling the result agreement.

**Not a runtime.**\
It executes nothing, orchestrates nothing, and holds no state about work in progress.\
Coordination machinery is a different concern with a different lifecycle, and folding it in here would give this corpus two duties.

**Not self-validating.**\
A corpus cannot measure its own uptake from inside itself, and adoption of a rule this corpus published is evidence that it was followed rather than that it was right.\
The judgement that a rule is correct comes from outside or not at all.

---

## What success means

No single measure, because each one alone is satisfiable by something worthless.

- **A cold reader reaches the right rule** from the situation they are in, without knowing it exists.
- **A defect is caught by a mechanism** rather than by whoever happened to be careful that day.
- **A rule changes what gets built.** A principle cited in no decision is not in force, however well written.
- **A correction survives.** The wrong claim stays readable beside the right one, so the next reader learns that corrections happen here.
- **A deferral returns** on its stated condition rather than on someone's memory.
- **An entry is reached by someone who did not write it**, and is sufficient on its own.
- **The corpus is falsified from outside** - by an adopter, an instance, or a measurement - and survives the correction.
- **Rebuilding stops.** The same boundary is not drawn twice because nothing named it the first time.
- **Adoption costs a reference.** A project inherits the discipline by pointing at it, and pays no migration to do so.
- **Reach exceeds authorship.** The corpus is used by more organisations than contribute to it, which is the only external evidence that the judgement in it is general rather than local.

A corpus scoring well on every measure but the third has become a library.\
A corpus scoring well on the third alone has become a religion.

---

## Guardrails and nonclaims

**It does not claim its rules are correct** - only that they are reachable, citable, and where possible checked.\
Correctness is established by use and by challenge.

**It does not claim completeness.**\
Coverage is deliberately visible: gaps are recorded as gaps rather than filled speculatively, because a fabricated entry is worse than an acknowledged absence.

**It does not claim its own adoption as evidence for itself.**

**It does not claim that reading it produces good engineering.**\
It removes the excuse of not knowing; it cannot supply care.

**It does not claim to be finishable.**\
A corpus that stopped changing would be a corpus that had stopped being used.

**It does not hold authority over the projects that read it.**\
A project adopts what serves it and says so; unread guidance is a finding about this corpus before it is a finding about that project.

---

## Authority

This vision is held by the director.\
It is drafted by anyone and ratified only by the director, because purpose is the one thing no other role may supply.

It is amended, never quietly rewritten.\
A ruling that changes direction is recorded first and absorbed here afterwards, so the reasoning survives the change.
