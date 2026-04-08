'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import Map from '../components/Map';
import { AssetSelection } from '../utils/types';
import { 
  Home, Activity, Map as MapIcon, Database, Filter, 
  Search, AlertCircle, CheckCircle, BrainCircuit, Droplet, Loader2, Zap, Settings 
} from 'lucide-react';
import DigitalFootprint from '../components/DigitalFootprint';
import AquaBot from '../components/AquaBot';
import ForecastingPanel from '../components/ForecastingPanel';

export default function ObservatoryDashboard() {
  const { network, readings, isConnected, isLoading } = useSocket();
  const [selectedAsset, setSelectedAsset] = useState<AssetSelection | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'predict' | 'footprint'>('live');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);

  const currentReadings = useMemo(() => Object.values(readings || {}), [readings]);
  const physicalNode = currentReadings.find(r => r.house_id === 'house_1'); 
  
  let totalSensors = currentReadings.length;
  let healthyCount = 0;
  let anomalyCount = 0;
  let totalDemand = 0;

  currentReadings.forEach(r => {
    totalDemand += (r.flow_rate || 0);
    if (r.status === 'Normal') healthyCount++;
    else anomalyCount++;
  });

  const healthyPercent = totalSensors > 0 ? Math.round((healthyCount / totalSensors) * 100) : 100;
  const anomalyPercent = totalSensors > 0 ? Math.round((anomalyCount / totalSensors) * 100) : 0;

  useEffect(() => {
    if (!network?.zones.length) return;
    if (!selectedAsset) {
      setSelectedAsset({ type: 'tank', id: network.zones[0].tank.id });
    }
  }, [network]);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physicalNode,
          totalDemand,
          anomalyCount
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
         setInsights(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !network) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
          <h1 className="text-xl font-bold">Initializing Observatory...</h1>
        </div>
      </div>
    );
  }

  const activeZone = network.zones[0];
  const allNodes = activeZone.houses;

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-8 shadow-sm z-20 shrink-0">
        <div className="w-8 h-8 rounded bg-blue-600 shadow-md"></div>
        <div className="flex flex-col gap-6 text-slate-400">
          <button onClick={() => setActiveTab('live')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'live' ? 'text-blue-600 bg-blue-50' : 'hover:text-slate-600 hover:bg-slate-50'}`}><Home size={20}/></button>
          <button onClick={() => setActiveTab('predict')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'predict' ? 'text-blue-600 bg-blue-50' : 'hover:text-slate-600 hover:bg-slate-50'}`}><Database size={20}/></button>
          <button onClick={() => setActiveTab('footprint')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'footprint' ? 'text-blue-600 bg-blue-50' : 'hover:text-slate-600 hover:bg-slate-50'}`}><Activity size={20}/></button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-6 md:p-8 max-w-[1600px] w-full flex-1 flex flex-col gap-6 overflow-y-auto">
          
          {/* Header */}
          <header className="flex flex-col gap-5 shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">L'observatoire de l'eau (Smart Indore)</h1>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors text-blue-600">
                <Settings size={16} /> Personnaliser l'affichage
              </button>
            </div>
            
            {/* Stat Badges */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div>
                <span className="text-sm text-slate-500"><strong className="text-slate-900">{activeZone.houses.length}</strong> stations disponibles</span>
              </div>
              <div className="flex items-center gap-3 bg-red-50/50 px-4 py-2.5 rounded-xl border border-red-100 shadow-sm">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm text-slate-500 flex flex-col justify-center leading-tight">
                  <strong className="text-red-700">{anomalyCount}</strong> 
                  <span className="text-[10px] uppercase tracking-wider font-bold">Stations en alerte</span>
                </span>
              </div>
              <div className="flex items-center gap-3 bg-amber-50/50 px-4 py-2.5 rounded-xl border border-amber-100 shadow-sm">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-sm text-slate-500 flex flex-col justify-center leading-tight">
                  <strong className="text-amber-700">0</strong> 
                  <span className="text-[10px] uppercase tracking-wider font-bold">Stations en vigilance</span>
                </span>
              </div>
              <div className="flex items-center gap-3 bg-green-50/50 px-4 py-2.5 rounded-xl border border-green-100 shadow-sm">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm text-slate-500 flex flex-col justify-center leading-tight">
                  <strong className="text-green-700">{healthyCount}</strong> 
                  <span className="text-[10px] uppercase tracking-wider font-bold">Stations en état normal</span>
                </span>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm ml-auto">
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Connexion:</span>
                 <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-10">
                <button className="px-4 py-2 text-sm font-medium border-r border-slate-200 hover:bg-slate-50 bg-slate-50/50 flex items-center gap-2 text-slate-700">Filtrer <Filter size={12}/></button>
                <div className="flex items-center px-3 gap-2 w-full sm:w-64 bg-white">
                  <Search size={16} className="text-slate-400" />
                  <input type="text" placeholder="Rechercher..." className="bg-transparent border-none outline-none text-sm w-full" />
                </div>
              </div>
            </div>
          </header>

          {/* Master Grid Area */}
          {activeTab === 'live' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6 flex-1 min-h-[600px] pb-6">
            
            {/* Left Column (Map & AI) */}
            <div className="flex flex-col gap-6 h-full min-h-0">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[60%] min-h-[350px] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shrink-0">
                  <h3 className="font-semibold text-slate-800 text-sm">Carte des stations</h3>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Tout voir</span>
                </div>
                <div className="flex-1 relative bg-slate-100/50">
                  <Map
                    zone={activeZone}
                    readings={readings}
                    selectedAsset={selectedAsset}
                    onSelectAsset={setSelectedAsset}
                  />
                </div>
              </div>

              {/* AI Insights replacing "Dernieres actus" */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    Dernières analyses (OpenAI)
                  </h3>
                  <button 
                    onClick={generateInsights}
                    disabled={isGenerating}
                    className="text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin text-purple-700" /> : <Zap size={12} className="text-purple-600" />}
                    Générer des Insights
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                  {insights.length > 0 ? (
                    insights.map((insight, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 hover:border-blue-300 hover:shadow-md transition-all shadow-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                          {insight.icon === 'BrainCircuit' ? <BrainCircuit size={16} className="text-purple-500" /> : insight.icon === 'AlertTriangle' ? <AlertCircle size={16} className="text-red-500" /> : <Droplet size={16} className="text-blue-500" />}
                          <h4 className="font-bold text-sm leading-snug">{insight.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-400 h-full py-8 gap-3">
                      <BrainCircuit size={32} className="opacity-20 text-slate-600" />
                      <p className="text-sm">Cliquez sur générer pour analyser les flux en temps réel par l'IA.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (List & Donut) */}
            <div className="flex flex-col gap-6 h-full min-h-0">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[60%] min-h-[350px]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer">Stations en alerte</span>
                    <span className="hover:text-slate-800 cursor-pointer px-2">Stations favorites</span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Tout voir</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center gap-2">
                    <Activity size={12} className={isConnected ? "text-green-500" : "text-red-500"} /> Flux de Télémétrie en Direct
                  </p>
                  
                  {allNodes.map(node => {
                    const reading = readings[node.id];
                    const isRealTime = node.id === 'house_1'; // Our designated physical Arduino node
                    const statusClass = reading?.status === 'Normal' ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100';
                    
                    return (
                      <div 
                        key={node.id} 
                        onClick={() => setSelectedAsset({ type: 'house', id: node.id })}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedAsset?.id === node.id ? 'border-blue-300 bg-blue-50/20' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="flex gap-3">
                           <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${isRealTime ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : reading?.status === 'Normal' ? 'bg-slate-300' : 'bg-red-400'}`}>
                             <MapIcon size={14} />
                           </div>
                           <div className="flex flex-col">
                             <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                               {node.name}
                               {isRealTime && <span className="px-1.5 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 text-[9px] uppercase tracking-wider font-bold">Hardware</span>}
                             </h4>
                             <p className="text-[11px] text-slate-500">{node.label} • {reading?.pressure ? reading.pressure.toFixed(1) + ' kPa' : '---'}</p>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                           <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${statusClass}`}>
                             {reading?.status || 'Hors Ligne'}
                           </span>
                           <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">{reading?.flow_rate?.toFixed(1) || '0.0'} L/m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pie Chart Panel (Matches "Niveaux d'alerte") */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[220px]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                  <h3 className="font-semibold text-slate-800 text-sm">Niveaux d'alerte</h3>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Tout voir</span>
                </div>
                <div className="flex-1 flex flex-row items-center justify-center gap-8 p-6">
                  
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(#ef4444 0% ${anomalyPercent}%, #10b981 ${anomalyPercent}% ${anomalyPercent + healthyPercent}%, #f1f5f9 ${anomalyPercent + healthyPercent}% 100%)` }}>
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-slate-800 tracking-tight">{healthyPercent}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Sécurisé</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 font-medium text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm"></div>
                       <span><strong className="text-slate-800">{anomalyCount}</strong> Crise</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm"></div>
                       <span><strong className="text-slate-800">0</strong> Vigilance</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm"></div>
                       <span><strong className="text-slate-800">{healthyCount}</strong> Normale</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-sm bg-slate-200 shadow-sm"></div>
                       <span><strong className="text-slate-800 text-slate-400">0</strong> Pas de données</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
          )}
          {activeTab === 'predict' && <ForecastingPanel totalDemand={totalDemand} />}
          {activeTab === 'footprint' && <DigitalFootprint />}
          
        </div>
      </main>
      <AquaBot context={{ totalDemand, anomalyCount, network, activeZone }} />
    </div>
  );
}
