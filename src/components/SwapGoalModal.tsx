import React from 'react';
import { Goal } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import { X, RefreshCw, Trophy, ArrowRight, Plus, Check } from 'lucide-react';

interface SwapGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrimaryGoal: Goal | null;
  availableGoals: Goal[];
  onSwapToPrimary: (goalId: string) => void;
  onOpenCreateNew: () => void;
  monthName: string;
}

export const SwapGoalModal: React.FC<SwapGoalModalProps> = ({
  isOpen,
  onClose,
  currentPrimaryGoal,
  availableGoals,
  onSwapToPrimary,
  onOpenCreateNew,
  monthName,
}) => {
  if (!isOpen) return null;

  const otherGoals = availableGoals.filter((g) => g.id !== currentPrimaryGoal?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="swap-goal-modal"
        className="relative w-full max-w-lg rounded-3xl bg-[#111114] border border-[#2e2e36] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#1e293b] bg-[#16161b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 block">
                Foco Mensal Estratégico
              </span>
              <h3 className="text-xl font-black text-white">Trocar Meta Principal</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#25252b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Primary Banner */}
          {currentPrimaryGoal && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  Meta Principal Atual:
                </span>
                <span>{currentPrimaryGoal.priority}</span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">{currentPrimaryGoal.name}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Alvo: {currentPrimaryGoal.unit === 'R$' ? formatCurrencyBRL(currentPrimaryGoal.targetValue) : `${currentPrimaryGoal.targetValue} ${currentPrimaryGoal.unit}`} • Atual: {currentPrimaryGoal.unit === 'R$' ? formatCurrencyBRL(currentPrimaryGoal.currentValue) : `${currentPrimaryGoal.currentValue} ${currentPrimaryGoal.unit}`}
              </p>
            </div>
          )}

          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
            Selecione qual meta assumirá o posto Nº 1 em {monthName}:
          </div>

          {/* List of other goals */}
          {otherGoals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#080809] border border-[#2e2e36] text-center space-y-3">
              <p className="text-xs text-slate-400">
                Você não possui outras metas cadastradas neste mês para substituir a principal.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateNew();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Nova Meta para ser a Principal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {otherGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl bg-[#080809] hover:bg-[#15151a] border border-[#2e2e36] hover:border-amber-500/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 uppercase bg-[#1a1a20] px-2 py-0.5 rounded border border-[#2e2e36]">
                          {goal.priority}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-400">
                          {goal.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {goal.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                        <span>Alvo: {goal.unit === 'R$' ? formatCurrencyBRL(goal.targetValue) : `${goal.targetValue} ${goal.unit}`}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{percent}% concluído</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSwapToPrimary(goal.id);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs uppercase tracking-wider border border-amber-500/30 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Definir como Principal</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create new goal option */}
          {otherGoals.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateNew();
                }}
                className="w-full py-3 rounded-2xl border border-dashed border-[#2e2e36] hover:border-indigo-500/60 text-slate-400 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all bg-[#080809]"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Criar uma nova meta e torná-la Principal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
