import { Keyword } from './types';

export const DEFAULT_KEYWORDS: Keyword[] = [
  { id: 'def-1', text: 'Preserve UUIDs', intensity: 3 },
  { id: 'def-2', text: 'Group by Feature', intensity: 2 },
  { id: 'def-3', text: 'Clean Titles', intensity: 1 },
  { id: 'def-4', text: 'Detailed Descriptions', intensity: 1 },
];

export const SUGGESTED_KEYWORDS = [
  'Validation', 'Security', 'Performance', 'Authentication', 'Schema', 'API', 'Frontend', 'Backend'
];

export const SYSTEM_INSTRUCTION_BASE = `
You are the "GoEpic Task Parser", a specialized AI tool for processing console logs from the GoEpic Web API tasks.
Your goal is to extract structured tasks and output them in a strict Markdown format.

ROLE:
- Parser specialized in structured data from Console Browser.
- Focus on Task Engineering.

INPUT:
- Raw text from console.log containing patterns like "data id [UUID], title [Title]" or JSON-like dumps.
- Blocks labeled "Feature Authentication Tasks Title...".

OUTPUT FORMAT (STRICT):
## 📋 Tasks Extraídas (Total: X)

### Feature: [Name]
**Task ID:** \`[UUID]\`
**Título:** [Clean Title]
**Status:** [todo/done]
**Ordem:** [Number]
**Criado:** [YYYY-MM-DD]
**Descrição:**
[Content]

GUARDRAILS:
1. Do NOT add preamble or conclusion text.
2. Extract ALL visible tasks.
3. Group by Feature.
4. Preserve UUIDs exactly.
5. Do not invent data not present in the input (hallucination check).
`;

export const DISCOVERY_PROMPT = `
Analyze the provided text (Raw Input, Current Output, and User Keywords).
Identify 5-8 new, high-value technical keywords or concepts that appear relevant to the context but are missing from the current "Reinforced Intentions".
Return ONLY a JSON array of strings. Example: ["Authorization", "Rate Limiting", "SQL Optimization"].
`;
