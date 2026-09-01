import React from 'react';
import { ScoreTierInfo } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import { Flame, DollarSign, CheckCircle2, ShieldAlert, Layers, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ScoreBannerProps {
  score: number;
  tierInfo: ScoreTierInfo;
  earnedPoints: number;
  positivePoints: number;
  maxPositivePoints: number;
  penaltyPoints: number;
  activeIndicatorsCount: number;
  totalIndicatorsCount: number;
  moneyEarned: number;
  positiveCompletedCount: number;
  totalPositiveCount: number;
  negativeTriggeredCount: number;
  dateStr: string;
  dayOfWeek: string;
  streakCount: number;
  onOpenSpreadsheetLink?: () => void;
}

export const ScoreBanner: React.FC<ScoreBannerProps> = ({
  score,
  tierInfo,
  earnedPoints,
  positivePoints,
  maxPositivePoints,
  penaltyPoints,
  activeIndicatorsCount,
  totalIndicatorsCount,
  moneyEarned,
  positiveCompletedCount,
  totalPositiveCount,
  negativeTriggeredCount,
  dateStr,
  dayOfWeek,
  streakCount,
  onOpenSpreadsheetLink,
}) => {
  return (
    <div className="space-y-4">
      {/* Main Score & Performance Banner (Primeira Parte / Hero) */}
      <div
        id="score-banner-container"
        className="relative overflow-hidden rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-2xl"
      >
        {/* Subtle Ambient Highlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Score Gauge & Tier Identity */}
          <div className="flex items-start sm:items-center gap-5 sm:gap-6">
            {/* High-Impact Numerical Metric */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#080809] border border-[#1e293b] min-w-[120px] sm:min-w-[130px] shadow-inner">
              <span className="text-4xl sm:text-5xl font-black text-indigo-400 tracking-tighter font-mono tabular-nums">
                {score}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#64748b] font-bold mt-1 text-center">
                Score Atual
              </span>
              <div className="w-20 h-1.5 bg-[#1e293b] rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1 font-semibold">
                {score}/100 pts
              </span>
            </div>

            {/* Details & Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748b] font-bold">
                  {dayOfWeek}, {dateStr}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded bg-[#1a1a1e] text-indigo-300 border border-[#2e2e36]">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>Streak: {streakCount} {streakCount === 1 ? 'dia' : 'dias'}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#16161a] text-slate-400 border border-[#2e2e36]">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{activeIndicatorsCount}/{totalIndicatorsCount} Hábitos Ativos</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierInfo.emoji}</span>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {tierInfo.label}
                </h2>
              </div>

              {/* Dynamic Calculation breakdown strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Executados: +{positivePoints} pts (de {maxPositivePoints})</span>
                </span>

                {penaltyPoints > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Desvios: -{penaltyPoints} pts</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
                  <span>Líquido: {earnedPoints} pts</span>
                </span>
              </div>

              <p className="text-xs text-[#94a3b8] max-w-xl leading-relaxed">
                {tierInfo.description}
              </p>
            </div>
          </div>

          {/* Right: Quick Daily Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Financial Value Indicator */}
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#1e293b] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                <span>H05 Ganho</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 truncate block">
                  {formatCurrencyBRL(moneyEarned)}
                </span>
                <span className="text-[9px] text-[#64748b] font-mono">
                  {moneyEarned > 0 ? '+10 pts contabilizados' : '0 lançado'}
                </span>
              </div>
            </div>

            {/* Actions Completed */}
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#1e293b] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                <span>Ações Feitas</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold font-mono text-white">
                  {positiveCompletedCount} <span className="text-xs text-[#64748b]">/ {totalPositiveCount}</span>
                </span>
                <span className="text-[9px] text-indigo-300 font-mono block">
                  {totalPositiveCount > 0
                    ? `${Math.round((positiveCompletedCount / totalPositiveCount) * 100)}% concluído`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Sabotage / Alerts */}
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#1e293b] col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                <span>Desvios</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold font-mono text-white">
                  {negativeTriggeredCount}
                </span>
                <span className="text-[9px] text-[#64748b] font-mono block">
                  {negativeTriggeredCount === 0 ? '✓ Blindado' : `⚠️ -${penaltyPoints} pts`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mindset Tier Threshold Scale Bar */}
        <div className="mt-5 pt-4 border-t border-[#1e293b]">
          <div className="flex items-center justify-between text-[9px] text-[#64748b] uppercase tracking-widest font-mono font-bold mb-2">
            <span>0 Crítico</span>
            <span>40 Oscilação</span>
            <span>70 Consistência</span>
            <span className="text-indigo-400 font-semibold">85+ Mindset Titânio</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
            <div
              className={`rounded-full transition-all ${
                score < 25 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-[#1e293b]'
              }`}
            />
            <div
              className={`rounded-full transition-all ${
                score >= 25 && score < 40 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-[#1e293b]'
              }`}
            />
            <div
              className={`rounded-full transition-all ${
                score >= 40 && score < 55 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-[#1e293b]'
              }`}
            />
            <div
              className={`rounded-full transition-all ${
                score >= 55 && score < 70 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-[#1e293b]'
              }`}
            />
            <div
              className={`rounded-full transition-all ${
                score >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#1e293b]'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

