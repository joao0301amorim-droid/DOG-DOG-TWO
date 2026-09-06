import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import {
  Award,
  CheckCircle2,
  Calendar,
  X,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onConfirmComplete: (updatedGoal: Goal) => void;
  activeMonthKey: string;
}

export const CompleteGoalModal: React.FC<CompleteGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onConfirmComplete,
  activeMonthKey,
}) => {
  const [completionDate, setCompletionDate] = useState<string>('');
  const [bonusPoints, setBonusPoints] = useState<number>(50);
  const [percentGain, setPercentGain] = useState<number>(100);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (goal) {
      // Default completion date: if already set use it; otherwise today or month end
      const today = new Date().toISOString().split('T')[0];
      const defaultDate = goal.completedAt || (today.startsWith(activeMonthKey) ? today : `${activeMonthKey}-28`);
      setCompletionDate(defaultDate);

      // Default bonus: 50 for PRINCIPAL, 30 for ALTA, 20 for others
      const defaultBonus = goal.completionBonus ?? (goal.priority === 'PRINCIPAL' ? 50 : 30);
      setBonusPoints(defaultBonus);

      // Calculate percent gain
      const calculated = Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100);
      setPercentGain(goal.percentGainAchieved ?? (calculated > 0 ? calculated : 100));
      setNotes(goal.notes || '');
    }
  }, [goal, activeMonthKey, isOpen]);

  if (!isOpen || !goal) return null;

  const isAlreadyCompleted = goal.status === 'completed';

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch (e) {
      // Canvas confetti may fail silently in tests
    }
  };

  const handleConfirm = () => {
    triggerCelebration();

    const updated: Goal = {
      ...goal,
      status: 'completed',
      completedAt: completionDate || new Date().toISOString().split('T')[0],
      completionBonus: Number(bonusPoints) || 50,
      percentGainAchieved: Number(percentGain) || 100,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    onConfirmComplete(updated);
    onClose();
  };

  const handleReopen = () => {
    const updated: Goal = {
      ...goal,
      status: 'active',
      completedAt: undefined,
      completionBonus: undefined,
      percentGainAchieved: undefined,
      updatedAt: new Date().toISOString(),
    };

    onConfirmComplete(updated);
    onClose();
  };

  const formatValue = (val: number) => {
    if (goal.unit === 'R$') {
      return formatCurrencyBRL(val);
    }
    return `${val} ${goal.unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111114] border-2 border-emerald-500/40 p-6 sm:p-7 shadow-2xl shadow-emerald-950/20 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                  {isAlreadyCompleted ? 'META JÁ CONCLUÍDA' : 'CONCLUIR META DO MÊS'}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1a1a20] text-slate-400 border border-[#2e2e36]">
                  {goal.priority}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {goal.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1a20]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Achievement Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0d1f18] to-indigo-950/40 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Impacto no Mindset Score do Mês
            </span>
            <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-full bg-emerald-500 text-black shadow-md">
              +{bonusPoints} PONTOS
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ao concluir esta meta, você recebe <strong className="text-emerald-300">+{bonusPoints} pontos positivos</strong> adicionados diretamente ao Score Total referente ao mês correspondente.
          </p>
        </div>

        {/* Progress & Gain Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-3 rounded-xl bg-[#080809] border border-[#252530]">
            <span className="text-[10px] uppercase text-slate-500 block">Alvo Planejado</span>
            <span className="text-sm font-bold text-white mt-1 block">
              {formatValue(goal.targetValue)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#080809] border border-[#252530]">
            <span className="text-[10px] uppercase text-slate-500 block">Progresso Real</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">
              {formatValue(goal.currentValue)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#080809] border border-[#252530] col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase text-slate-500 block">Percentual de Ganho</span>
            <span className="text-sm font-bold text-amber-300 mt-1 block">
              {percentGain}% da Meta
            </span>
          </div>
        </div>

        {/* Form Fields: Data de Conclusão, Percentual e Bônus */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Data de Conclusão da Meta</span>
            </label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080809] border border-[#2e2e36] text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Ficará registrada no histórico do mês (ex: Agosto - Concluída em {completionDate}).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Bônus de Score (Pontos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080809] border border-[#2e2e36] text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">pts</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Percentual Atingido (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={percentGain}
                  onChange={(e) => setPercentGain(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080809] border border-[#2e2e36] text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Anotações da Conquista (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Concluí guardando o valor da consultoria extra."
              className="w-full px-3.5 py-2 rounded-xl bg-[#080809] border border-[#2e2e36] text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1e293b]">
          {isAlreadyCompleted ? (
            <button
              type="button"
              onClick={handleReopen}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a1a20] hover:bg-[#25252e] text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all"
              title="Reabrir meta como ativa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reabrir Meta (Ativa)</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Dispara confetes e bônus de score 🎉
            </span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-[#1a1a20]"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="confirm-complete-goal-btn"
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-black uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAlreadyCompleted ? 'Salvar Alterações' : 'Concluir Meta (+50 pts)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
