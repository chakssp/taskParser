import { GoogleGenAI, Type } from "@google/genai";
import { Keyword } from '../types';
import { SYSTEM_INSTRUCTION_BASE, DISCOVERY_PROMPT } from '../constants';

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in process.env");
    return "";
  }
  return key;
};

const buildKeywordContext = (keywords: Keyword[]): string => {
  if (keywords.length === 0) return "";
  
  const intensityMap = keywords.map(k => {
    let weight = "Normal Importance";
    if (k.intensity === 2) weight = "High Importance";
    if (k.intensity === 3) weight = "Very High Importance";
    if (k.intensity >= 4) weight = "CRITICAL / MUST HAVE";
    
    return `- "${k.text}" (${weight})`;
  }).join('\n');

  return `
\n\n*** USER REINFORCED INTENTIONS (SEMANTIC WEIGHTS) ***
The following concepts have been explicitly reinforced by the user. Adjust your parsing and description generation to prioritize these aspects:
${intensityMap}
\n*** END REINFORCED INTENTIONS ***\n
`;
};

export const parseTasks = async (
  rawInput: string, 
  keywords: Keyword[], 
  isThinkingMode: boolean
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key missing.";

  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the prompt
  const keywordContext = buildKeywordContext(keywords);
  const fullPrompt = `
    ${SYSTEM_INSTRUCTION_BASE}
    ${keywordContext}
    
    ---
    RAW INPUT DATA:
    ${rawInput}
    ---
  `;

  // Determine model and config
  const modelName = isThinkingMode ? 'gemini-2.5-pro-preview' : 'gemini-2.5-flash';
  
  const config: any = {
    temperature: isThinkingMode ? 0.7 : 0.2, // Lower temp for strict parsing, higher for thinking
  };

  if (isThinkingMode) {
    // Only 2.5 models support thinking config
    // Using a budget for deep analysis of messy logs
    config.thinkingConfig = { thinkingBudget: 2048 }; 
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: config
    });

    return response.text || "No output generated.";
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return `Error parsing tasks: ${(error as Error).message}`;
  }
};

export const discoverNewKeywords = async (
  combinedContext: string
): Promise<string[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${DISCOVERY_PROMPT}\n\nCONTEXT TO ANALYZE:\n${combinedContext.substring(0, 20000)}`, // Truncate if too huge
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Discovery Error:", error);
    return [];
  }
};

export const refineOutput = async (
  currentOutput: string,
  instruction: string,
  keywords: Keyword[]
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key missing.";

  const ai = new GoogleGenAI({ apiKey });
  const keywordContext = buildKeywordContext(keywords);

  const prompt = `
    You are refining a structured Markdown document.
    
    ${keywordContext}

    CURRENT MARKDOWN:
    ${currentOutput}

    USER REFINEMENT INSTRUCTION:
    ${instruction}

    Please output the UPDATED Markdown document only. Maintain the same structure unless explicitly told to change it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || currentOutput;
  } catch (error) {
    console.error("Refine Error:", error);
    return `Error refining: ${(error as Error).message}`;
  }
}
