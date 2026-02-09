Create an agent team to research and audit this NestJS analytics platform.

## Scenario

$ARGUMENTS

## Instructions

Based on the scenario above, create an agent team with 3 teammates. Each teammate investigates a different angle of the scenario independently and in parallel.

### Team Structure

1. Analyze the scenario and split it into 3 complementary investigation angles
2. Name each teammate descriptively (e.g., "Query Analyst", "Auth Reviewer")
3. Give each teammate a clear, non-overlapping scope
4. Each teammate should focus on `src/` directory

### Teammate Guidelines

Each teammate must:
- Read relevant source files before making conclusions
- Reference specific file paths and line numbers
- Rank findings by impact (high/medium/low)
- Produce a structured report with: current state, issues found, and recommendations

### Lead Behavior

- Do NOT investigate yourself - delegate everything to teammates
- Wait for ALL teammates to finish before synthesizing
- Produce a unified report that merges and deduplicates findings
- Rank the final recommendations by effort vs impact

### Output Format

The final synthesized report should follow this structure:

```
## Executive Summary
<3-5 bullet points>

## Critical Findings
<High-impact issues that need immediate attention>

## Improvement Opportunities
<Medium-impact optimizations ranked by effort/impact ratio>

## Minor Suggestions
<Low-impact nice-to-haves>

## Per-Teammate Reports
<Individual detailed findings from each teammate>
```
