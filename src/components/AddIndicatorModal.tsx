import React, { useState } from 'react';
import { Indicator, IndicatorCategory, IndicatorType } from '../types';
import { getIndicatorIcon } from '../utils/iconHelper';
import { X, Sparkles, Plus, Check, Loader2, Wand2 } from 'lucide-react';

interface AddIndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndicator: (indicator: Indicator) => void;
  existingIndicators: Indicator[];
}

export const AddIndicatorModal: React.FC<AddIndicatorModalProps> = ({
  isOpen,
  onClose,
  onAddIndicator,
  existingIndicators,
}) => {
  const [tab, setTab] = useState<'manual' | 'ai'>('manual');

  // Manual Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IndicatorCategory>('Produtividade');
  const [type, setType] = useState<IndicatorType>('boolean');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState(15);
  const [isPositive, setIsPositive] = useState(true);
  const [iconName, setIconName] = useState('Target');
  const [targetValue, setTargetValue] = useState(10);

  // AI Suggestion State
  const [userGoal, setUserGoal] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [suggestError, setSuggestError] = useState('');

  if (!isOpen) return null;

  const categories: IndicatorCategory[] = [
    'Finanças',
    'Produtividade',
    'Saúde & Corpo',
    'Mindset',
    'Relacionamentos',
    'Espiritual & Foco',
  ];

  const availableIcons = [
    'DollarSign',
    'Target',
    'Dumbbell',
    'BookOpen',
    'Zap',
    'ShieldCheck',
    'Flame',
    'TrendingUp',
    'Brain',
    'Heart',
    'Coffee',
    'Moon',
    'Award',
    'Sparkles',
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newIndicator: Indicator = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Indicador personalizado para evolução diária.',
      category,
      type,
      unit: type === 'numeric' || type === 'counter' ? unit.trim() || 'un' : undefined,
      weight: Number(weight) || 15,
      isPositive,
      active: true,
      iconName,
      defaultValue: type === 'boolean' ? false : 0,
      targetValue: type === 'numeric' || type === 'counter' ? Number(targetValue) || 10 : undefined,
      isCustom: true,
    };

    onAddIndicator(newIndicator);
    onClose();
  };

  const handleFetchAiSuggestions = async () => {
    if (!userGoal.trim()) return;
    setIsSuggesting(true);
    setSuggestError('');
    try {
      const res = await fetch('/api/ai/suggest-indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoal: userGoal.trim(),
          currentIndicators: existingIndicators,
        }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      } else {
        setSuggestError('Nenhuma sugestão retornada pelo Gemini.');
      }
    } catch (err: any) {
      console.error(err);
      setSuggestError('Erro ao comunicar com o Gemini. Tente novamente.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddAiSuggestion = (sug: any) => {
    const newIndicator: Indicator = {
      id: `custom_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: sug.name,
      description: sug.description || '',
      category: sug.category || 'Mindset',
      type: sug.type || 'boolean',
      unit: sug.unit || (sug.type === 'numeric' ? 'un' : undefined),
      weight: Number(sug.weight) || 15,
      isPositive: sug.isPositive !== false,
      active: true,
      iconName: sug.icon || 'Sparkles',
      defaultValue: sug.type === 'boolean' ? false : 0,
      targetValue: sug.type === 'numeric' ? 10 : undefined,
      isCustom: true,
    };
    onAddIndicator(newIndicator);
    // Remove from current suggestions list
    setAiSuggestions((prev) => prev.filter((item) => item.name !== sug.name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="add-indicator-modal-content"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111114] border border-[#1e293b] shadow-2xl p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Novo Indicador / Botão de Ação</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie botões para personalizar seu mindset e alimentar a planilha.
            </p>
          </div>

          <button
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 my-4 p-1 bg-[#080809] rounded-xl border border-[#1e293b]">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'manual'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual (Personalizado)
          </button>

          <button
            type="button"
            onClick={() => setTab('ai')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'ai'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sugerir com Gemini AI</span>
          </button>
        </div>

        {tab === 'manual' ? (
          /* MANUAL CREATION FORM */
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Botão / Ação *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meditação 15min, Prospecção Ativa, Estudo de Inglês"
                className="w-full px-3.5 py-2 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Breve Descrição / Critério de Validação
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: O que valida que você realmente executou essa ação com sucesso"
                className="w-full px-3.5 py-2 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IndicatorCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#111114] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Coleta
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IndicatorType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="boolean" className="bg-[#111114] text-white">Validação Sim/Não (1 Toque)</option>
                  <option value="numeric" className="bg-[#111114] text-white">Valor Numérico (ex: R$, min, págs)</option>
                  <option value="counter" className="bg-[#111114] text-white">Contador de Quantidade (+ / -)</option>
                </select>
              </div>
            </div>

            {type !== 'boolean' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#080809] border border-[#1e293b]">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: min, R$, págs, un"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#111114] border border-[#1e293b] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta Diária Ideal
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#111114] border border-[#1e293b] text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Peso no Score ({weight} pts)
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Impacto no Mindset
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsPositive(true)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      isPositive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#080809] text-slate-400 border border-[#1e293b]'
                    }`}
                  >
                    + Soma Pontos
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPositive(false)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      !isPositive
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-[#080809] text-slate-400 border border-[#1e293b]'
                    }`}
                  >
                    - Sabotagem (Subtrai)
                  </button>
                </div>
              </div>
            </div>

            {/* Icon selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escolha um Ícone
              </label>
              <div className="flex flex-wrap gap-2">
                {availableIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIconName(ic)}
                    className={`p-2 rounded-lg border transition-all ${
                      iconName === ic
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500'
                        : 'bg-[#080809] text-slate-400 border-[#1e293b] hover:text-slate-200'
                    }`}
                  >
                    {getIndicatorIcon(ic, 'w-4 h-4')}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-[#1e293b] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all"
              >
                Criar Indicador
              </button>
            </div>
          </form>
        ) : (
          /* AI SUGGESTIONS FLOW */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#080809] border border-[#1e293b]">
              <label className="block text-xs font-bold text-indigo-300 mb-1">
                Qual é seu foco de evolução pessoal no momento?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  placeholder="Ex: Quero aumentar vendas, perder 5kg e parar de procrastinar à noite"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#111114] border border-[#1e293b] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchAiSuggestions()}
                />
                <button
                  type="button"
                  onClick={handleFetchAiSuggestions}
                  disabled={isSuggesting || !userGoal.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  {isSuggesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {suggestError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
                {suggestError}
              </p>
            )}

            {/* Suggestions list */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Sugestões Prontas do Gemini:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {aiSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080809] border border-[#1e293b] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 mt-0.5">
                          {getIndicatorIcon(sug.icon || 'Sparkles', 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{sug.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1e293b] text-indigo-300">
                              {sug.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{sug.description}</p>
                          <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
                            {sug.isPositive ? `+${sug.weight} pts` : `-${sug.weight} pts (Sabotagem)`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddAiSuggestion(sug)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
