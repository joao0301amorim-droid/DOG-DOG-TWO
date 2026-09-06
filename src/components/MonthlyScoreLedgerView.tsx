import React, { useState, useEffect, useMemo } from 'react';
import { DailyLog, Indicator, Goal, MonthlyScoreRecord, MonthlyAIAdvice } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import { safeFetchJson } from '../utils/safeApi';
import {
  computeMonthlyScoreRecord,
  generateLocalMonthlyAdvice,
  getMonthFormatted,
} from '../utils/monthHierarchy';
import { loadMonthlyAdvice, saveMonthlyAdvice } from '../utils/storage';
import {
  Award,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Brain,
  ShieldCheck,
  Target,
  ArrowUpRight,
  Flame,
  Zap,
} from 'lucide-react';

interface MonthlyScoreLedgerViewProps {
  logs: DailyLog[];
  goals: Goal[];
  indicators: Indicator[];
  activeMonthKey: string;
  onChangeMonth: (monthKey: string) => void;
  onOpenCompleteModal: (goal: Goal) => void;
  onSelectDate?: (date: string) => void;
}

export const MonthlyScoreLedgerView: React.FC<MonthlyScoreLedgerViewProps> = ({
  logs,
  goals,
  indicators,
  activeMonthKey,
  onChangeMonth,
  onOpenCompleteModal,
  onSelectDate,
}) => {
  const [advice, setAdvice] = useState<MonthlyAIAdvice | null>(() => {
    return loadMonthlyAdvice(activeMonthKey);
  });
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [copiedAdvice, setCopiedAdvice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute month record
  const record: MonthlyScoreRecord = useMemo(() => {
    return computeMonthlyScoreRecord(activeMonthKey, logs, goals, indicators);
  }, [activeMonthKey, logs, goals, indicators]);

  // Available months present in logs or goals
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add('2026-08'); // August
    set.add('2026-09'); // September
    logs.forEach((l) => {
      const ym = l.date.substring(0, 7);
      if (ym) set.add(ym);
    });
    goals.forEach((g) => {
      if (g.monthKey) set.add(g.monthKey);
    });
    return Array.from(set).sort();
  }, [logs, goals]);

  // Load advice when month changes
  useEffect(() => {
    const saved = loadMonthlyAdvice(activeMonthKey);
    if (saved) {
      setAdvice(saved);
    } else {
      // Auto-generate local baseline advice if none saved yet
      const baseline = generateLocalMonthlyAdvice(record);
      setAdvice(baseline);
      saveMonthlyAdvice(activeMonthKey, baseline);
    }
  }, [activeMonthKey]);

  // Stepper navigation
  const handlePrevMonth = () => {
    const [year, month] = activeMonthKey.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth(newMonthKey);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonthKey.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth(newMonthKey);
  };

  // Generate / Refresh AI Advice
  const handleGenerateAdvice = async () => {
    setIsLoadingAdvice(true);
    setErrorMessage(null);

    try {
      const result = await safeFetchJson<{ advice?: any; error?: string }>(
        '/api/ai/monthly-advice',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthRecord: record }),
        }
      );

      if (result.ok && result.data?.advice) {
        setAdvice(result.data.advice);
        saveMonthlyAdvice(activeMonthKey, result.data.advice);
      } else {
        console.warn('[MonthlyScoreLedgerView] IA remota indisponível, acionando motor local:', {
          status: result.status,
          error: result.error,
        });
        const localAdvice = generateLocalMonthlyAdvice(record);
        setAdvice(localAdvice);
        saveMonthlyAdvice(activeMonthKey, localAdvice);
        setErrorMessage('Diagnóstico consolidado com base nas métricas reais da planilha.');
      }
    } catch (err: any) {
      console.warn('Erro ao processar /api/ai/monthly-advice:', err?.message);
      const localAdvice = generateLocalMonthlyAdvice(record);
      setAdvice(localAdvice);
      saveMonthlyAdvice(activeMonthKey, localAdvice);
      setErrorMessage('Diagnóstico gerado pelo motor analítico do ScoreMind.');
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleCopyAdvice = () => {
    if (!advice) return;
    const textToCopy = `=== RELATÓRIO & ACONSELHAMENTO MENSAL - ${record.monthName.toUpperCase()} ===
SCORE TOTAL: +${record.totalPositiveScore} Pontos Positivos
METAS CONCLUÍDAS: ${record.completedGoalsCount}/${record.totalGoalsCount}
TOTAL FATURADO: ${formatCurrencyBRL(record.totalEarned)} | LÍQUIDO: ${formatCurrencyBRL(record.netResult)}

[DIAGNÓSTICO EXECUTIVO]
${advice.executiveSummary}

[INDICADORES POSITIVOS (MOTORES)]
${advice.positiveDrivers.map((d) => `• ${d}`).join('\n')}

[PONTOS DE FRICÇÃO E DESVIOS]
${advice.frictionPoints.map((f) => `• ${f}`).join('\n')}

[ACONSELHAMENTO ESTRATÉGICO DO MENTOR]
${advice.strategicAdvice}

[PRÓXIMOS PASSOS SUGERIDOS PARA O PRÓXIMO MÊS]
${advice.nextSteps.map((s, idx) => `${idx + 1}. ${s.title}: ${s.description}`).join('\n')}

${advice.suggestedPrimaryGoal ? `[META PRINCIPAL SUGERIDA]\n${advice.suggestedPrimaryGoal.name} (Alvo: ${formatCurrencyBRL(advice.suggestedPrimaryGoal.targetValue)}) - ${advice.suggestedPrimaryGoal.rationale}` : ''}
`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedAdvice(true);
      setTimeout(() => setCopiedAdvice(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Month Selector */}
      <div
        id="monthly-score-header"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#111114] border border-[#1e293b] shadow-xl"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white shadow-lg shadow-indigo-950/40">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400">
              <span>REGISTRO DE SCORE TOTAL POR MÊS</span>
              <span>•</span>
              <span className="text-emerald-400">HISTÓRICO CONSOLIDADO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{record.monthName}</span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-xl border border-emerald-500/20">
                +{record.totalPositiveScore} pts
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Entrelaçamento de scores positivos, metas concluídas, faturamento e aconselhamento com IA.
            </p>
          </div>
        </div>

        {/* Month Picker Buttons & Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Month Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#080809] rounded-xl border border-[#2e2e36]">
            {availableMonths.map((mKey) => (
              <button
                key={mKey}
                onClick={() => onChangeMonth(mKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  mKey === activeMonthKey
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1a20]'
                }`}
              >
                {getMonthFormatted(mKey).split(' de ')[0]}
              </button>
            ))}
          </div>

          {/* Stepper */}
          <div className="flex items-center bg-[#080809] rounded-xl border border-[#2e2e36] p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a1e]"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-indigo-300">
              {activeMonthKey}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a1e]"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Score Card: Ex: "Agosto - + 240 Pontos positivos, Metas Concluídas (x), Total Faturado" */}
      <div
        id="monthly-score-hero-card"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121218] via-[#0f1118] to-[#0a1815] border-2 border-indigo-500/40 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 border-b border-[#252530] pb-6">
          {/* Big Score Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/30">
                PONTUAÇÃO TOTAL DO MÊS
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {record.daysLogged} dias avaliados
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300 tabular-nums">
                +{record.totalPositiveScore}
              </span>
              <span className="text-base sm:text-xl font-mono font-bold text-slate-400">
                Pontos Positivos
              </span>
            </div>

            {/* Score Breakdown (Base + Metas) */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <strong className="text-indigo-300">+{record.basePositiveScore} pts</strong> hábitos diários
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <strong className="text-emerald-400">+{record.goalBonusScore} pts</strong> bônus de metas concluídas
              </span>
              <span>•</span>
              <span>
                Média de <strong className="text-white">{record.avgDailyScore} pts/dia</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            {/* Metas Concluídas (x) */}
            <div className="p-3.5 rounded-2xl bg-[#0a0a0e] border border-[#252530] flex flex-col justify-between">
              <span className="text-[10px] uppercase text-slate-500 block">Metas Concluídas</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-300">
                  {record.completedGoalsCount}
                </span>
                <span className="text-xs text-slate-500">/ {record.totalGoalsCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-0.5">
                {record.completedGoalsCount > 0 ? `+${record.goalBonusScore} pts somados` : '0 concluídas'}
              </span>
            </div>

            {/* Total Faturado */}
            <div className="p-3.5 rounded-2xl bg-[#0a0a0e] border border-[#252530] flex flex-col justify-between">
              <span className="text-[10px] uppercase text-slate-500 block">Total Faturado</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                {formatCurrencyBRL(record.totalEarned)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {record.totalSpent > 0 ? `Gastos: ${formatCurrencyBRL(record.totalSpent)}` : 'Sem gastos registrados'}
              </span>
            </div>

            {/* Saldo Líquido */}
            <div className="p-3.5 rounded-2xl bg-[#0a0a0e] border border-[#252530] flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase text-slate-500 block">Resultado Líquido</span>
              <span className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
                record.netResult >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}>
                {formatCurrencyBRL(record.netResult)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Alimenta as metas financeiras
              </span>
            </div>
          </div>
        </div>

        {/* 3. Metas Concluídas (x) - Com Nome, Data de Conclusão e Bônus */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Metas Concluídas ({record.completedGoalsCount})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Registros com data de conclusão e ganho percentual
            </span>
          </div>

          {record.completedGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {record.completedGoals.map((goal) => {
                const bonus = goal.completionBonus ?? (goal.priority === 'PRINCIPAL' ? 50 : 30);
                const percent = goal.percentGainAchieved ?? 100;

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl bg-[#08080c] border border-emerald-500/40 flex flex-col justify-between shadow-md space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              CONCLUÍDA
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {goal.priority}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5">{goal.name}</h4>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        +{bonus} pts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a1a24] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Data de Conclusão:</span>
                        <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {goal.completedAt || 'Final do mês'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Ganho Atingido:</span>
                        <span className="font-bold text-amber-300 mt-0.5 block">
                          {percent}% ({goal.unit === 'R$' ? formatCurrencyBRL(goal.currentValue) : `${goal.currentValue} ${goal.unit}`})
                        </span>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-slate-400 italic bg-[#0f0f15] p-2 rounded-lg border border-[#1e1e28]">
                        "{goal.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => onOpenCompleteModal(goal)}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Editar dados de conclusão
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#08080c] border border-[#20202a] text-center space-y-2">
              <p className="text-xs text-slate-400 font-mono">
                Nenhuma meta marcada como concluída para {record.monthName} ainda.
              </p>
              {record.pendingGoals.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {record.pendingGoals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => onOpenCompleteModal(g)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluir "{g.name}" (+50 pts)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending goals banner if any */}
          {record.pendingGoals.length > 0 && record.completedGoals.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#08080c] border border-[#20202a] text-xs font-mono">
              <span className="text-slate-400">
                Ainda há {record.pendingGoals.length} meta(s) ativa(s) neste mês:
              </span>
              <div className="flex items-center gap-2">
                {record.pendingGoals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onOpenCompleteModal(g)}
                    className="px-2.5 py-1 rounded-lg bg-[#16161f] hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-[#2e2e3a] text-[11px] font-bold transition-all"
                  >
                    Concluir "{g.name}" (+50 pts)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Entrelaçamento dos Dados: Indicadores Positivos vs Indicadores Negativos */}
      <div className="rounded-3xl bg-[#111114] border border-[#1e293b] p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400 block">
                Análise de Causa & Efeito
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Entrelaçamento dos Dados: Indicadores Positivos vs Negativos
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Impacto direto no Faturamento e no Score Mensal
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indicadores Positivos (Motores) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                Indicadores Positivos (Motores de Score & Faturamento)
              </span>
              <span className="text-xs font-mono text-slate-500">
                {record.positiveIndicators.filter((i) => i.frequency > 0).length} ativos no mês
              </span>
            </div>

            <div className="space-y-2">
              {record.positiveIndicators.filter((i) => i.frequency > 0).length > 0 ? (
                record.positiveIndicators
                  .filter((i) => i.frequency > 0)
                  .map((ind) => (
                    <div
                      key={ind.indicatorId}
                      className="p-3.5 rounded-xl bg-[#080809] border border-[#252530] hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                            {ind.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {ind.frequency} dia(s) marcado(s)
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{ind.name}</h4>
                        {ind.moneyTotal && (
                          <span className="text-xs font-mono text-emerald-400 font-bold block">
                            Faturou {formatCurrencyBRL(ind.moneyTotal)}
                          </span>
                        )}
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span className="text-sm font-mono font-black text-emerald-400">
                          +{ind.totalPoints} pts
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          peso: +{ind.weight}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-4 rounded-xl bg-[#080809] border border-[#202028] text-xs font-mono text-slate-400 text-center">
                  Nenhum indicador positivo registrado com frequência neste mês.
                </div>
              )}
            </div>
          </div>

          {/* Indicadores Negativos (Desvios & Vazamentos) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Indicadores Negativos (Desvios & Drenos de Recursos)
              </span>
              <span className="text-xs font-mono text-slate-500">
                {record.negativeIndicators.filter((i) => i.frequency > 0).length} identificados
              </span>
            </div>

            <div className="space-y-2">
              {record.negativeIndicators.filter((i) => i.frequency > 0).length > 0 ? (
                record.negativeIndicators
                  .filter((i) => i.frequency > 0)
                  .map((ind) => (
                    <div
                      key={ind.indicatorId}
                      className="p-3.5 rounded-xl bg-[#080809] border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-bold">
                            {ind.category}
                          </span>
                          <span className="text-[10px] font-mono text-rose-300">
                            {ind.frequency} dia(s) com desvio
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{ind.name}</h4>
                        {ind.moneyTotal && (
                          <span className="text-xs font-mono text-rose-400 font-bold block">
                            Vazamento financeiro: {formatCurrencyBRL(ind.moneyTotal)}
                          </span>
                        )}
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span className="text-sm font-mono font-black text-rose-400">
                          {ind.totalPoints} pts
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          penalidade: -{ind.weight}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-4 rounded-xl bg-[#080809] border border-emerald-500/20 text-xs font-mono text-emerald-300 text-center">
                  ✨ Zero desvios críticos registrados neste mês! Mindset blindado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Aconselhamento com IA para Indicar Próximos Passos (Sugestão) */}
      <div
        id="monthly-ai-advice-section"
        className="rounded-3xl bg-gradient-to-br from-[#121217] via-[#101015] to-[#0d161a] border-2 border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252530] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400">
                  SOLUÇÃO COM IA
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ACONSELHAMENTO & PRÓXIMOS PASSOS
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Diagnóstico Estratégico & Sugestões para o Próximo Mês
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAdvice}
              disabled={!advice}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#16161d] hover:bg-[#20202a] text-slate-300 hover:text-white border border-[#2e2e3a] text-xs font-mono font-bold transition-all disabled:opacity-50"
              title="Copiar relatório completo"
            >
              {copiedAdvice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAdvice ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              id="generate-monthly-advice-btn"
              onClick={handleGenerateAdvice}
              disabled={isLoadingAdvice}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAdvice ? 'animate-spin' : ''}`} />
              <span>{isLoadingAdvice ? 'Analisando...' : 'Gerar com IA'}</span>
            </button>
          </div>
        </div>

        {/* Advice Content */}
        {isLoadingAdvice ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <h4 className="text-base font-bold text-white">O Mentor IA está entrelaçando seus dados...</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Correlacionando pontuação de +{record.totalPositiveScore} pts, {record.completedGoalsCount} metas concluídas, faturamento de {formatCurrencyBRL(record.totalEarned)} e desvios de hábitos.
            </p>
          </div>
        ) : advice ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Executive Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09090c] border border-[#252530] space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">
                1. Visão Geral & Score Consolidado
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {advice.executiveSummary}
              </p>
            </div>

            {/* Strategic Advice */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-[#0c1618] border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>2. Aconselhamento do Mentor de Mindset</span>
              </div>
              <p className="text-sm sm:text-base text-white leading-relaxed font-medium">
                "{advice.strategicAdvice}"
              </p>
            </div>

            {/* Suggested Primary Goal (if any) */}
            {advice.suggestedPrimaryGoal && (
              <div className="p-5 rounded-2xl bg-[#09090d] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 block">
                      3. Sugestão de Meta Principal para o Próximo Mês (🥇)
                    </span>
                    <h4 className="text-lg font-bold text-white mt-0.5">
                      {advice.suggestedPrimaryGoal.name} (Alvo: {formatCurrencyBRL(advice.suggestedPrimaryGoal.targetValue)})
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {advice.suggestedPrimaryGoal.rationale}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 whitespace-nowrap self-start sm:self-center">
                  +50 pts ao concluir
                </span>
              </div>
            )}

            {/* Next Steps List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                  4. Próximos Passos Recomendados (Sugestões Práticas)
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {advice.nextSteps.length} ações estratégicas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {advice.nextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#09090c] border border-[#252530] flex flex-col justify-between space-y-2 hover:border-[#383844] transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                          step.actionType === 'goal'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : step.actionType === 'defense'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {step.actionType === 'goal' ? 'Meta' : step.actionType === 'defense' ? 'Blindagem' : 'Hábito'}
                        </span>
                        <span className="text-xs font-mono text-slate-500">Passo {idx + 1}</span>
                      </div>
                      <h5 className="text-sm font-bold text-white">{step.title}</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer stamp */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-[#1e293b]">
              <span>
                Gerado em: {new Date(advice.generatedAt).toLocaleString('pt-BR')}
              </span>
              <span className="text-indigo-400">
                {advice.modelUsed || 'ScoreMind Intelligence Engine'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs font-mono text-slate-400">
            Clique no botão "Gerar com IA" acima para processar o entrelaçamento dos dados deste mês.
          </div>
        )}
      </div>
    </div>
  );
};
