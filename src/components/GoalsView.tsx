import React, { useState, useMemo } from 'react';
import { Goal, DailyLog, Indicator, GoalPriority } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import {
  computeMonthSummary,
  calculateGoalProjection,
  calculateGoalConsistencyScore,
  getMonthFormatted,
} from '../utils/monthHierarchy';
import { GoalModal } from './GoalModal';
import { SwapGoalModal } from './SwapGoalModal';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  Flame,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Settings2,
  RefreshCw,
  Copy,
  AlertTriangle,
  X,
  Sliders,
  Check,
} from 'lucide-react';

interface GoalsViewProps {
  goals: Goal[];
  logs: DailyLog[];
  indicators: Indicator[];
  onSaveGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onSwapPrimaryGoal?: (monthKey: string, newPrimaryGoalId: string) => void;
  onSelectDate: (date: string) => void;
  onOpenIndicatorManager?: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  logs,
  indicators,
  onSaveGoal,
  onDeleteGoal,
  onSwapPrimaryGoal,
  onSelectDate,
  onOpenIndicatorManager,
}) => {
  // Current active month (default to 2026-09 as in prompt)
  const [activeMonthKey, setActiveMonthKey] = useState<string>('2026-09');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [showManagerSection, setShowManagerSection] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<{ id: string; name: string; isPrimary: boolean } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = activeMonthKey.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonthKey(newMonthKey);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonthKey.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonthKey(newMonthKey);
  };

  // Month summary & aggregates
  const monthSummary = useMemo(() => {
    return computeMonthSummary(activeMonthKey, logs);
  }, [activeMonthKey, logs]);

  // Filter goals for this month
  const monthGoals = useMemo(() => {
    return goals.filter((g) => g.monthKey === activeMonthKey);
  }, [goals, activeMonthKey]);

  // Separate 1 Meta Principal & Metas Secundárias
  const primaryGoal = useMemo(() => {
    return (
      monthGoals.find((g) => g.priority === 'PRINCIPAL') ||
      monthGoals[0] ||
      null
    );
  }, [monthGoals]);

  const secondaryGoals = useMemo(() => {
    return monthGoals.filter((g) => g.id !== primaryGoal?.id);
  }, [monthGoals, primaryGoal]);

  // Format currency or units
  const formatGoalValue = (val: number, unit: string) => {
    if (unit === 'R$') {
      return formatCurrencyBRL(val);
    }
    return `${val} ${unit}`;
  };

  // Status badge styling
  const getPaceBadge = (status: 'above' | 'on_track' | 'behind') => {
    switch (status) {
      case 'above':
        return {
          label: '🟢 Acima do ritmo',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'on_track':
        return {
          label: '🟡 No ritmo',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'behind':
        return {
          label: '🔴 Abaixo do ritmo',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
    }
  };

  // Render Visual ASCII-like Bar (e.g. ████████░░ 80%)
  const renderVisualBlocks = (percentage: number, totalBlocks = 10) => {
    const safePercent = Math.max(0, Math.min(100, percentage));
    const filledCount = Math.round((safePercent / 100) * totalBlocks);
    const emptyCount = totalBlocks - filledCount;
    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(emptyCount);
    return `${filled}${empty} ${safePercent}%`;
  };

  const showTemporaryNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  // Goal actions
  const handleToggleGoalStatus = (goal: Goal) => {
    const nextStatus = goal.status === 'active' ? 'paused' : 'active';
    onSaveGoal({ ...goal, status: nextStatus, updatedAt: new Date().toISOString() });
    showTemporaryNotice(`Status da meta "${goal.name}" alterado para ${nextStatus === 'active' ? 'Ativa' : 'Pausada'}.`);
  };

  const handleMarkComplete = (goal: Goal) => {
    const nextStatus = goal.status === 'completed' ? 'active' : 'completed';
    onSaveGoal({ ...goal, status: nextStatus, updatedAt: new Date().toISOString() });
    showTemporaryNotice(
      nextStatus === 'completed'
        ? `Parabéns! Meta "${goal.name}" marcada como CONCLUÍDA! 🏆`
        : `Meta "${goal.name}" reaberta como ativa.`
    );
  };

  // Switch / Swap Primary Goal
  const handleSwapToPrimary = (targetGoalId: string) => {
    if (onSwapPrimaryGoal) {
      onSwapPrimaryGoal(activeMonthKey, targetGoalId);
    } else {
      // Direct state update via onSaveGoal
      const target = monthGoals.find((g) => g.id === targetGoalId);
      if (!target) return;

      // Demote current primary if exists
      if (primaryGoal && primaryGoal.id !== targetGoalId) {
        onSaveGoal({ ...primaryGoal, priority: 'ALTA', updatedAt: new Date().toISOString() });
      }
      // Promote target
      onSaveGoal({ ...target, priority: 'PRINCIPAL', updatedAt: new Date().toISOString() });
    }
    const targetName = monthGoals.find((g) => g.id === targetGoalId)?.name || 'Nova Meta';
    showTemporaryNotice(`"${targetName}" agora é a Meta Principal (🥇) do mês!`);
  };

  const handleChangePriority = (goal: Goal, newPriority: GoalPriority) => {
    if (newPriority === 'PRINCIPAL') {
      handleSwapToPrimary(goal.id);
    } else {
      onSaveGoal({ ...goal, priority: newPriority, updatedAt: new Date().toISOString() });
      showTemporaryNotice(`Prioridade de "${goal.name}" alterada para ${newPriority}.`);
    }
  };

  // Inline value adjustment for manual goals (+R$ 50, +R$ 100, -R$ 50)
  const handleAdjustGoalValue = (goal: Goal, delta: number) => {
    const nextVal = Math.max(0, goal.currentValue + delta);
    onSaveGoal({ ...goal, currentValue: nextVal, updatedAt: new Date().toISOString() });
    showTemporaryNotice(`Progresso de "${goal.name}": ${formatGoalValue(nextVal, goal.unit)}`);
  };

  // Duplicate / Rollover goal to next month
  const handleDuplicateToNextMonth = (goal: Goal) => {
    const [year, month] = activeMonthKey.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      monthKey: nextMonthKey,
      currentValue: 0, // Reset progress for the new month
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(newGoal);
    showTemporaryNotice(`Meta "${goal.name}" duplicada com sucesso para ${getMonthFormatted(nextMonthKey)}!`);
  };

  // Delete Goal with confirmation
  const handleConfirmDelete = () => {
    if (!confirmDeleteGoal) return;
    const { id, name, isPrimary } = confirmDeleteGoal;

    onDeleteGoal(id);
    setConfirmDeleteGoal(null);

    // If primary was deleted and secondary exists, promote the first secondary
    if (isPrimary && secondaryGoals.length > 0) {
      const nextPrimary = secondaryGoals[0];
      handleSwapToPrimary(nextPrimary.id);
      showTemporaryNotice(`Meta "${name}" excluída. "${nextPrimary.name}" foi promovida a Meta Principal.`);
    } else {
      showTemporaryNotice(`Meta "${name}" removida com sucesso.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs font-mono font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Month Header & Navigation */}
      <div
        id="goals-month-header"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#111114] border border-[#1e293b] shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400">
              <span>SISTEMA DE METAS MENSAIS</span>
              <span>•</span>
              <span className="text-emerald-400">GESTÃO INTEGRADA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{monthSummary.monthName}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Meta Principal (🥇), Metas Secundárias (🥈, 🥉), ritmo diário e score de consistência da meta.
            </p>
          </div>
        </div>

        {/* Month Selector Controls & CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-[#080809] rounded-xl border border-[#2e2e36] p-1">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a1e] transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-bold text-indigo-300 whitespace-nowrap">
              {activeMonthKey}
            </span>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a1e] transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Gerenciador de Metas Toggle */}
          <button
            id="toggle-goals-manager-btn"
            onClick={() => setShowManagerSection(!showManagerSection)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              showManagerSection
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                : 'bg-[#1a1a20] hover:bg-[#25252d] text-slate-300 border-[#2e2e36]'
            }`}
            title="Abrir painel completo de gerenciamento de metas"
          >
            <Settings2 className="w-4 h-4 text-indigo-300" />
            <span>Gerenciador ({monthGoals.length})</span>
          </button>

          {/* Trocar Meta (Se houver metas) */}
          {monthGoals.length > 1 && (
            <button
              id="quick-swap-primary-btn"
              onClick={() => setIsSwapModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs font-mono uppercase tracking-wider transition-all"
              title="Trocar qual meta é a Principal deste mês"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Trocar Meta</span>
            </button>
          )}

          {/* Nova Meta */}
          <button
            id="add-new-goal-btn"
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-950/50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* 2. Resumo Financeiro & Ritmo do Mês (Entrelaçamento dos Dados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 💰 Ganhos */}
        <div
          id="financial-earned-card"
          className="p-5 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#64748b]">
              💰 Ganhos do Mês
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Quanto Entrou
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {formatCurrencyBRL(monthSummary.totalEarned)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Soma das entradas diárias (H05)
            </p>
          </div>
        </div>

        {/* 📉 Gastos */}
        <div
          id="financial-spent-card"
          className="p-5 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#64748b]">
              📉 Gastos do Mês
            </span>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Quanto Saiu
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
              {formatCurrencyBRL(monthSummary.totalSpent)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Gastos acumulados (H02 "Comprou... haha")
            </p>
          </div>
        </div>

        {/* 💵 Resultado Líquido */}
        <div
          id="financial-net-card"
          className="p-5 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#64748b]">
              💵 Resultado Líquido
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                monthSummary.netResult >= 0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}
            >
              Ganhos - Gastos
            </span>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                monthSummary.netResult >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}
            >
              {formatCurrencyBRL(monthSummary.netResult)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Alimenta automaticamente as metas financeiras
            </p>
          </div>
        </div>

        {/* 📅 Progresso Temporal do Mês */}
        <div
          id="month-time-progress-card"
          className="p-5 rounded-2xl bg-[#111114] border border-[#1e293b] flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#64748b]">
              📅 Calendário do Mês
            </span>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Dia {monthSummary.currentDay} de {monthSummary.daysInMonth}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
                {Math.round((monthSummary.currentDay / monthSummary.daysInMonth) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {monthSummary.daysInMonth} dias</span>
            </div>
            <div className="w-full bg-[#1e293b] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((monthSummary.currentDay / monthSummary.daysInMonth) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GERENCIADOR DE METAS (PAINEL EXPANSÍVEL / DEDICADO) */}
      {showManagerSection && (
        <div
          id="goals-management-panel"
          className="rounded-3xl bg-[#111114] border-2 border-indigo-500/40 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400 block">
                  Central de Controle
                </span>
                <h3 className="text-lg font-black text-white">
                  Gerenciador de Metas ({monthGoals.length} cadastradas em {monthSummary.monthName})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Meta</span>
              </button>

              <button
                onClick={() => setShowManagerSection(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a20]"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {monthGoals.length === 0 ? (
            <div className="p-8 text-center bg-[#080809] rounded-2xl border border-[#252530] text-slate-400 text-xs font-mono">
              Nenhuma meta cadastrada para este mês ainda. Clique em "Adicionar Meta" para criar a primeira!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {monthGoals.map((goal) => {
                const isPrimary = goal.id === primaryGoal?.id;
                const percent = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

                return (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPrimary
                        ? 'bg-[#15151c] border-amber-500/50 shadow-md shadow-amber-950/20'
                        : 'bg-[#080809] border-[#252530] hover:border-[#3e3e4a]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isPrimary
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-[#1a1a20] text-slate-400 border-[#2e2e36]'
                            }`}
                          >
                            {isPrimary ? '🥇 PRINCIPAL' : goal.priority}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {goal.type === 'financial' ? 'Financeira 💰' : goal.type}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                              goal.status === 'active'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : goal.status === 'completed'
                                ? 'text-indigo-400 bg-indigo-500/10'
                                : 'text-slate-400 bg-slate-800'
                            }`}
                          >
                            {goal.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{goal.name}</span>
                          {goal.autoSyncFinancial && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                              Auto-Líquido
                            </span>
                          )}
                        </h4>
                        {goal.notes && (
                          <p className="text-xs text-slate-400 italic">"{goal.notes}"</p>
                        )}
                      </div>

                      {/* Middle: Progress & Values */}
                      <div className="flex-1 max-w-sm space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">
                            Atual: <strong className="text-white">{formatGoalValue(goal.currentValue, goal.unit)}</strong>
                          </span>
                          <span className="text-slate-400">
                            Alvo: <strong className="text-white">{formatGoalValue(goal.targetValue, goal.unit)}</strong>
                          </span>
                          <span className="text-emerald-400 font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-[#16161b] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPrimary ? 'bg-amber-400' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {/* Inline quick adjustments if manual */}
                        {!goal.autoSyncFinancial && (
                          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono">
                            <span className="text-slate-500 text-[10px]">Ajuste rápido:</span>
                            <button
                              onClick={() => handleAdjustGoalValue(goal, -50)}
                              className="px-2 py-0.5 rounded bg-[#16161a] hover:bg-[#222228] text-slate-300 border border-[#2e2e36]"
                              title="Reduzir R$ 50"
                            >
                              -50
                            </button>
                            <button
                              onClick={() => handleAdjustGoalValue(goal, +50)}
                              className="px-2 py-0.5 rounded bg-[#16161a] hover:bg-[#222228] text-emerald-400 border border-[#2e2e36]"
                              title="Adicionar R$ 50"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => handleAdjustGoalValue(goal, +100)}
                              className="px-2 py-0.5 rounded bg-[#16161a] hover:bg-[#222228] text-emerald-400 border border-[#2e2e36]"
                              title="Adicionar R$ 100"
                            >
                              +100
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0">
                        {/* Make primary button if not already */}
                        {!isPrimary && (
                          <button
                            onClick={() => handleSwapToPrimary(goal.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs font-mono uppercase tracking-wider border border-amber-500/30 transition-all"
                            title="Tornar esta a Meta Principal"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Tornar Principal</span>
                          </button>
                        )}

                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleGoalStatus(goal)}
                          className="p-2 rounded-xl bg-[#16161a] hover:bg-[#222228] text-slate-300 border border-[#2e2e36] transition-colors"
                          title={goal.status === 'active' ? 'Pausar Meta' : 'Ativar Meta'}
                        >
                          {goal.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Mark complete */}
                        <button
                          onClick={() => handleMarkComplete(goal)}
                          className={`p-2 rounded-xl border transition-colors ${
                            goal.status === 'completed'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-[#16161a] hover:bg-[#222228] text-slate-300 border-[#2e2e36]'
                          }`}
                          title="Marcar como Concluída"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate to next month */}
                        <button
                          onClick={() => handleDuplicateToNextMonth(goal)}
                          className="p-2 rounded-xl bg-[#16161a] hover:bg-[#222228] text-slate-300 border border-[#2e2e36] transition-colors"
                          title="Duplicar para o próximo mês"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-[#16161a] hover:bg-[#222228] text-slate-300 border border-[#2e2e36] transition-colors"
                          title="Editar Meta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() =>
                            setConfirmDeleteGoal({
                              id: goal.id,
                              name: goal.name,
                              isPrimary,
                            })
                          }
                          className="p-2 rounded-xl bg-[#16161a] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2e2e36] hover:border-rose-500/40 transition-colors"
                          title="Excluir Meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. 🥇 META PRINCIPAL (Cartão de Destaque com Projeção e Score da Meta) */}
      {primaryGoal ? (
        (() => {
          const effectiveCurrent =
            primaryGoal.autoSyncFinancial && primaryGoal.type === 'financial'
              ? Math.max(0, monthSummary.netResult)
              : primaryGoal.currentValue;

          const updatedGoal = { ...primaryGoal, currentValue: effectiveCurrent };
          const projection = calculateGoalProjection(
            updatedGoal,
            monthSummary.currentDay,
            monthSummary.daysInMonth
          );
          const consistency = calculateGoalConsistencyScore(
            updatedGoal,
            projection,
            monthSummary.logs
          );
          const paceInfo = getPaceBadge(projection.paceStatus);

          return (
            <div
              id="primary-goal-card"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121217] via-[#111115] to-[#0c1816] border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-amber-950/10"
            >
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252530] pb-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🥇</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        META PRINCIPAL DO MÊS
                      </span>
                      <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                        Tipo: {primaryGoal.type === 'financial' ? 'Financeira 💰' : primaryGoal.type}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {primaryGoal.name}
                    </h3>
                  </div>
                </div>

                {/* Status & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${paceInfo.color}`}>
                    {paceInfo.label}
                  </span>

                  {/* Trocar Meta Principal */}
                  {monthGoals.length > 1 && (
                    <button
                      id="swap-primary-goal-btn"
                      onClick={() => setIsSwapModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all"
                      title="Trocar qual é a Meta Principal deste mês"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Trocar Meta</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleGoalStatus(primaryGoal)}
                    className="p-2 rounded-xl bg-[#1a1a1e] hover:bg-[#25252d] text-slate-300 border border-[#2e2e36] transition-colors"
                    title={primaryGoal.status === 'active' ? 'Pausar Meta' : 'Ativar Meta'}
                  >
                    {primaryGoal.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleMarkComplete(primaryGoal)}
                    className={`p-2 rounded-xl border transition-colors ${
                      primaryGoal.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#1a1a1e] hover:bg-[#25252d] text-slate-300 border-[#2e2e36]'
                    }`}
                    title="Marcar como Concluída"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingGoal(primaryGoal);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-[#1a1a1e] hover:bg-[#25252d] text-slate-300 border border-[#2e2e36] transition-colors"
                    title="Editar Meta"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setConfirmDeleteGoal({
                        id: primaryGoal.id,
                        name: primaryGoal.name,
                        isPrimary: true,
                      })
                    }
                    className="p-2 rounded-xl bg-[#1a1a1e] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2e2e36] hover:border-rose-500/40 transition-colors"
                    title="Excluir Meta Principal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle Section: Values, Visual Blocks & Pace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
                {/* Visual Progress Bar (████████░░ 80%) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                      Progresso Realizado
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      Faltam: {formatGoalValue(projection.remainingAmount, primaryGoal.unit)}
                    </span>
                  </div>

                  {/* Visual Bar representation */}
                  <div className="p-4 rounded-2xl bg-[#080809] border border-[#252530]">
                    <div className="flex items-center justify-between text-base sm:text-lg font-mono font-extrabold text-amber-300 tracking-wider">
                      <span>{renderVisualBlocks(projection.progressPercentage, 10)}</span>
                    </div>
                    <div className="w-full bg-[#16161b] h-3 rounded-full mt-3 overflow-hidden p-0.5 border border-[#2e2e36]">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${projection.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                    <span>Atual: <strong className="text-white">{formatGoalValue(effectiveCurrent, primaryGoal.unit)}</strong></span>
                    <span>Alvo: <strong className="text-white">{formatGoalValue(primaryGoal.targetValue, primaryGoal.unit)}</strong></span>
                  </div>
                </div>

                {/* Projection & Cadence (O Sistema de Projeção) */}
                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0d0d11] border border-[#252530]">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Ritmo Ideal</span>
                    <span className="text-base font-extrabold font-mono text-indigo-300 mt-1 block">
                      {formatGoalValue(Math.round(projection.idealRatePerDay), primaryGoal.unit)}
                    </span>
                    <span className="text-[10px] text-slate-500">por dia ({monthSummary.daysInMonth} dias)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0d11] border border-[#252530]">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Ritmo Atual</span>
                    <span className={`text-base font-extrabold font-mono mt-1 block ${
                      projection.paceStatus === 'above' ? 'text-emerald-400' : projection.paceStatus === 'on_track' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {formatGoalValue(Math.round(projection.currentRatePerDay), primaryGoal.unit)}
                    </span>
                    <span className="text-[10px] text-slate-500">por dia até o momento</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0d11] border border-[#252530] col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Esperado Hoje</span>
                    <span className="text-base font-extrabold font-mono text-slate-200 mt-1 block">
                      {formatGoalValue(Math.round(projection.expectedAmountToDate), primaryGoal.unit)}
                    </span>
                    <span className="text-[10px] text-slate-500">marcador dia {monthSummary.currentDay}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: 🎯 SCORE DE CONSISTÊNCIA DA META */}
              <div className="mt-6 pt-6 border-t border-[#252530] bg-[#09090c]/80 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                      Score de Consistência da Meta
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Resultado:</span>
                    <span className={`text-xs font-mono font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      consistency.statusColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : consistency.statusColor === 'teal'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : consistency.statusColor === 'amber'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {consistency.statusLabel} ({consistency.totalConsistencyScore} pts)
                    </span>
                  </div>
                </div>

                {/* 4 Consistency Dimensions (As 4 barras conceituais solicitadas) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#111115] border border-[#252530]">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">PROGRESSO</span>
                      <span className="text-emerald-400 font-bold">{consistency.progressScore}%</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 tracking-wider">
                      {renderVisualBlocks(consistency.progressScore, 10)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111115] border border-[#252530]">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">RITMO</span>
                      <span className="text-indigo-400 font-bold">{consistency.paceScore}%</span>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-400 tracking-wider">
                      {renderVisualBlocks(consistency.paceScore, 10)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111115] border border-[#252530]">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">CONSISTÊNCIA</span>
                      <span className="text-teal-400 font-bold">{consistency.consistencyScore}%</span>
                    </div>
                    <div className="text-[11px] font-mono text-teal-400 tracking-wider">
                      {renderVisualBlocks(consistency.consistencyScore, 10)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111115] border border-[#252530]">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">COMPORTAMENTO</span>
                      <span className="text-amber-400 font-bold">{consistency.behaviorScore}%</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 tracking-wider">
                      {renderVisualBlocks(consistency.behaviorScore, 10)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* Empty State for Primary Goal */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111114] border border-[#1e293b] border-dashed text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Nenhuma Meta Principal cadastrada para {monthSummary.monthName}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Defina seu objetivo número 1 (ex.: Guardar R$ 850) para começar a acompanhar o ritmo ideal por dia e o score de sustentabilidade.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingGoal(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950 transition-all active:scale-95"
            >
              Cadastrar Meta Principal
            </button>
          </div>
        </div>
      )}

      {/* 4. Metas Secundárias (🥈 META SECUNDÁRIA, 🥉 META SECUNDÁRIA) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#64748b]">
              Objetivos de Suporte
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <span>Metas Secundárias do Mês</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({secondaryGoals.length}/2 recomendadas)
              </span>
            </h3>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Secundária
          </button>
        </div>

        {secondaryGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryGoals.map((goal, idx) => {
              const medal = idx === 0 ? '🥈' : '🥉';
              const percent = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

              return (
                <div
                  key={goal.id}
                  id={`secondary-goal-card-${goal.id}`}
                  className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 flex flex-col justify-between hover:border-[#2e2e36] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{medal}</span>
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            META SECUNDÁRIA • {goal.priority}
                          </span>
                          <h4 className="text-base font-bold text-white">{goal.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSwapToPrimary(goal.id)}
                          className="text-[10px] font-mono text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1 transition-colors"
                          title="Tornar esta a Meta Principal"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Tornar Principal</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDeleteGoal({
                              id: goal.id,
                              name: goal.name,
                              isPrimary: false,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Progress Block */}
                    <div className="mt-4 p-3 rounded-xl bg-[#080809] border border-[#252530]">
                      <div className="font-mono text-sm font-bold text-slate-200">
                        {renderVisualBlocks(percent, 10)}
                      </div>
                      <div className="w-full bg-[#16161b] h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-2">
                      <span>Atual: <strong className="text-white">{formatGoalValue(goal.currentValue, goal.unit)}</strong></span>
                      <span>Meta: <strong className="text-white">{formatGoalValue(goal.targetValue, goal.unit)}</strong></span>
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        "{goal.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">
                      Status: <strong className="text-slate-300 uppercase">{goal.status}</strong>
                    </span>
                    <button
                      onClick={() => handleMarkComplete(goal)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                        goal.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#16161a] text-slate-300 border-[#2e2e36] hover:text-white'
                      }`}
                    >
                      {goal.status === 'completed' ? 'Concluída ✓' : 'Concluir'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#111114] border border-[#1e293b] text-center">
            <p className="text-xs text-slate-400">
              Nenhuma meta secundária definida ainda. Você pode adicionar até 2 (ex: "Realizar tatuagem", "Comprar roupas").
            </p>
          </div>
        )}
      </div>

      {/* 5. Hierarquia Semanal do Mês (Mês = Período Principal) */}
      <div className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-slate-400">
                Hierarquia Temporal
              </span>
              <h3 className="text-base font-bold text-white">
                Camadas Semanais de {monthSummary.monthName}
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
            Mês ➔ Semanas ➔ Dias ➔ Indicadores
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {monthSummary.weeks.map((week) => (
            <div
              key={week.weekNumber}
              className="p-4 rounded-xl bg-[#080809] border border-[#1e293b] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-400">
                  <span>{week.label}</span>
                  <span className="text-slate-500">{week.daysCount} dias</span>
                </div>

                <div className="mt-3 space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Score Médio:</span>
                    <span className="text-white font-bold">{week.avgScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ganhos:</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrencyBRL(week.totalEarned)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gastos:</span>
                    <span className="text-rose-400 font-semibold">{formatCurrencyBRL(week.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#1e293b]">
                    <span className="text-slate-400">Líquido:</span>
                    <span className="text-emerald-300 font-bold">{formatCurrencyBRL(week.netResult)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1a1a22] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">
                  {week.logs.length} dias registrados
                </span>
                {week.logs.length > 0 && (
                  <button
                    onClick={() => onSelectDate(week.logs[week.logs.length - 1].date)}
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Ver dia
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Criar / Editar Meta */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSaveGoal={(savedGoal) => {
          onSaveGoal(savedGoal);
          setIsModalOpen(false);
          setEditingGoal(null);
          showTemporaryNotice(`Meta "${savedGoal.name}" salva com sucesso!`);
        }}
        goalToEdit={editingGoal}
        activeMonthKey={activeMonthKey}
        activeMonthName={monthSummary.monthName}
        currentNetResult={monthSummary.netResult}
      />

      {/* MODAL: Trocar Meta Principal */}
      <SwapGoalModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        currentPrimaryGoal={primaryGoal}
        availableGoals={monthGoals}
        onSwapToPrimary={handleSwapToPrimary}
        onOpenCreateNew={() => {
          setEditingGoal(null);
          setIsModalOpen(true);
        }}
        monthName={monthSummary.monthName}
      />

      {/* MODAL: Confirmação de Exclusão de Meta */}
      {confirmDeleteGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111114] border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Excluir Meta</h4>
                <span className="text-xs font-mono text-rose-300 uppercase">Ação Irreversível</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir a meta <strong className="text-white">"{confirmDeleteGoal.name}"</strong>?
              {confirmDeleteGoal.isPrimary && secondaryGoals.length > 0 && (
                <span className="block mt-2 text-amber-300">
                  ⚠️ Como esta é a Meta Principal, a meta secundária <strong>"{secondaryGoals[0].name}"</strong> será automaticamente promovida a Principal.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <button
                onClick={() => setConfirmDeleteGoal(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-[#1a1a1e]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-rose-950 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
