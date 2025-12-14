import React, { useState, useEffect, useCallback } from 'react';
import { Keyword, SavedContext } from './types';
import { DEFAULT_KEYWORDS } from './constants';
import * as GeminiService from './services/geminiService';
import ReinforceSection from './components/ReinforceSection';
import OutputSection from './components/OutputSection';
import { BrainCircuit, Play, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [rawInput, setRawInput] = useState('');
  const [parsedOutput, setParsedOutput] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>(DEFAULT_KEYWORDS);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<string[]>([]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Handlers
  const handleAddKeyword = useCallback((text: string) => {
    setKeywords(prev => {
      const existing = prev.find(k => k.text.toLowerCase() === text.toLowerCase());
      if (existing) {
        // Increase intensity if already exists
        return prev.map(k => k.id === existing.id ? { ...k, intensity: k.intensity + 1 } : k);
      }
      return [...prev, { id: crypto.randomUUID(), text, intensity: 1 }];
    });
    
    // Remove from discovered if added
    setDiscoveredKeywords(prev => prev.filter(k => k !== text));
  }, []);

  const handleRemoveKeyword = useCallback((id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  }, []);

  const handleIntensityChange = useCallback((id: string) => {
    setKeywords(prev => prev.map(k => {
      if (k.id === id) {
        const newIntensity = k.intensity + 1;
        return { ...k, intensity: newIntensity > 5 ? 1 : newIntensity }; 
      }
      return k;
    }));
  }, []);

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data: SavedContext = JSON.parse(content);
        
        // Merge Keywords
        if (data.keywords) {
           setKeywords(prev => {
             const merged = [...prev];
             data.keywords.forEach(newK => {
               const existingIdx = merged.findIndex(mk => mk.text.toLowerCase() === newK.text.toLowerCase());
               if (existingIdx >= 0) {
                 merged[existingIdx].intensity = Math.max(merged[existingIdx].intensity, newK.intensity);
               } else {
                 merged.push({ ...newK, id: crypto.randomUUID() });
               }
             });
             return merged;
           });
        }
        
        if (data.rawInputSnapshot) setRawInput(data.rawInputSnapshot);
        if (data.outputSnapshot) setParsedOutput(data.outputSnapshot);

        // Trigger Discovery
        const combinedText = `
          RAW: ${data.rawInputSnapshot || ''}
          OUTPUT: ${data.outputSnapshot || ''}
          KEYWORDS: ${data.keywords?.map(k => k.text).join(', ') || ''}
        `;
        
        if (combinedText.trim().length > 20) {
            setIsDiscovering(true);
            const discovered = await GeminiService.discoverNewKeywords(combinedText);
            setDiscoveredKeywords(discovered);
            setIsDiscovering(false);
        }

      } catch (err) {
        alert('Failed to parse JSON context file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data: SavedContext = {
      timestamp: Date.now(),
      keywords,
      rawInputSnapshot: rawInput,
      outputSnapshot: parsedOutput
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goepic-context-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    setIsLoading(true);
    const result = await GeminiService.parseTasks(rawInput, keywords, isThinkingMode);
    setParsedOutput(result);
    setIsLoading(false);
  };

  const handleRefine = async (instruction: string) => {
    if (!parsedOutput) return;
    setIsLoading(true);
    const result = await GeminiService.refineOutput(parsedOutput, instruction, keywords);
    setParsedOutput(result);
    setIsLoading(false);
  }

  const handleTextSelectionAdd = (text: string) => {
    handleAddKeyword(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">GoEpic Task Parser</h1>
              <p className="text-xs text-slate-400">AI Context Engineering & Task Extraction</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <span className={`text-xs font-bold ${isThinkingMode ? 'text-purple-400' : 'text-slate-500'}`}>
                Thinking Mode
              </span>
              <button 
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isThinkingMode ? 'bg-purple-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${isThinkingMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top: Reinforce Section */}
        <section>
          <ReinforceSection 
            keywords={keywords}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
            onIntensityChange={handleIntensityChange}
            onImport={handleImport}
            onExport={handleExport}
            discoveredKeywords={discoveredKeywords}
            onAddDiscovered={handleAddKeyword}
            isDiscovering={isDiscovering}
          />
        </section>

        {/* Main Grid: Input and Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
          
          {/* Input Column */}
          <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
             <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                <h2 className="font-semibold text-slate-200">Raw Console Logs</h2>
                <button 
                  onClick={() => setRawInput('')}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                  title="Clear Input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
             </div>
             <textarea 
               value={rawInput}
               onChange={(e) => setRawInput(e.target.value)}
               placeholder="Paste raw console.log() output here..."
               className="flex-1 bg-slate-950 p-4 text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-brand-500/50"
             />
             <div className="p-4 bg-slate-800 border-t border-slate-700">
               <button
                 onClick={handleGenerate}
                 disabled={isLoading || !rawInput.trim()}
                 className={`
                   w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
                   ${isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 shadow-lg shadow-brand-500/20'}
                 `}
               >
                 {isLoading ? (
                   <>Processing...</>
                 ) : (
                   <>
                     <Play className="w-5 h-5 fill-current" /> 
                     Generate Markdown {isThinkingMode && '(Thinking Mode)'}
                   </>
                 )}
               </button>
             </div>
          </div>

          {/* Output Column */}
          <OutputSection 
            output={parsedOutput} 
            onUpdateOutput={setParsedOutput}
            onRefine={handleRefine}
            isLoading={isLoading}
            onTextSelection={handleTextSelectionAdd}
          />
        </div>

      </main>
    </div>
  );
};

export default App;
