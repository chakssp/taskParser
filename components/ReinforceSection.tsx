import React, { useState, useRef } from 'react';
import { Keyword } from '../types';
import { Plus, X, Upload, Download, Sparkles, Zap, Search } from 'lucide-react';
import { SUGGESTED_KEYWORDS } from '../constants';

interface ReinforceSectionProps {
  keywords: Keyword[];
  onAddKeyword: (text: string) => void;
  onRemoveKeyword: (id: string) => void;
  onIntensityChange: (id: string) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  discoveredKeywords: string[];
  onAddDiscovered: (text: string) => void;
  isDiscovering: boolean;
}

const ReinforceSection: React.FC<ReinforceSectionProps> = ({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  onIntensityChange,
  onImport,
  onExport,
  discoveredKeywords,
  onAddDiscovered,
  isDiscovering
}) => {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddKeyword(inputValue.trim());
      setInputValue('');
    }
  };

  const getIntensityStyle = (intensity: number) => {
    switch (true) {
      case intensity >= 4:
        return "bg-intensity-4 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] font-bold animate-pulse-fast";
      case intensity === 3:
        return "bg-intensity-3 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] font-semibold";
      case intensity === 2:
        return "bg-intensity-2 border-violet-400 text-white shadow-md";
      default:
        return "bg-intensity-1 border-blue-400 text-white";
    }
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 4) return "CRITICAL";
    if (intensity === 3) return "HIGH";
    if (intensity === 2) return "MED";
    return "";
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-500 opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Reinforce Your Intention
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Add keywords to guide the AI. Click tags to increase their <span className="text-brand-400 font-semibold">Semantic Intensity</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) onImport(e.target.files[0]);
            }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="Import Context & Discover"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button 
            onClick={onExport}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="Export Context"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a keyword and press Enter (e.g., 'Validation')..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
        <button
          onClick={() => {
            if (inputValue.trim()) {
              onAddKeyword(inputValue.trim());
              setInputValue('');
            }
          }}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Active Tags */}
      <div className="flex flex-wrap gap-3 mb-6 min-h-[60px]">
        {keywords.map((k) => (
          <div
            key={k.id}
            onClick={() => onIntensityChange(k.id)}
            className={`
              group relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 border
              ${getIntensityStyle(k.intensity)}
            `}
          >
            <span className="text-sm font-medium">{k.text}</span>
            {k.intensity > 1 && (
              <span className="text-[10px] uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                {getIntensityLabel(k.intensity)}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveKeyword(k.id);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded-full p-0.5 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {keywords.length === 0 && (
          <div className="text-slate-500 italic text-sm py-2">No keywords active. Add some above or import a file.</div>
        )}
      </div>

      {/* Discovered Keywords Section */}
      {(isDiscovering || discoveredKeywords.length > 0) && (
        <div className="mt-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-brand-300 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" />
            AI Discovery {isDiscovering && <span className="animate-pulse text-slate-400 font-normal ml-2">Analyzing context...</span>}
          </h3>
          <div className="flex flex-wrap gap-2">
            {discoveredKeywords.map((text, idx) => (
              <button
                key={idx}
                onClick={() => onAddDiscovered(text)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-brand-300 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Base Tags */}
      {discoveredKeywords.length === 0 && !isDiscovering && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2 font-mono">QUICK ADD:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_KEYWORDS.filter(sk => !keywords.find(k => k.text === sk)).map((sk) => (
              <button
                key={sk}
                onClick={() => onAddKeyword(sk)}
                className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full transition-colors"
              >
                + {sk}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReinforceSection;
