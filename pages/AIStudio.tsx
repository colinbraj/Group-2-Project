import React, { useState } from 'react';
import { Asset, GeneratedContent } from '../types';
import { CHANNEL_ICONS } from '../constants';
import { generateRepurposedContent } from '../services/geminiService';
import { ChevronLeft, Wand2, Copy, Calendar, Send, Save, Loader2 } from 'lucide-react';

interface AIStudioProps {
  asset: Asset;
  onBack: () => void;
  onSchedule: () => void;
}

export const AIStudio: React.FC<AIStudioProps> = ({ asset, onBack, onSchedule }) => {
  const [audience, setAudience] = useState('Corporate Executives');
  const [tone, setTone] = useState('Professional & Inspiring');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof GeneratedContent>('linkedin');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const content = await generateRepurposedContent(
        asset.transcript || "Default transcript content would go here if not provided.",
        audience,
        tone
      );
      setGeneratedContent(content);
    } catch (error) {
      console.error("Failed to generate", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs: { id: keyof GeneratedContent; label: string; icon: React.ReactNode }[] = [
    { id: 'linkedin', label: 'LinkedIn', icon: CHANNEL_ICONS.LinkedIn },
    { id: 'twitter', label: 'X Thread', icon: CHANNEL_ICONS.Twitter },
    { id: 'newsletter', label: 'Newsletter', icon: CHANNEL_ICONS.Email },
    { id: 'whatsapp', label: 'WhatsApp', icon: CHANNEL_ICONS.WhatsApp },
  ];

  const handleSaveDraft = () => {
    if (!generatedContent) return;
    // In a real app, this would save to database
    setIsSaved(true);
    alert('✅ Draft saved successfully!\n\nYour content has been saved and can be accessed later.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePublishNow = () => {
    if (!generatedContent) return;
    const currentContent = generatedContent[activeTab];
    alert(`🚀 Publishing to ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}!\n\n"${currentContent.substring(0, 100)}..."\n\nNote: In production, this would post to the actual platform.`);
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    const currentContent = generatedContent[activeTab];
    navigator.clipboard.writeText(currentContent);
    alert('📋 Content copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">AI Repurposing Studio</h2>
            <p className="text-xs text-slate-500">Source: {asset.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={!generatedContent}
            className={`px-3 py-1.5 text-sm font-medium border rounded-lg flex items-center gap-2 disabled:opacity-50 ${isSaved ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}>
            <Save size={14} />
            {isSaved ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            disabled={!generatedContent}
            onClick={onSchedule}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Calendar size={14} />
            Schedule
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Panel: Transcript */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Transcript Source</h3>
          </div>
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {asset.transcript || "No transcript available for this asset. Please select an asset with a transcript."}
            </p>
          </div>
        </div>

        {/* Right Panel: AI Controls & Output */}
        <div className="w-2/3 flex flex-col gap-4">

          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-slate-50"
              >
                <option>Corporate Executives</option>
                <option>Entrepreneurs</option>
                <option>HR Managers</option>
                <option>Sales Teams</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 bg-slate-50"
              >
                <option>Professional & Inspiring</option>
                <option>Provocative & Bold</option>
                <option>Educational & Detailed</option>
                <option>Casual & Friendly</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-all shadow-md"
              style={{ backgroundColor: isGenerating ? '#94a3b8' : '#2563eb', color: '#ffffff' }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
              Generate Variants
            </button>
          </div>

          {/* Editor/Output */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
            {!generatedContent && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Wand2 size={48} className="mb-4 opacity-20" />
                <p>Select settings and click Generate to start</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm animate-pulse">Drafting content for {audience}...</p>
                </div>
              ) : generatedContent ? (
                <textarea
                  className="w-full h-full resize-none outline-none text-slate-800 text-base leading-relaxed"
                  value={generatedContent[activeTab]}
                  onChange={(e) => setGeneratedContent({ ...generatedContent, [activeTab]: e.target.value })}
                />
              ) : null}
            </div>

            {/* Actions Footer */}
            {generatedContent && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={handleCopy} className="text-slate-500 hover:text-slate-700 p-2" title="Copy to clipboard">
                  <Copy size={18} />
                </button>
                <button onClick={handlePublishNow} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Send size={16} />
                  Publish Now
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
