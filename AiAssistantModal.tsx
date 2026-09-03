import React, { useState } from 'react';
import { Sparkles, X, Send, Bot } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setResponse(data.answer || 'No response generated.');
    } catch (err) {
      setResponse('Error connecting to Gemini AI Advisor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Gemini AI Travel Advisor</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAsk} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ask AI for itinerary suggestions, destination insights, or pricing advice:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. Suggest a 5-day luxury itinerary in Luxor and Aswan"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-1 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Thinking...' : 'Ask AI'}</span>
              </button>
            </div>
          </div>
        </form>

        {response && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2 max-h-60 overflow-y-auto">
            <div className="flex items-center space-x-2 font-bold text-indigo-700">
              <Bot className="w-4 h-4" />
              <span>AI Recommendation:</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
