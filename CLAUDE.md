# Agent instructions

## Reporting style (always follow)

Write **every** report, answer, and summary to the user in ASD-STE100 Simplified Technical English. This applies on **every interaction**, not on request. It controls chat output only — never code, comments, or commit messages.

1. **Plain words.** "use" not "utilize", "start" not "initiate", "before" not "prior to".
2. **Active voice. One idea per sentence.** Do not use two clauses when one is enough.
3. **No idioms, no figures of speech, no background the user did not ask for.**
4. **Answer three things:** what you did, if it worked, what the user must do now.
5. **Prefer lists over paragraphs.** Keep technical names and file paths exactly as they are in the code.

## Clean code (always follow)

Like the memory protocol below, this applies on **every interaction**, not on request. Before writing, editing, or reviewing any TypeScript (`src/`, `tests/`, `scripts/`), load and apply the `typescript-clean-code` skill (`.claude/skills/typescript-clean-code/SKILL.md`). Do not skip this because the change looks trivial.

Non-negotiables:

1. **Test first (project rule).** For a change to TypeScript logic, write a failing `bun test` before the implementation: red → green → refactor. Changes to CSS, HTML, `manifest.json`, configs, and the workflow need no test.
2. **Names reveal intent; functions stay small and do one thing.** If a name needs a comment, fix the name.
3. **Comment discipline.** Prefer self-explanatory names and structure over comments. Before you write **any** comment, apply the `clean-comments` skill (`.claude/skills/clean-comments/SKILL.md`).
4. **Boy Scout Rule.** Leave every file you touch cleaner than you found it. Mandatory — see the IMPORTANT section below.

## IMPORTANT: Boy Scout Rule on every touched file (always follow)

**IMPORTANT:** This is a hard requirement, not a preference. A task is not done until every file in the diff is cleaner than before.

1. **Before the final message of every task that changes code**, review the **whole** of each changed file, not only your lines.
2. **Fix in the same task:** `tsc` errors and Biome warnings in those files (Biome checks only `src/`, `tests/`, `scripts/` and the root JSON configs; review other files by hand); duplicated logic; commented-out code; unneeded `?.`, `||` where `??` is meant, redundant checks; unused parameters; aliases that only rename a field.
3. **Do not report these as "pre-existing".** Fix them.
4. **Keep fixes behaviour-preserving.** If a fix would change behaviour (an empty `catch`, a function that does two things with side effects), list it in the report and ask.
5. **Verify** with Biome (`bun run lint`; `bun run lint:fix` applies safe fixes), `bun run typecheck` (checks the whole project), and `bun run test`. Then list the cleanups in the report.

Details: `.claude/skills/boy-scout/SKILL.md`.

## Memory protocol (always follow)

Project memory lives in `.claude/memory/` and follows the `auto-memory` skill (`.claude/skills/auto-memory/SKILL.md`). A `SessionStart` hook asks for the skill at the start of each session.

1. **Recall before substantive tasks.** Read `.claude/memory/INDEX.md`, then only the topic indexes and entries that match the task.
2. **Code wins.** If a memory conflicts with the code, update or delete the memory.
3. **Save** decisions, preferences, and gotchas that the code does not show. Update the entry, its folder `INDEX.md`, and the root `INDEX.md` together.
