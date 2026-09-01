import React, { useMemo } from 'react';
import { DailyLog, Indicator } from '../types';
import { computeWeeklySummary, formatCurrencyBRL } from '../utils/scoreCalculator';
import { SCORE_TIERS } from '../data/defaultIndicators';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  Legend,
} from 'recharts';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';

interface WeeklyAnalysisViewProps {
  logs: DailyLog[];
  indicators: Indicator[];
  onOpenGeminiAnalysis: () => void;
  onSelectDate: (date: string) => void;
}

export const WeeklyAnalysisView: React.FC<WeeklyAnalysisViewProps> = ({
  logs,
  indicators,
  onOpenGeminiAnalysis,
  onSelectDate,
}) => {
  const weeklySummary = useMemo(() => computeWeeklySummary(logs), [logs]);

  // Last 7 days in chronological order for charts
  const chartData = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const recent7 = sorted.slice(-7);
    return recent7.map((log) => {
      const money = Number(log.moneyEarned ?? log.values['ind_money'] ?? 0);
      return {
        date: log.date,
        day: log.dayOfWeek.slice(0, 3), // Seg, Ter, Qua...
        fullDay: log.dayOfWeek,
        score: log.score,
        money: money,
        tier: log.tier,
        observation: log.observation,
      };
    });
  }, [logs]);

  // Category completion rates across the last 7 days
  const categoryStats = useMemo(() => {
    const cats: Record<string, { total: number; completed: number }> = {};

    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const recent7 = sorted.slice(-7);

    for (const ind of indicators) {
      if (!cats[ind.category]) cats[ind.category] = { total: 0, completed: 0 };

      for (const log of recent7) {
        cats[ind.category].total += 1;
        const val = log.values[ind.id];
        if (ind.type === 'boolean' && val === true) {
          cats[ind.category].completed += 1;
        } else if (typeof val === 'number' && val > 0) {
          cats[ind.category].completed += 1;
        }
      }
    }

    return Object.entries(cats).map(([category, data]) => ({
      category,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [logs, indicators]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'; // emerald
    if (score >= 70) return '#14b8a6'; // teal
    if (score >= 55) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    if (score >= 25) return '#f97316'; // orange
    return '#f43f5e'; // rose
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with AI CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <LineChartIcon className="w-4 h-4" />
            <span>Entrelaçamento Semanal de Dados</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Análise de Progresso & Comportamento Ideal
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
            Descubra quais dias você atingiu o mindset de alta performance e quais fatores impulsionaram seus resultados e ganhos de valor.
          </p>
        </div>

        <button
          id="trigger-gemini-analysis-btn"
          onClick={onOpenGeminiAnalysis}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Diagnóstico com Gemini</span>
        </button>
      </div>

      {/* 2. Top Weekly KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Médio Semanal */}
        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Score Médio (7 Dias)
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {weeklySummary.avgScore}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1 font-semibold">
            {weeklySummary.trend === 'improving' ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-4 h-4" /> Tendência Positiva (Subindo)
              </span>
            ) : weeklySummary.trend === 'declining' ? (
              <span className="text-rose-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-4 h-4" /> Em Queda (Ajustar Rotina)
              </span>
            ) : (
              <span className="text-indigo-400 flex items-center gap-0.5">
                ⚡ Consistência Estável
              </span>
            )}
          </div>
        </div>

        {/* Faturamento da Semana */}
        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Financeiro na Semana
          </span>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {formatCurrencyBRL(weeklySummary.totalMoneyEarned)}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-2">
            Puxado pelos indicadores diários
          </span>
        </div>

        {/* Melhor Dia da Semana */}
        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dia Mais Produtivo
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">🏆</span>
            <div>
              <span className="text-lg font-bold text-white block">
                {weeklySummary.bestDay.dayOfWeek || 'N/A'}
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                Score: {weeklySummary.bestDay.score} pts
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            Padrão ideal a ser replicado
          </span>
        </div>

        {/* Consistência de Mindset */}
        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Taxa de Comportamento Ideal
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-400 font-mono tabular-nums">
              {weeklySummary.consistencyPercentage}%
            </span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${weeklySummary.consistencyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Charts: Score Evolution & Financial Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Score Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-[#111114] border border-[#1e293b] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Evolução Diária do Mindset Score</span>
              </h4>
              <p className="text-xs text-slate-400">Pontuação atingida em cada dia da semana (0 - 100)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080809',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} pontos`, 'Mindset Score']}
                  labelFormatter={(lbl) => `Dia: ${lbl}`}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Gains vs Mindset Correlation Line Chart */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111114] border border-[#1e293b] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Ganhos Financeiros (R$)</span>
              </h4>
              <p className="text-xs text-slate-400">Correlação entre disciplina diária e retorno em valor</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080809',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatCurrencyBRL(Number(val)), 'Faturamento']}
                />
                <Line
                  type="monotone"
                  dataKey="money"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Category Execution Breakdown */}
      <div className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl">
        <h4 className="text-base font-bold text-white mb-4">
          Taxa de Cumprimento por Área da Vida (Últimos 7 Dias)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map((item) => (
            <div
              key={item.category}
              className="p-4 rounded-xl bg-[#080809] border border-[#1e293b] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{item.category}</span>
                <span className="text-sm font-extrabold text-indigo-400 font-mono tabular-nums">
                  {item.percentage}%
                </span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Day-by-Day Cards Interlaced Table */}
      <div className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl">
        <h4 className="text-base font-bold text-white mb-4">
          Linha do Tempo da Semana: Comportamento por Dia
        </h4>

        <div className="space-y-3">
          {chartData.map((dayItem) => {
            const tier = SCORE_TIERS[dayItem.tier] || SCORE_TIERS.neutral;
            const isIdeal = dayItem.score >= 70;

            return (
              <div
                key={dayItem.date}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-[#16161b] cursor-pointer ${
                  isIdeal
                    ? 'bg-[#0d0d10] border-emerald-500/30'
                    : 'bg-[#080809] border-[#1e293b]'
                }`}
                onClick={() => onSelectDate(dayItem.date)}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#111114] border border-[#1e293b] flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-400">{dayItem.day}</span>
                    <span className="text-base font-black text-white font-mono">{dayItem.score}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-white">
                        {dayItem.fullDay}, <span className="font-mono text-slate-300">{dayItem.date}</span>
                      </h5>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${tier.bgColor} ${tier.textColor}`}
                      >
                        {tier.label.split('(')[0]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {dayItem.observation || 'Sem observações anotadas.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1e293b]">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Ganho
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                      {formatCurrencyBRL(dayItem.money)}
                    </span>
                  </div>

                  <span className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
                    Abrir Dia
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
