"use client";
import React, { useState } from 'react';
import { Loader2, Droplet, Smartphone, Activity } from 'lucide-react';

export default function DigitalFootprint() {
  const [netflixHours, setNetflixHours] = useState(2);
  const [socialMediaHours, setSocialMediaHours] = useState(3);
  const [aiQueries, setAiQueries] = useState(10);
  const [physicalLiters, setPhysicalLiters] = useState(150);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-footprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ physicalLiters, netflixHours, socialMediaHours, aiQueries })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6 w-full max-w-4xl mx-auto mt-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Smartphone size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Digital Water Footprint Calculator</h2>
          <p className="text-sm text-slate-500">Discover the hidden water consumed by data centers fueling your online activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Video Streaming (Hours/day)</span>
              <span className="text-blue-600">{netflixHours} h</span>
            </label>
            <input type="range" min="0" max="10" value={netflixHours} onChange={(e) => setNetflixHours(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Social Media (Hours/day)</span>
              <span className="text-blue-600">{socialMediaHours} h</span>
            </label>
            <input type="range" min="0" max="10" value={socialMediaHours} onChange={(e) => setSocialMediaHours(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>AI Queries (Prompts/day)</span>
              <span className="text-blue-600">{aiQueries}</span>
            </label>
            <input type="range" min="0" max="100" value={aiQueries} onChange={(e) => setAiQueries(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Physical Water (Liters/day)</span>
              <span className="text-blue-600">{physicalLiters} L</span>
            </label>
            <input type="range" min="50" max="500" value={physicalLiters} onChange={(e) => setPhysicalLiters(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <button onClick={calculate} disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Activity size={18} />}
            Analyze Footprint
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-center items-center text-center">
          {result ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-200">
                <span className="text-3xl font-bold">{result.digital_liters_total}L</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Digital Water Used</h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-left">
                {result.breakdown_text}
              </p>
              <div className="mt-2 bg-green-50 border border-green-200 p-4 rounded-lg text-left shadow-sm">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1 block">AI Conservation Tip</span>
                <p className="text-sm text-green-800">{result.conservation_tip}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Droplet size={48} className="opacity-20" />
              <p className="text-sm max-w-xs">Adjust your digital and physical habits, then click analyze to reveal your true water footprint.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
