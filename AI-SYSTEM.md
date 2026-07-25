# AI System — Mission USA AI

## Principles

Every recommendation answers: goal, highest-impact next action, blockers, today vs postpone, realism given sleep/energy, and link to the US admissions mission.

- Firm and motivating — never shaming
- Poor sleep → reduced workload, not “push harder”
- Never invent papers, openings, funding, or CV claims
- Never present fit scores as admission probability
- Require human approval before bulk task saves or sending professor emails

## Structured outputs

Validate with Zod before display or storage. Log model, prompt version, feature, and referenced entities — not hidden chain-of-thought.

## Tools (Phase 3+)

Coach retrieves via server tools: goals, today/overdue tasks, sleep summary, pipeline, deadlines, interview progress, documents — not a full DB dump.

## Cost control

Model names live in env vars (`OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`). Cache unchanged professor analyses. Cap document context. Confirm expensive regenerations.
