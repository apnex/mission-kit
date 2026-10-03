# B38 - director's requirements for agent-to-human communication

The director's statement, verbatim, given in session after the explain baseline.\
It is the ground truth the explain set's metric is derived from.

---

## Verbatim

> You often throw large walls of text at me, with internal narrative of what you are thinking or did - without "getting to the point".
> My context as a human is limited, and I need you to structure all communicate with me as a dialogue that obeys progressive disclosure, either guided conversation that allows the human to agree, say "next", or "proceed" and have it clear and simple.
> For questions - I don't need an entirely history lesson - I just need a simple flow that explains why this decision needs to happen, what the impact or cost is, pause for questions or follow on understanding - perhaps interactively.
> Also also one question at a time.
> I'd now just said a whole range of related and loosely decoupled items around agent-human communication what probably doesnt have any particular schema, or structure codified in mission kit.
> I dont even know how to begin to reason with that codification and would ask that you guide this process.

---

## Reframed by the director

> I'm asking you to respect my limited context and capacity - and to guide me through any communication where you need me to 1) understand something or 2) decide something.
> Precisely how you should do that is the design exercise, and rather than me prescribing your implementation, that is yours to own.
> For instance: don't eliminate all narrative if it serves your goal, just do it in the right way.
> In some sense - I'm asking you to apply the axioms to communication.

---

## Derived, and confirmed

**Limit 1 - understand.**\
The human ends up seeing what the agent sees on the point - nothing missing that matters, nothing extra - reached one confirmed step at a time, with depth available on request and never pushed (`A5`, `A12`, `A8`, `A4`).\
Confirmed by the director.

---

## Added by the director

> I like the concept of "choose your own adventure" - in that you could potentially offer 2 or 3 short descriptions of optional but relevant "follow on / deeper dive" concepts, topics or discussion flows from the current one - such that I could pick quickly and easily rather than describing a full sentence to you.

> If it makes sense to do so for this agent->human communication evals - is to actually develop a process or tooling by which you eval the human, rather than an agent, and use that process to guide your design. Develop an example scenario or a system that can gather feedback from me in a structured way that I can just "execute" and this helps you progress the system further.

---

## Learned in the human evaluation

- **Session 2 result:** the director chose the restructured message over the agent's real message in 4 of 4 pairs - two asking for understanding, two for a decision (`docs/evals/human/runs/moves-2-2026-10-03-6d6f1f`).
- **What the rewrites changed, measured:** about two thirds shorter; no internal IDs or commit hashes, against 43; one question per message, at the end; three follow-on picks each; the point or decision first.
- **What they dropped that matters: traceability.** Keep the body plain, and say once, in a line or a pick, where the thing is recorded.
- **A defect in one rewrite:** a request for the director to act sat inside an optional pick. A request for action is never optional depth.
- **A defect in the agent's picks, named by the director:** *"I can't tell which of the 3 picks you've just offered does that."* Picks must mark which one continues the main work; the rest are side branches.
- **Picks carry a one-word prefix, from the director:** *"each option to be prefixed with a suitable single word"* - giving a *continue exploring this chamber, or exit to the next* feel. Adopted: **Continue** for the main path onward, **Explore** for a side chamber deeper on the current point, **Return** for the map or a parked item.
