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
  Settings2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  FileText,
  Sliders,
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
  onOpenIndicatorManagerModal: () => void;
  moneySpent: number;
  onUpdateMoneySpent: (amount: number, indicatorId?: string) => void;
  spentDetails?: Record<string, number>;
  textValues?: Record<string, string>;
  onUpdateTextValue?: (indicatorId: string, text: string) => void;
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
  onOpenIndicatorManagerModal,
  moneySpent,
  onUpdateMoneySpent,
  spentDetails = {},
  textValues = {},
  onUpdateTextValue,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Financial Values
  const moneyEarned = Number(values['H05'] ?? values['ind_money'] ?? 0);
  const netDailyResult = moneyEarned - moneySpent;

  const handleQuickAddEarned = (amount: number) => {
    onUpdateValue('H05', moneyEarned + amount);
  };

  const handleQuickAddSpent = (amount: number, indicatorId = 'H02') => {
    const currentSpentOnInd = spentDetails[indicatorId] || 0;
    const newIndSpent = currentSpentOnInd + amount;
    onUpdateMoneySpent(newIndSpent, indicatorId);
    // Ensure the deviation indicator is flagged true
    if (!values[indicatorId]) {
      onUpdateValue(indicatorId, true);
    }
  };

  const handleToggleDeviationWithMoney = (indicator: Indicator, currentState: boolean) => {
    const nextState = !currentState;
    onUpdateValue(indicator.id, nextState);
    if (!nextState) {
      // Reverted: clear spent money for this indicator
      onUpdateMoneySpent(0, indicator.id);
    } else if (indicator.additionalDataType === 'money' && (!spentDetails[indicator.id] || spentDetails[indicator.id] === 0)) {
      // Default initial spent value
      onUpdateMoneySpent(50, indicator.id);
    }
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
      {/* 1. PAINEL FINANCEIRO DIÁRIO INTEGRADO (GANHOS - GASTOS = RESULTADO LÍQUIDO) */}
      <div
        id="financial-integrated-panel"
        className="relative overflow-hidden rounded-3xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[10px] tracking-widest uppercase">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                INTEGRAÇÃO TOTAL
              </span>
              <span>Entrelaçamento Financeiro & Mindset Diário</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              FINANCEIRO DO DIA ({selectedDate})
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Conceito central: <strong className="text-white font-mono">GANHOS - GASTOS = RESULTADO LÍQUIDO</strong>. Alimenta o Score Diário e o ritmo das Metas Mensais.
            </p>
          </div>

          {/* Resultado Líquido em Destaque */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[#080809] border border-emerald-500/30 text-right">
              <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-emerald-400 block">
                Resultado Líquido do Dia
              </span>
              <span className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                netDailyResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrencyBRL(netDailyResult)}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Colunas: Ganhos (H05) vs Gastos (H02 "Comprou... haha") */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Lado A: Ganhos (H05 GANHOU DINHEIRO HOJE) */}
          <div className="p-4 rounded-2xl bg-[#0a1813] border border-emerald-500/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">H05 (+10 PTS)</span>
                  <h4 className="text-sm font-bold text-white">GANHOU DINHEIRO HOJE?</h4>
                </div>
              </div>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {formatCurrencyBRL(moneyEarned)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={moneyEarned === 0 ? '' : moneyEarned}
                  onChange={(e) => onUpdateValue('H05', Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080809] text-white font-mono font-bold text-sm border border-[#2e2e36] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAddEarned(50)}
                className="px-2.5 py-2 rounded-xl bg-[#13271f] hover:bg-emerald-950 text-emerald-300 font-mono text-xs border border-emerald-500/30 active:scale-95"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddEarned(100)}
                className="px-2.5 py-2 rounded-xl bg-[#13271f] hover:bg-emerald-950 text-emerald-300 font-mono text-xs border border-emerald-500/30 active:scale-95"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddEarned(500)}
                className="px-2.5 py-2 rounded-xl bg-[#13271f] hover:bg-emerald-950 text-emerald-300 font-mono text-xs border border-emerald-500/30 active:scale-95"
              >
                +500
              </button>
              {moneyEarned > 0 && (
                <button
                  type="button"
                  onClick={() => onUpdateValue('H05', 0)}
                  className="px-2 py-2 rounded-xl text-slate-500 hover:text-rose-400 text-xs font-mono"
                  title="Zerar faturamento"
                >
                  Zerar
                </button>
              )}
            </div>
          </div>

          {/* Lado B: Gastos do Dia (Alimentado por H02 "Comprou... haha" e desvios) */}
          <div className="p-4 rounded-2xl bg-[#180d12] border border-rose-500/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">H02 (-40 PTS SE HOUVER COMPRA)</span>
                  <h4 className="text-sm font-bold text-white">GASTOS DO DIA (COMPROU... HAHA)</h4>
                </div>
              </div>
              <span className="text-base font-extrabold font-mono text-rose-400">
                {formatCurrencyBRL(moneySpent)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={moneySpent === 0 ? '' : moneySpent}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    onUpdateMoneySpent(val, 'H02');
                    onUpdateValue('H02', val > 0);
                  }}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080809] text-white font-mono font-bold text-sm border border-[#2e2e36] focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAddSpent(20)}
                className="px-2.5 py-2 rounded-xl bg-[#281318] hover:bg-rose-950 text-rose-300 font-mono text-xs border border-rose-500/30 active:scale-95"
              >
                +20
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSpent(50)}
                className="px-2.5 py-2 rounded-xl bg-[#281318] hover:bg-rose-950 text-rose-300 font-mono text-xs border border-rose-500/30 active:scale-95"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSpent(100)}
                className="px-2.5 py-2 rounded-xl bg-[#281318] hover:bg-rose-950 text-rose-300 font-mono text-xs border border-rose-500/30 active:scale-95"
              >
                +100
              </button>
              {moneySpent > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMoneySpent(0, 'H02');
                    onUpdateValue('H02', false);
                  }}
                  className="px-2 py-2 rounded-xl text-slate-500 hover:text-emerald-400 text-xs font-mono"
                  title="Zerar gastos"
                >
                  Zerar
                </button>
              )}
            </div>
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
                ({indicators.filter((i) => i.active !== false).length} ativos)
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="open-indicator-manager-btn"
              onClick={onOpenIndicatorManagerModal}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-300 hover:text-white bg-[#1a1a1e] hover:bg-indigo-950/60 px-3.5 py-2 rounded-xl border border-indigo-500/40 transition-all active:scale-95 shadow-sm"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>⚙️ Gerenciador de Indicadores</span>
            </button>

            <button
              id="open-spreadsheet-link-btn"
              onClick={onOpenSpreadsheetModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-300 hover:text-white bg-[#1a1a1e] hover:bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ver Planilha</span>
            </button>

            <button
              id="open-database-guide-btn"
              onClick={onOpenDatabaseGuideModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-[#1a1a1e] hover:bg-[#25252b] px-3.5 py-2 rounded-xl border border-[#2e2e36] transition-all active:scale-95 shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Banco de Dados</span>
            </button>

            <button
              id="open-add-indicator-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-[#1a1a1e] hover:bg-[#25252b] px-3 py-2 rounded-xl border border-[#2e2e36] transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Novo</span>
            </button>
          </div>
        </div>

        {/* Dynamic Grid of Indicator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {indicators
            .filter((i) => i.id !== 'H05') // H05 is displayed prominently in the financial card above
            .map((indicator) => {
              const currentValue = values[indicator.id];
              const isChecked = indicator.type === 'boolean' ? Boolean(currentValue) : false;
              const numericVal = typeof currentValue === 'number' ? currentValue : 0;
              const isIndicatorActive = indicator.active !== false;
              const indSpent = spentDetails[indicator.id] || 0;
              const textVal = textValues[indicator.id] || '';

              // Special treatment for H02 "COMPROU... HAHA" or negative money indicators
              const isNegativePurchase = !indicator.isPositive && (indicator.id === 'H02' || indicator.additionalDataType === 'money');

              return (
                <div
                  key={indicator.id}
                  id={`indicator-card-${indicator.id}`}
                  className={`relative rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    !isIndicatorActive
                      ? 'opacity-50 bg-[#0d0d10] border-[#1e293b] border-dashed'
                      : indicator.isPositive
                      ? isChecked
                        ? 'bg-[#0d1f18]/70 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-[#111114] hover:bg-[#151518] border-[#1e293b]'
                      : currentValue || isChecked
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
                            {isNegativePurchase && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                💸 Gasto
                              </span>
                            )}
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
                          title={isIndicatorActive ? 'Desativar este indicador' : 'Ativar este indicador'}
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
                  <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
                    {/* Caso 1: Indicador com "Comprou... haha" ou Gasto Financeiro Adicional */}
                    {isNegativePurchase ? (
                      <div className="space-y-2.5">
                        <button
                          id={`toggle-btn-${indicator.id}`}
                          disabled={!isIndicatorActive}
                          onClick={() => handleToggleDeviationWithMoney(indicator, Boolean(currentValue))}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            !isIndicatorActive
                              ? 'bg-[#16161a] text-slate-500 cursor-not-allowed border border-[#2e2e36]'
                              : currentValue
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 ring-1 ring-rose-400'
                              : 'bg-[#1a1a1e] hover:bg-[#222228] text-[#e2e8f0] border border-[#2e2e36]'
                          }`}
                        >
                          {currentValue ? (
                            <>
                              <XCircle className="w-4 h-4 text-white" />
                              <span>COMPROU! (-{indicator.weight} pts)</span>
                            </>
                          ) : (
                            <>
                              <span>Sem Compra / Blindado (0 pts)</span>
                            </>
                          )}
                        </button>

                        {/* Se COMPROU for marcado: abre campo do valor gasto */}
                        {Boolean(currentValue) && (
                          <div className="p-3 rounded-xl bg-[#160b0e] border border-rose-500/40 animate-in fade-in space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-rose-300 font-bold">Quanto foi gasto?</span>
                              <span className="text-rose-400 font-extrabold">{formatCurrencyBRL(indSpent)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={indSpent === 0 ? '' : indSpent}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    onUpdateMoneySpent(val, indicator.id);
                                  }}
                                  placeholder="0,00"
                                  className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-[#080809] text-white font-mono font-bold text-xs border border-rose-500/40 focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickAddSpent(20, indicator.id)}
                                className="px-2 py-1.5 rounded-lg bg-[#250d14] text-rose-300 font-mono text-[11px] border border-rose-500/30"
                              >
                                +20
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAddSpent(50, indicator.id)}
                                className="px-2 py-1.5 rounded-lg bg-[#250d14] text-rose-300 font-mono text-[11px] border border-rose-500/30"
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAddSpent(100, indicator.id)}
                                className="px-2 py-1.5 rounded-lg bg-[#250d14] text-rose-300 font-mono text-[11px] border border-rose-500/30"
                              >
                                +100
                              </button>
                            </div>
                            <span className="text-[10px] text-rose-400/80 font-mono block">
                              Alimenta simultaneamente: Score (-{indicator.weight} pts) e Finanças (Gastos do dia).
                            </span>
                          </div>
                        )}
                      </div>
                    ) : indicator.type === 'boolean' ? (
                      /* Caso 2: Validação Padrão Sim/Não */
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
                      /* Caso 3: Numérico / Stepper */
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

                    {/* Campo de Dado Adicional Textual (se configurado, ex: H07 TOMOU ESCOLHA NA EMOÇÃO) */}
                    {indicator.additionalDataType === 'text' && onUpdateTextValue && (
                      <div className="pt-2 border-t border-[#1e293b]">
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Observação do Indicador:
                        </label>
                        <input
                          type="text"
                          value={textVal}
                          onChange={(e) => onUpdateTextValue(indicator.id, e.target.value)}
                          placeholder="Descreva o contexto ou motivo..."
                          className="w-full px-3 py-1.5 rounded-lg bg-[#080809] text-white text-xs border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
                        />
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
