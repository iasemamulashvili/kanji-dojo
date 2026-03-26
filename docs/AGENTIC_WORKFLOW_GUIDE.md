# Antigravity Manager Workflow Guide

This guide defines the standard operating procedure (SOP) for utilizing the Antigravity Manager securely and efficiently within this Next.js, Telegram Bot, and Supabase ecosystem.

## The Mental Model
The **Project Manager Agent** is your primary interface. Instead of asking one "omniscient" agent to write all the code (which frequently leads to hallucination and context collapse across boundaries), you formulate high-level plans with the Project Manager, which then orchestrates tasks to the specific **Domain Agents**.

All inter-agent communication and state synchronization happens via the Blackboard Pattern in `state.md`.

## Step-by-Step Execution Workflow

### 1. Initiate the Session with the Project Manager
- Open your manager and select the **Project Manager Agent**.
- Prompt example: *"I have a new feature idea: [Describe feature]. Please read `state.md`, review the domain agents in `.agents/skills/`, and draft a step-by-step delegation plan."*
- The PM will evaluate feasibility and update `state.md` with new blockers or assignments across the active roster.

### 2. Spawn Domain-Specific Agents
- Open a new Antigravity Sub-Agent or start a parallel session.
- Point the Agent directly to its specific SKILL folder: `.agents/skills/[NAME]`.
- Prompt example: *"You are the [Agent Name]. Read your SKILL file and execute your Immediate Mission. Once complete, update `state.md` and report back."*

### 3. Agent Execution & State Updates
- The Domain Agent will strictly follow its boundary constraints. For example, the Frontend Agent will never accidentally disrupt your Bot's webhook logic.
- Upon finalizing its localized tests, the Agent logs its changes to `state.md` so the other agents are aware of new definitions (e.g., if the DB Agent creates a new table, it writes the schema definition to the `state.md` Completed Tasks).

### 4. Review and Close out with Project Manager
- Return to your original session with the PM agent.
- Prompt example: *"The [Agent Name] has finished. Please check `state.md` and verify if the global blockers are cleared. Report back to me on what's next in our backlog."*

## Prompting Best Practices
- **Always Point to State**: Begin workflows by prompting agents to *"read `state.md` before taking any action."*
- **Enforce Boundaries**: *"If you realize you need a backend database migration for this UI change, stop. Do not write the SQL yourself. Add a blocker in `state.md` for the Curriculum Agent."*
- **Progressive Disclosure**: Give specific context to specific agents. Do not dump backend error logs into the Frontend Agent's context window. Provide exactly what they need based on their domain.
