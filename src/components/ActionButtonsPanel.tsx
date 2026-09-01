import React, { useState } from 'react';
import { Indicator } from '../types';
import { getIndicatorIcon } from '../utils/iconHelper';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Sparkles,
  Save,
  MessageSquareQuote,
  Trash2,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Database,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActionButtonsPanelProps {
  indicators: Indicator[];
  values: Record<string, boolean | number>;
  onUpdateValue: (indicatorId: string, value: boolean | number) => void;
  onToggleIndicatorActive: (indicatorId: string) => void;
  observation: string;
  setObservation: (obs: string) => void;
  onSaveDay: () => void;
  selectedDate: string;
  dayOfWeek: string;
  onDeleteCustomIndicator?: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenSpreadsheetModal: () => void;
  onOpenDatabaseGuideModal: () => void;
}

export const ActionButtonsPanel: React.FC<ActionButtonsPanelProps> = ({
  indicators,
  values,
  onUpdateValue,
  onToggleIndicatorActive,
  observation,
  setObservation,
  onSaveDay,
  selectedDate,
  dayOfWeek,
  onDeleteCustomIndicator,
  onOpenAddModal,
  onOpenSpreadsheetModal,
  onOpenDatabaseGuideModal,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Financial Indicator ("H05 GANHOU DINHEIRO HOJE")
  const moneyIndicator = indicators.find((i) => i.id === 'H05' || i.id === 'ind_money');
  const currentMoney = Number(values['H05'] ?? values['ind_money'] ?? 0);

  const handleQuickAddMoney = (amount: number) => {
    const key = moneyIndicator?.id || 'H05';
    onUpdateValue(key, currentMoney + amount);
  };

  const handleSaveWithCelebration = () => {
    onSaveDay();
    setSaveSuccess(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#14b8a6', '#6366f1', '#f59e0b'],
    });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const quickObservationPrompts = [
    { label: '🚀 Vitória do Dia:', text: 'Vitória do dia: ' },
    { label: '⚠️ Gatilho de Desvio:', text: 'Gatilho ou desvio registrado: ' },
    { label: '💡 Aprendizado:', text: 'Aprendizado prático: ' },
    { label: '🎯 Decisão Tomada:', text: 'Decisão estratégica tomada: ' },
  ];

  const handleAppendPrompt = (promptText: string) => {
    if (observation.trim() === '') {
      setObservation(promptText);
    } else {
      setObservation(observation + '\n' + promptText);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SECTION: INDICADOR H05 GANHOU DINHEIRO HOJE */}
      <div
        id="financial-value-collector-card"
        className="relative overflow-hidden rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[10px] tracking-widest uppercase">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                H05 • +10 PTS
              </span>
              <span>Indicador de Mente & Receita Diária</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              GANHOU DINHEIRO HOJE?
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Lance o valor financeiro do dia. Qualquer valor acima de R$ 0,00 valida automaticamente os +10 pontos do H05.
            </p>
          </div>

          {/* Value Display */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-xl bg-[#080809] border border-[#1e293b] text-right">
              <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-[#64748b] block">Total Faturado</span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatCurrencyBRL(currentMoney)}
              </span>
            </div>
          </div>
        </div>

        {/* Input & Quick Buttons */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Custom numeric input */}
          <div className="sm:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] font-mono font-bold text-sm">
              R$
            </span>
            <input
              id="money-input-field"
              type="number"
              min="0"
              step="10"
              value={currentMoney === 0 ? '' : currentMoney}
              onChange={(e) => onUpdateValue('H05', Math.max(0, Number(e.target.value) || 0))}
              placeholder="0,00"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#080809] text-white font-mono font-bold text-base border border-[#2e2e36] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
            <button
              id="quick-add-50-btn"
              onClick={() => handleQuickAddMoney(50)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1e] hover:bg-[#222228] text-emerald-400 font-mono text-xs font-semibold border border-[#2e2e36] active:scale-95 transition-all"
            >
              + R$ 50
            </button>
            <button
              id="quick-add-100-btn"
              onClick={() => handleQuickAddMoney(100)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1e] hover:bg-[#222228] text-emerald-400 font-mono text-xs font-semibold border border-[#2e2e36] active:scale-95 transition-all"
            >
              + R$ 100
            </button>
            <button
              id="quick-add-500-btn"
              onClick={() => handleQuickAddMoney(500)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1e] hover:bg-[#222228] text-emerald-400 font-mono text-xs font-semibold border border-[#2e2e36] active:scale-95 transition-all"
            >
              + R$ 500
            </button>
            <button
              id="quick-add-1000-btn"
              onClick={() => handleQuickAddMoney(1000)}
              className="px-3 py-2 rounded-lg bg-[#1a1a1e] hover:bg-[#222228] text-emerald-400 font-mono text-xs font-semibold border border-[#2e2e36] active:scale-95 transition-all"
            >
              + R$ 1.000
            </button>
            {currentMoney > 0 && (
              <button
                id="reset-money-btn"
                onClick={() => onUpdateValue('H05', 0)}
                className="px-3 py-2 rounded-lg bg-[#1a1a1e] hover:bg-rose-950/40 text-[#94a3b8] hover:text-rose-400 font-mono text-xs font-medium border border-[#2e2e36] active:scale-95 transition-all"
                title="Zerar valor"
              >
                Zerar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECTION: BOTÕES DE VALIDAÇÃO DE HÁBITOS E PONTUAÇÃO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-[#64748b] font-bold">
              Coleta de Indicadores & Pontuação
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <span>Hábitos Diários & Validações</span>
              <span className="text-xs font-normal text-[#94a3b8]">
                (H01 a H07 configurados)
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="open-spreadsheet-link-btn"
              onClick={onOpenSpreadsheetModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-300 hover:text-white bg-[#1a1a1e] hover:bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Registro & Planilha</span>
            </button>

            <button
              id="open-database-guide-btn"
              onClick={onOpenDatabaseGuideModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-300 hover:text-white bg-[#1a1a1e] hover:bg-indigo-950/50 px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-all active:scale-95 shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Banco de Dados</span>
            </button>

            <button
              id="open-add-indicator-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-[#1a1a1e] hover:bg-[#25252b] px-3.5 py-2 rounded-xl border border-[#2e2e36] transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Novo Hábito</span>
            </button>
          </div>
        </div>

        {/* Dynamic Grid of Indicator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {indicators
            .filter((i) => i.id !== 'H05') // H05 is displayed above
            .map((indicator) => {
              const currentValue = values[indicator.id];
              const isChecked = indicator.type === 'boolean' ? Boolean(currentValue) : false;
              const numericVal = typeof currentValue === 'number' ? currentValue : 0;
              const isIndicatorActive = indicator.active !== false;

              return (
                <div
                  key={indicator.id}
                  id={`indicator-card-${indicator.id}`}
                  className={`relative rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    !isIndicatorActive
                      ? 'opacity-60 bg-[#0d0d10] border-[#1e293b] border-dashed'
                      : indicator.isPositive
                      ? isChecked
                        ? 'bg-[#0d1f18]/70 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-[#111114] hover:bg-[#151518] border-[#1e293b]'
                      : currentValue
                      ? 'bg-[#250d14]/70 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-[#111114] hover:bg-[#151518] border-[#1e293b]'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            !isIndicatorActive
                              ? 'bg-[#16161a] text-slate-500'
                              : indicator.isPositive
                              ? isChecked
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-[#1a1a1e] text-[#94a3b8] border border-[#2e2e36]'
                              : currentValue
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-[#1a1a1e] text-[#94a3b8] border border-[#2e2e36]'
                          }`}
                        >
                          {getIndicatorIcon(indicator.iconName, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                              {indicator.id}
                            </span>
                            <span className="text-[9px] uppercase font-mono font-bold text-[#64748b] tracking-wider">
                              {indicator.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white leading-snug mt-0.5">
                            {indicator.name}
                          </h4>
                        </div>
                      </div>

                      {/* Weight badge & Active Toggle */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            indicator.isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {indicator.isPositive ? `+${indicator.weight} pts` : `-${indicator.weight} pts`}
                        </span>

                        <button
                          id={`toggle-active-${indicator.id}`}
                          onClick={() => onToggleIndicatorActive(indicator.id)}
                          className="flex items-center gap-1 text-[9px] font-mono text-slate-400 hover:text-white transition-colors"
                          title={isIndicatorActive ? 'Desativar este hábito' : 'Ativar este hábito'}
                        >
                          {isIndicatorActive ? (
                            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                              <ToggleRight className="w-3.5 h-3.5" /> Ativo
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <ToggleLeft className="w-3.5 h-3.5" /> Inativo
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#94a3b8] mt-2.5 line-clamp-2">
                      {indicator.description}
                    </p>
                  </div>

                  {/* Interactive Control Area */}
                  <div className="mt-4 pt-3 border-t border-[#1e293b]">
                    {indicator.type === 'boolean' ? (
                      /* Boolean Action Validation Button */
                      <button
                        id={`toggle-btn-${indicator.id}`}
                        disabled={!isIndicatorActive}
                        onClick={() => onUpdateValue(indicator.id, !isChecked)}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                          !isIndicatorActive
                            ? 'bg-[#16161a] text-slate-500 cursor-not-allowed border border-[#2e2e36]'
                            : indicator.isPositive
                            ? isChecked
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950 ring-1 ring-emerald-400'
                              : 'bg-[#1a1a1e] hover:bg-[#222228] text-[#e2e8f0] border border-[#2e2e36]'
                            : currentValue
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 ring-1 ring-rose-400'
                            : 'bg-[#1a1a1e] hover:bg-[#222228] text-[#e2e8f0] border border-[#2e2e36]'
                        }`}
                      >
                        {!isIndicatorActive ? (
                          <span>Inativo (Clique em Ativar acima)</span>
                        ) : indicator.isPositive ? (
                          isChecked ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Validado (+{indicator.weight} pts)</span>
                            </>
                          ) : (
                            <>
                              <span>Validar Ação</span>
                            </>
                          )
                        ) : currentValue ? (
                          <>
                            <XCircle className="w-4 h-4 text-white" />
                            <span>Desvio Registrado (-{indicator.weight} pts)</span>
                          </>
                        ) : (
                          <>
                            <span>Sem Desvio / Blindado</span>
                          </>
                        )}
                      </button>
                    ) : (
                      /* Numeric / Stepper Input */
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-[#64748b] font-mono">
                          Meta: <span className="font-semibold text-[#e2e8f0]">{indicator.targetValue} {indicator.unit}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id={`dec-btn-${indicator.id}`}
                            onClick={() => onUpdateValue(indicator.id, Math.max(0, numericVal - 5))}
                            className="w-8 h-8 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] text-[#e2e8f0] border border-[#2e2e36] flex items-center justify-center transition-all active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1 bg-[#080809] px-3 py-1.5 rounded-lg border border-[#1e293b]">
                            <input
                              id={`num-input-${indicator.id}`}
                              type="number"
                              min="0"
                              value={numericVal}
                              onChange={(e) => onUpdateValue(indicator.id, Math.max(0, Number(e.target.value) || 0))}
                              className="w-12 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
                            />
                            <span className="text-[10px] text-[#64748b] font-mono font-semibold">{indicator.unit}</span>
                          </div>

                          <button
                            id={`inc-btn-${indicator.id}`}
                            onClick={() => onUpdateValue(indicator.id, numericVal + 5)}
                            className="w-8 h-8 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center justify-center transition-all active:scale-90"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. SECTION: OBSERVAÇÕES & MEMÓRIAS RELEVANTES DO DIA */}
      <div
        id="daily-observation-section"
        className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-mono font-bold text-[#64748b] tracking-wider block">
                Memória & Registro
              </span>
              <h3 className="text-base font-bold text-white">
                Observações Relevantes do Dia
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-[#64748b] hidden sm:inline-block">
            Sincroniza na coluna de observação da planilha
          </span>
        </div>

        <p className="text-xs text-[#94a3b8] mb-3">
          Anote o que deu certo hoje, gatilhos de desvio evitados ou decisões importantes:
        </p>

        {/* Quick helper tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {quickObservationPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAppendPrompt(p.text)}
              className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#1a1a1e] hover:bg-[#25252b] text-[#94a3b8] hover:text-white border border-[#2e2e36] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          id="daily-observation-textarea"
          rows={3}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Ex: Treino e estudo executados com foco máximo. Dia sem compras impulsivas e com faturamento registrado..."
          className="w-full p-3.5 rounded-xl bg-[#080809] text-white placeholder-[#475569] border border-[#2e2e36] focus:outline-none focus:border-indigo-500 text-sm leading-relaxed transition-all"
        />

        {/* Save & Confirm Action CTA */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#1e293b]">
          <div className="text-xs font-mono text-[#64748b]">
            Registro ativo para: <span className="font-semibold text-indigo-400">{dayOfWeek}, {selectedDate}</span>
          </div>

          <button
            id="save-daily-log-btn"
            onClick={handleSaveWithCelebration}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-500 shadow-emerald-950 ring-2 ring-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/60'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                <span>Salvo na Planilha!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Salvar & Atualizar Planilha do Dia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

