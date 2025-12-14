export interface Keyword {
  id: string;
  text: string;
  intensity: number; // 1 to 5+
}

export interface AppState {
  rawInput: string;
  parsedOutput: string;
  keywords: Keyword[];
  discoveredKeywords: string[];
  isThinkingMode: boolean;
  isProcessing: boolean;
  isDiscovering: boolean;
  showExportModal: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro', // For thinking mode
}

export interface GeneratedTask {
  uuid: string;
  title: string;
  status: string;
  order: number;
  feature: string;
  description: string;
  created: string;
}

export interface SavedContext {
  timestamp: number;
  keywords: Keyword[];
  rawInputSnapshot?: string;
  outputSnapshot?: string;
}
