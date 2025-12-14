import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, FileDown, Edit3, List, FileText, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { parseMarkdownToTasks, generateMarkdownFromTasks } from '../utils/markdownUtils';
import { GeneratedTask } from '../types';

interface OutputSectionProps {
  output: string;
  onRefine: (instruction: string) => void;
  isLoading: boolean;
  onTextSelection: (text: string) => void;
  onUpdateOutput: (newOutput: string) => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({ output, onRefine, isLoading, onTextSelection, onUpdateOutput }) => {
  const [copied, setCopied] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [selectionBox, setSelectionBox] = useState<{top: number, left: number, text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'markdown' | 'interactive'>('markdown');
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  // Parse tasks for interactive view
  const tasks: GeneratedTask[] = useMemo(() => parseMarkdownToTasks(output), [output]);
  
  // Group for interactive view
  const groupedTasks: Record<string, GeneratedTask[]> = useMemo(() => {
    const grouped: Record<string, GeneratedTask[]> = {};
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach(t => {
        const feat = t.feature || 'General';
        if (!grouped[feat]) grouped[feat] = [];
        grouped[feat].push(t);
      });
    }
    return grouped;
  }, [tasks]);

  // Auto-expand all features initially if tasks change significantly
  useEffect(() => {
    if (Object.keys(groupedTasks).length > 0) {
      setExpandedFeatures(prev => {
         // Only reset if empty to avoid closing user actions
         if (Object.keys(prev).length === 0) {
           const next: Record<string, boolean> = {};
           Object.keys(groupedTasks).forEach(k => next[k] = true);
           return next;
         }
         return prev;
      });
    }
  }, [Object.keys(groupedTasks).length]);

  const toggleFeature = (feature: string) => {
    setExpandedFeatures(prev => ({...prev, [feature]: !prev[feature]}));
  };

  const handleTaskStatusChange = (uuid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const updatedTasks = tasks.map(t => 
      t.uuid === uuid ? { ...t, status: newStatus } : t
    );
    const newMarkdown = generateMarkdownFromTasks(updatedTasks);
    onUpdateOutput(newMarkdown);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMd = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goepic-tasks-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMouseUp = () => {
    if (activeTab !== 'markdown') return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectionBox({
        top: rect.top - 40,
        left: rect.left + (rect.width / 2) - 60,
        text: text
      });
    } else {
      setSelectionBox(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
      {/* Header & Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'markdown' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Markdown
            </button>
            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'interactive' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <List className="w-3.5 h-3.5" /> Interactive List
            </button>
          </div>

          <div className="flex gap-2">
             <button
              onClick={handleExportMd}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Download .md"
              disabled={!output}
            >
              <FileDown className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Copy Markdown"
              disabled={!output}
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 min-h-[400px] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brand-400 font-mono animate-pulse">Parsing Tasks & Generating...</p>
          </div>
        ) : (
          <>
            {/* MARKDOWN VIEW */}
            {activeTab === 'markdown' && (
              <textarea
                className="w-full h-full bg-slate-950 p-4 text-slate-300 font-mono text-sm leading-relaxed resize-none focus:outline-none selection:bg-brand-500/30 selection:text-brand-100"
                value={output}
                onChange={(e) => onUpdateOutput(e.target.value)}
                onMouseUp={handleMouseUp}
                placeholder="Parsed Markdown will appear here..."
              />
            )}

            {/* INTERACTIVE VIEW */}
            {activeTab === 'interactive' && (
              <div className="h-full overflow-y-auto bg-slate-950 p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {tasks.length === 0 ? (
                   <div className="text-center text-slate-500 mt-20">
                     <p>No structured tasks found.</p>
                     <p className="text-xs mt-2">Generate content or check Markdown syntax.</p>
                   </div>
                ) : (
                  Object.entries(groupedTasks).map(([feature, featureTasks]) => (
                    <div key={feature} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                      <button 
                        onClick={() => toggleFeature(feature)}
                        className="w-full px-4 py-3 bg-slate-800/50 flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                           <Layers className="w-4 h-4 text-brand-400" />
                           <span className="font-semibold text-slate-200">{feature}</span>
                           <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{featureTasks.length}</span>
                        </div>
                        {expandedFeatures[feature] ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                      </button>
                      
                      {expandedFeatures[feature] && (
                        <div className="divide-y divide-slate-800">
                          {featureTasks.map((task) => (
                            <div key={task.uuid} className="p-4 hover:bg-slate-900/50 transition-colors group">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    {/* SSOT Order Badge */}
                                    <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-mono text-slate-300 font-bold" title="Source Order ID (SSOT)">
                                        #{task.order}
                                      </div>
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                         <h4 className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>
                                           {task.title}
                                         </h4>
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono mb-2" title="Original UUID">
                                        ID: {task.uuid}
                                      </div>
                                      
                                      {/* Task Description (Collapsible Detail inside list) */}
                                      {task.description && (
                                        <details className="text-xs text-slate-400">
                                          <summary className="cursor-pointer hover:text-brand-400 transition-colors inline-block select-none">Show Details</summary>
                                          <div className="mt-2 pl-3 border-l-2 border-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-950/30 p-2 rounded">
                                            {task.description}
                                          </div>
                                        </details>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status Action */}
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => handleTaskStatusChange(task.uuid, task.status)}
                                      className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                                        ${task.status === 'done' 
                                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                                        }
                                      `}
                                    >
                                      {task.status === 'done' ? (
                                        <><Check className="w-3 h-3" /> Done</>
                                      ) : (
                                        <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div> Todo</>
                                      )}
                                    </button>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
        
        {/* Floating Add Context Button (Only in Markdown View) */}
        {selectionBox && !isLoading && activeTab === 'markdown' && (
          <div 
            className="fixed z-50 animate-in fade-in zoom-in duration-200"
            style={{ top: selectionBox.top, left: selectionBox.left }}
          >
             <button
              onClick={() => {
                onTextSelection(selectionBox.text);
                setSelectionBox(null);
                if (window.getSelection) {window.getSelection()?.removeAllRanges();}
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 transform hover:scale-105 transition-transform"
            >
              <span>+</span> Reinforce "{selectionBox.text.slice(0, 10)}..."
            </button>
          </div>
        )}
      </div>

      {/* Refinement Layer (Shared) */}
      <div className="bg-slate-800 p-4 border-t border-slate-700">
        <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
          Third Layer: Refine Suggestions
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && refineInput.trim() && !isLoading) {
                onRefine(refineInput);
                setRefineInput('');
              }
            }}
            placeholder="e.g., 'Make descriptions more technical' or 'Check for duplicate UUIDs'"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button 
            onClick={() => {
                if (refineInput.trim() && !isLoading) {
                    onRefine(refineInput);
                    setRefineInput('');
                }
            }}
            disabled={isLoading || !output}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutputSection;