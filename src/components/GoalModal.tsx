import React, { useState, useEffect } from 'react';
import { Goal, GoalType, GoalPriority } from '../types';
import { X, Target, DollarSign, Brain, TrendingUp, Settings2, Sparkles } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Goal) => void;
  goalToEdit?: Goal | null;
  activeMonthKey: string;
  activeMonthName: string;
  currentNetResult: number;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  goalToEdit,
  activeMonthKey,
  activeMonthName,
  currentNetResult,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('financial');
  const [priority, setPriority] = useState<GoalPriority>('PRINCIPAL');
  const [targetValue, setTargetValue] = useState<number | ''>(850);
  const [currentValue, setCurrentValue] = useState<number | ''>(0);
  const [unit, setUnit] = useState('R$');
  const [autoSyncFinancial, setAutoSyncFinancial] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setType(goalToEdit.type);
      setPriority(goalToEdit.priority);
      setTargetValue(goalToEdit.targetValue);
      setCurrentValue(goalToEdit.currentValue);
      setUnit(goalToEdit.unit || 'R$');
      setAutoSyncFinancial(goalToEdit.autoSyncFinancial !== false);
      setNotes(goalToEdit.notes || '');
    } else {
      setName('');
      setType('financial');
      setPriority('PRINCIPAL');
      setTargetValue(850);
      setCurrentValue(currentNetResult > 0 ? currentNetResult : 0);
      setUnit('R$');
      setAutoSyncFinancial(true);
      setNotes('');
    }
  }, [goalToEdit, isOpen, currentNetResult]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numTarget = Number(targetValue) || 100;
    const numCurrent = autoSyncFinancial && type === 'financial'
      ? Math.max(0, currentNetResult)
      : Number(currentValue) || 0;

    const goalData: Goal = {
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      monthKey: activeMonthKey,
      name: name.trim(),
      type,
      priority,
      targetValue: numTarget,
      currentValue: numCurrent,
      unit: unit.trim() || (type === 'financial' ? 'R$' : '%'),
      status: goalToEdit ? goalToEdit.status : 'active',
      autoSyncFinancial: type === 'financial' ? autoSyncFinancial : false,
      notes: notes.trim(),
      createdAt: goalToEdit ? goalToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: goalToEdit?.completedAt,
      completionBonus: goalToEdit?.completionBonus ?? (priority === 'PRINCIPAL' ? 50 : 30),
      percentGainAchieved: goalToEdit?.percentGainAchieved,
    };

    onSaveGoal(goalData);
    onClose();
  };

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    if (newType === 'financial') {
      setUnit('R$');
      setAutoSyncFinancial(true);
      if (!name) setName('Guardar R$ 850');
      if (!targetValue) setTargetValue(850);
    } else if (newType === 'personal') {
      setUnit('R$');
      setAutoSyncFinancial(false);
      if (!name) setName('Realizar tatuagem');
      if (!targetValue) setTargetValue(600);
    } else if (newType === 'professional') {
      setUnit('%');
      setAutoSyncFinancial(false);
      if (!name) setName('Concluir certificação');
      if (!targetValue) setTargetValue(100);
    } else {
      setUnit('un');
      setAutoSyncFinancial(false);
      if (!name) setName('Comprar roupas');
      if (!targetValue) setTargetValue(300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="goal-modal-container"
        className="relative w-full max-w-lg rounded-2xl bg-[#111114] border border-[#2e2e36] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#0d0d10]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {goalToEdit ? 'Editar Meta' : 'Nova Meta Mensal'}
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Período: <span className="font-semibold text-indigo-300">{activeMonthName}</span>
              </p>
            </div>
          </div>
          <button
            id="close-goal-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f1f26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nome da Meta */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome da Meta
            </label>
            <input
              id="goal-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Guardar R$ 850, Realizar tatuagem, Comprar roupas..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#080809] text-white text-sm border border-[#2e2e36] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Tipo de Meta */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('financial')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  type === 'financial'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Financeira 💰</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('personal')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  type === 'personal'
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 ring-1 ring-teal-500/30'
                    : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-4 h-4 text-teal-400" />
                <span>Pessoal 🧠</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('professional')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  type === 'professional'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Profissional 📈</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('custom')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  type === 'custom'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 ring-1 ring-purple-500/30'
                    : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                }`}
              >
                <Settings2 className="w-4 h-4 text-purple-400" />
                <span>Personalizada ⚙️</span>
              </button>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Prioridade da Meta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'PRINCIPAL', label: '🥇 PRINCIPAL', desc: 'Foco Nº 1 do mês' },
                { id: 'ALTA', label: '🥈 ALTA', desc: 'Meta secundária' },
                { id: 'MEDIA', label: '🥉 MÉDIA', desc: 'Meta secundária' },
                { id: 'BAIXA', label: 'BAIXA', desc: 'Apoio / Opcional' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as GoalPriority)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center transition-all ${
                    priority === p.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                      : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valores: Alvo e Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Valor da Meta
              </label>
              <input
                id="goal-target-value-input"
                type="number"
                min="1"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="850"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080809] text-white font-mono font-bold text-sm border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Valor Atual
              </label>
              <input
                id="goal-current-value-input"
                type="number"
                min="0"
                step="any"
                disabled={type === 'financial' && autoSyncFinancial}
                value={
                  type === 'financial' && autoSyncFinancial
                    ? Math.max(0, currentNetResult)
                    : currentValue
                }
                onChange={(e) => setCurrentValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#080809] text-white font-mono font-bold text-sm border border-[#2e2e36] focus:outline-none focus:border-indigo-500 ${
                  type === 'financial' && autoSyncFinancial ? 'opacity-70 cursor-not-allowed text-emerald-400' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Unidade
              </label>
              <input
                id="goal-unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="R$, %, h, un"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080809] text-white font-mono text-sm border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Opção de Sincronização Financeira Automática */}
          {type === 'financial' && (
            <div className="p-3 rounded-xl bg-[#0a1b14] border border-emerald-500/30 flex items-start gap-3">
              <input
                id="goal-auto-sync-checkbox"
                type="checkbox"
                checked={autoSyncFinancial}
                onChange={(e) => setAutoSyncFinancial(e.target.checked)}
                className="mt-1 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
              <div>
                <label htmlFor="goal-auto-sync-checkbox" className="text-xs font-bold text-emerald-300 cursor-pointer">
                  Integração Automática com Resultado Líquido do Mês
                </label>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Conceito: <span className="font-mono font-bold">GANHOS - GASTOS = RESULTADO LÍQUIDO</span>. O valor atual da meta será calculado automaticamente com o saldo do mês (atualmente R$ {currentNetResult.toFixed(2)}).
                </p>
              </div>
            </div>
          )}

          {/* Notas / Observações */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Observações & Plano Tático
            </label>
            <textarea
              id="goal-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Alocação na conta reserva, agendamento de compras, etc."
              className="w-full px-3.5 py-2 rounded-xl bg-[#080809] text-white text-xs border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1c1c22] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-goal-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
            >
              {goalToEdit ? 'Salvar Alterações' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
