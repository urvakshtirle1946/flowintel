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
import ForecastingPanel from '../components/ForecastingPanel';
import ArduinoChart from '../components/ArduinoChart';
import SensorCapabilities from '../components/SensorCapabilities';

export default function ObservatoryDashboard() {
  const { network, readings, isConnected, isLoading } = useSocket();
  const [selectedAsset, setSelectedAsset] = useState<AssetSelection | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'predict' | 'footprint'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'alerts' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['house_1', 'house_3', 'house_5']));

  const currentReadings = useMemo(() => Object.values(readings || {}), [readings]);
  const physicalNode = currentReadings.find(r => r.house_id === 'house_1'); 
  
  useEffect(() => {
    if (!network?.zones.length) return;
    if (!selectedAsset) {
      setSelectedAsset({ type: 'tank', id: network.zones[0].tank.id });
    }
  }, [network]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  let healthyCount = 0;
  let anomalyCount = 0;
  let totalDemand = 0;
  let totalSensors = activeZone.houses.length;

  allNodes.forEach(node => {
    const r = readings[node.id];
    if (!r) return; 
    totalDemand += (r.flow_rate || 0);
    if (r.status === 'Normal') healthyCount++;
    else anomalyCount++;
  });

  const noDataCount = Math.max(0, totalSensors - Object.keys(readings).length);
  
  const healthyPercent = totalSensors > 0 ? Math.round((healthyCount / totalSensors) * 100) : 0;
  const anomalyPercent = totalSensors > 0 ? Math.round((anomalyCount / totalSensors) * 100) : 0;
  const noDataPercent = Math.max(0, 100 - (healthyPercent + anomalyPercent));

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
        <div className="p-4 md:p-6 max-w-[1600px] w-full flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Header */}
          <header className="flex flex-col gap-5 shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">Flow Intel</h1>
            </div>
            
            {/* Search Row */}
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-10 w-full sm:w-80">
                <div className="flex items-center px-3 gap-2 w-full bg-white">
                  <Search size={16} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search station..." 
                    className="bg-transparent border-none outline-none text-sm w-full" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Master Grid Area */}
          {activeTab === 'live' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6 flex-1 min-h-0 pb-6 overflow-hidden">
            
            {/* Left Column (Map & AI) */}
            <div className="flex flex-col gap-4 h-full min-h-0">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shrink-0">
                  <h3 className="font-semibold text-slate-800 text-sm">Station Map</h3>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
                </div>
                <div className="flex-1 relative bg-slate-100/50">
                  <Map
                    zone={{
                      ...activeZone,
                      houses: activeZone.houses.filter(h => {
                        const reading = readings[h.id];
                        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            h.label.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesFilter = listFilter === 'all' || 
                                            (listFilter === 'alerts' && reading?.status !== 'Normal') ||
                                            (listFilter === 'favorites' && favorites.has(h.id));
                        return matchesSearch && matchesFilter;
                      }),
                      pipelines: activeZone.pipelines.filter(p => p.houseId !== 'house_1')
                    }}
                    readings={readings}
                    selectedAsset={selectedAsset}
                    onSelectAsset={setSelectedAsset}
                  />
                </div>
              </div>

              {/* Real-time Hardware Chart (Smaller height to maximize map) */}
              <div className="h-[180px] shrink-0">
                <ArduinoChart reading={physicalNode} />
              </div>
            </div>

            {/* Right Column (List & Donut) */}
            <div className="flex flex-col gap-4 h-full min-h-0">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <button 
                      onClick={() => setListFilter('all')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${listFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setListFilter('alerts')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${listFilter === 'alerts' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Alerts
                    </button>
                    <button 
                      onClick={() => setListFilter('favorites')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${listFilter === 'favorites' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Favorites
                    </button>
                  </div>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center gap-2">
                    <Activity size={12} className={isConnected ? "text-green-500" : "text-red-500"} /> Live Telemetry Feed
                  </p>
                  
                  {allNodes
                    .filter(node => {
                      const reading = readings[node.id];
                      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          node.label.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesFilter = listFilter === 'all' || 
                                          (listFilter === 'alerts' && reading?.status !== 'Normal') ||
                                          (listFilter === 'favorites' && favorites.has(node.id));
                      return matchesSearch && matchesFilter;
                    })
                    .map(node => {
                    const reading = readings[node.id];
                    const isRealTime = node.id === 'house_1';
                    const isFav = favorites.has(node.id);
                    const statusClass = reading?.status === 'Normal' ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100';
                    
                    return (
                      <div 
                        key={node.id} 
                        onClick={() => setSelectedAsset({ type: 'house', id: node.id })}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedAsset?.id === node.id ? 'border-blue-300 bg-blue-50/20' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="flex gap-3 w-full">
                           <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${isRealTime ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : reading?.status === 'Normal' ? 'bg-slate-300' : 'bg-red-400'}`}>
                             <MapIcon size={14} />
                           </div>
                           <div className="flex flex-col flex-1">
                             <div className="flex items-center justify-between">
                               <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                 {node.name}
                                 {isRealTime && <span className="px-1.5 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 text-[9px] uppercase tracking-wider font-bold">Hardware</span>}
                               </h4>
                               <button 
                                 onClick={(e) => toggleFavorite(e, node.id)} 
                                 className={`p-1 rounded-lg transition-colors ${isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-400'}`}
                               >
                                 ★
                               </button>
                             </div>
                             <p className="text-[11px] text-slate-500">{node.label} • {reading?.pressure ? reading.pressure.toFixed(1) + ' kPa' : '---'}</p>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                           <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${statusClass}`}>
                             {reading?.status || 'Offline'}
                           </span>
                           <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">{reading?.flow_rate?.toFixed(1) || '0.0'} L/m</span>
                        </div>
                      </div>
                    );
                  })}

                  {allNodes.filter(node => {
                      const reading = readings[node.id];
                      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          node.label.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesFilter = listFilter === 'all' || 
                                          (listFilter === 'alerts' && reading?.status !== 'Normal') ||
                                          (listFilter === 'favorites' && favorites.has(node.id));
                      return matchesSearch && matchesFilter;
                  }).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                       <Search size={32} className="text-slate-200" />
                       <div className="flex flex-col gap-1">
                         <p className="text-sm font-bold text-slate-800">No stations found</p>
                         <p className="text-xs text-slate-500 leading-relaxed">Try adjusting your filters or search query to find what you're looking for.</p>
                       </div>
                       <button 
                         onClick={() => { setListFilter('all'); setSearchQuery(''); }}
                         className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                       >
                         Clear all filters
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie Chart Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[180px] shrink-0">
                <div className="flex items-center justify-between p-3 border-b border-slate-100 shrink-0">
                  <h3 className="font-semibold text-slate-800 text-sm">Alert Levels</h3>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
                </div>
                <div className="flex-1 flex flex-row items-center justify-center gap-6 p-4">
                  
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center shrink-0" 
                    style={{ 
                      background: `conic-gradient(
                        #10b981 0% ${healthyPercent}%, 
                        #ef4444 ${healthyPercent}% ${healthyPercent + anomalyPercent}%, 
                        #cbd5e1 ${healthyPercent + anomalyPercent}% 100%
                      )` 
                    }}>
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-slate-800 tracking-tight">{healthyPercent}%</span>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">Safe</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-semibold text-[10px] text-slate-600">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></div>
                        <span><strong className="text-slate-800">{anomalyCount}</strong> Alert</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                        <span><strong className="text-slate-800">{healthyCount}</strong> Normal</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300 shadow-sm"></div>
                        <span><strong className="text-slate-800">{noDataCount}</strong> Offline</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* What the sensor measures chart */}
              <div className="h-[190px] shrink-0 flex">
                <SensorCapabilities />
              </div>

            </div>
          </div>
          )}
          {activeTab === 'predict' && <ForecastingPanel totalDemand={totalDemand} />}
          {activeTab === 'footprint' && <DigitalFootprint />}
        </div>
      </main>
    </div>
  );
}
