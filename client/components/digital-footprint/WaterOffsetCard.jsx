'use client';

import { Droplet, CheckCircle2, Zap } from 'lucide-react';
import OffsetActionList from './OffsetActionList';
import ProgressBar from './ProgressBar';

export default function WaterOffsetCard({ totalWater, plan, checkedMap, onToggle, reminders, onToggleReminder, checkedOffset }) {
  const totalOffset = plan?.totalOffset || 0;
  const balanced = checkedOffset >= totalWater && totalWater > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Digital Usage</p>
          <p className="text-3xl font-semibold text-slate-900 mt-2">
            {totalWater} <span className="text-sm font-medium text-slate-500">Liters Used Today</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
          <Droplet size={20} />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
          <Zap size={14} className="text-amber-500" />
          Offset Plan
        </div>
        <p className="text-sm text-slate-700 mt-2">{plan?.summary || 'Generate an offset plan to see actions.'}</p>
        <div className="mt-4">
          <OffsetActionList
            actions={plan?.actions}
            checkedMap={checkedMap}
            onToggle={onToggle}
            reminders={reminders}
            onToggleReminder={onToggleReminder}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Offset progress</span>
          <span className="font-semibold text-slate-900">{checkedOffset}L / {totalWater}L</span>
        </div>
        <ProgressBar value={checkedOffset} max={totalWater} />
      </div>

      {balanced && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 text-sm font-semibold">
          <CheckCircle2 size={16} />
          Balanced
        </div>
      )}
    </div>
  );
}
