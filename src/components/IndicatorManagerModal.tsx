import React, { useState } from 'react';
import { Indicator, AdditionalDataType, IndicatorCategory, IndicatorType } from '../types';
import { getIndicatorIcon } from '../utils/iconHelper';
import {
  X,
  Settings,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Hash,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface IndicatorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  onSaveIndicators: (indicators: Indicator[]) => void;
}

export const IndicatorManagerModal: React.FC<IndicatorManagerModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onSaveIndicators,
}) => {
  const [editingInd, setEditingInd] = useState<Indicator | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for creating / editing
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IndicatorCategory>('Comportamento');
  const [polarity, setPolarity] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [weight, setWeight] = useState<number>(10);
  const [additionalDataType, setAdditionalDataType] = useState<AdditionalDataType>('none');
  const [unit, setUnit] = useState('');
  const [iconName, setIconName] = useState('Zap');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingInd(null);
    setIsCreating(true);
    setName('');
    setDescription('');
    setCategory('Comportamento');
    setPolarity('positive');
    setWeight(10);
    setAdditionalDataType('none');
    setUnit('');
    setIconName('Sparkles');
  };

  const handleStartEdit = (ind: Indicator) => {
    setIsCreating(false);
    setEditingInd(ind);
    setName(ind.name);
    setDescription(ind.description || '');
    setCategory(ind.category);
    setPolarity(ind.weight === 0 ? 'neutral' : ind.isPositive ? 'positive' : 'negative');
    setWeight(Math.abs(ind.weight));
    setAdditionalDataType(ind.additionalDataType || (ind.type === 'numeric' ? 'quantity' : 'none'));
    setUnit(ind.unit || '');
    setIconName(ind.iconName || 'Zap');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingInd(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isPos = polarity !== 'negative';
    const finalWeight = polarity === 'neutral' ? 0 : Number(weight) || 10;
    const finalType: IndicatorType =
      additionalDataType === 'quantity' || additionalDataType === 'money'
        ? 'numeric'
        : additionalDataType === 'scale'
        ? 'rating'
        : 'boolean';

    if (isCreating) {
      const nextId = `IND_${Date.now().toString().slice(-4)}`;
      const newIndicator: Indicator = {
        id: nextId,
        name: name.trim().toUpperCase(),
        description: description.trim(),
        category,
        isPositive: isPos,
        weight: finalWeight,
        active: true,
        type: finalType,
        additionalDataType,
        unit: additionalDataType === 'money' ? 'R$' : unit.trim(),
        iconName,
        isCustom: true,
        order: indicators.length + 1,
        defaultValue: finalType === 'boolean' ? false : 0,
      };
      onSaveIndicators([...indicators, newIndicator]);
    } else if (editingInd) {
      const updated = indicators.map((ind) => {
        if (ind.id === editingInd.id) {
          return {
            ...ind,
            name: name.trim().toUpperCase(),
            description: description.trim(),
            category,
            isPositive: isPos,
            weight: finalWeight,
            type: finalType,
            additionalDataType,
            unit: additionalDataType === 'money' ? 'R$' : unit.trim(),
            iconName,
          };
        }
        return ind;
      });
      onSaveIndicators(updated);
    }

    handleCancelForm();
  };

  const handleToggleActive = (id: string) => {
    const updated = indicators.map((ind) => {
      if (ind.id === id) {
        return { ...ind, active: ind.active === false ? true : false };
      }
      return ind;
    });
    onSaveIndicators(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este indicador?')) {
      const updated = indicators.filter((ind) => ind.id !== id);
      onSaveIndicators(updated);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...indicators];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    onSaveIndicators(items);
  };

  const handleMoveDown = (index: number) => {
    if (index === indicators.length - 1) return;
    const items = [...indicators];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    onSaveIndicators(items);
  };

  const availableIcons = [
    'BookOpen',
    'AlertTriangle',
    'Dumbbell',
    'Zap',
    'DollarSign',
    'Sparkles',
    'ShieldAlert',
    'Brain',
    'Flame',
    'Target',
    'Heart',
    'Smile',
    'Coffee',
    'Crosshair',
    'Activity',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="indicator-manager-modal"
        className="relative w-full max-w-3xl rounded-3xl bg-[#111114] border border-[#2e2e36] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#0d0d10]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                ⚙️ Gerenciador de Indicadores
              </h3>
              <p className="text-xs text-slate-400">
                Personalize, ordene, edite o impacto (+/-) e configure dados adicionais (R$, texto, escala).
              </p>
            </div>
          </div>
          <button
            id="close-indicator-manager-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f1f26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area: Form or Indicator List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isCreating || editingInd ? (
            /* Sub-Form for Create / Edit */
            <form onSubmit={handleSaveForm} className="space-y-4 bg-[#0a0a0d] p-5 rounded-2xl border border-[#252530]">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <span className="text-xs font-mono font-bold uppercase text-indigo-400">
                  {isCreating ? '➕ Criar Novo Indicador' : `✏️ Editar Indicador (${editingInd?.id})`}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-mono text-slate-400 hover:text-white"
                >
                  Voltar à Lista
                </button>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome do Indicador
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: COMPROU ALGO DESNECESSÁRIO, RECEBIMENTO EXTRA, OBSERVAÇÃO"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111114] text-white text-sm font-semibold border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Descrição & Orientação
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Gatilho ou desvio registrado no dia com valor financeiro envolvido"
                  className="w-full px-4 py-2 rounded-xl bg-[#111114] text-white text-xs border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Polaridade e Impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tipo de Impacto
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPolarity('positive')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        polarity === 'positive'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                      }`}
                    >
                      Positivo (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolarity('negative')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        polarity === 'negative'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                          : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                      }`}
                    >
                      Negativo (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolarity('neutral')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        polarity === 'neutral'
                          ? 'bg-slate-500/20 border-slate-400 text-slate-200'
                          : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                      }`}
                    >
                      Neutro (0)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Impacto no Score (Pontos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={polarity === 'neutral'}
                    value={polarity === 'neutral' ? 0 : weight}
                    onChange={(e) => setWeight(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-xl bg-[#111114] text-white font-mono font-bold text-sm border border-[#2e2e36] focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {polarity === 'negative' ? `Subtrai -${weight} pts` : polarity === 'positive' ? `Soma +${weight} pts` : 'Sem impacto na pontuação'}
                  </span>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Categoria
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Financeiro', 'Produtividade', 'Comportamento', 'Desenvolvimento', 'Saúde', 'Personalizado'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        category === cat
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIPO DE DADO ADICIONAL (Solicitado na Atualização 4) */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tipo de Dado Adicional Coletado
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalDataType('none');
                      setUnit('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      additionalDataType === 'none'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                    }`}
                  >
                    <span>Nenhum</span>
                    <span className="text-[9px] text-slate-500">Apenas Sim/Não</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalDataType('money');
                      setUnit('R$');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      additionalDataType === 'money'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Dinheiro (R$)</span>
                    <span className="text-[9px] text-slate-500">Quanto gastou/ganhou</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalDataType('quantity');
                      if (!unit) setUnit('un');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      additionalDataType === 'quantity'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-indigo-400" />
                    <span>Quantidade</span>
                    <span className="text-[9px] text-slate-500">Numérico / Contador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalDataType('text');
                      setUnit('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      additionalDataType === 'text'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 ring-1 ring-teal-500/30'
                        : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Texto</span>
                    <span className="text-[9px] text-slate-500">Descreva o fato</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalDataType('scale');
                      setUnit('estrelas');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      additionalDataType === 'scale'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-[#16161a] border-[#2e2e36] text-slate-400'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Escala</span>
                    <span className="text-[9px] text-slate-500">1 a 5</span>
                  </button>
                </div>
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Ícone
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIconName(ic)}
                      className={`p-2 rounded-xl border transition-all ${
                        iconName === ic
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-[#16161a] border-[#2e2e36] text-slate-400 hover:text-white'
                      }`}
                    >
                      {getIndicatorIcon(ic, 'w-4 h-4')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950"
                >
                  {isCreating ? 'Salvar Novo Indicador' : 'Confirmar Alterações'}
                </button>
              </div>
            </form>
          ) : (
            /* Indicator List with Reorder, Active Toggle, Edit & Delete */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Lista de Indicadores Ativos & Inativos ({indicators.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Indicador</span>
                </button>
              </div>

              {indicators.map((ind, idx) => {
                const isActive = ind.active !== false;

                return (
                  <div
                    key={ind.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !isActive
                        ? 'opacity-50 bg-[#0c0c0f] border-[#1e293b]'
                        : 'bg-[#111114] hover:bg-[#141418] border-[#222228]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          className="p-1 rounded bg-[#1a1a1e] hover:bg-[#25252b] text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === indicators.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          className="p-1 rounded bg-[#1a1a1e] hover:bg-[#25252b] text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Icon & ID */}
                      <div className="p-2.5 rounded-xl bg-[#1a1a1e] border border-[#2e2e36] text-slate-300">
                        {getIndicatorIcon(ind.iconName, 'w-4 h-4')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {ind.id}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                            {ind.category}
                          </span>
                          {ind.additionalDataType === 'money' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Pergunta R$ Gasto/Ganho
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {ind.name}
                        </h4>
                      </div>
                    </div>

                    {/* Weight & Controls */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          ind.weight === 0
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : ind.isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {ind.weight === 0 ? '0 pts' : ind.isPositive ? `+${ind.weight} pts` : `-${ind.weight} pts`}
                      </span>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(ind.id)}
                        className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] border border-[#2e2e36]"
                        title={isActive ? 'Desativar este hábito' : 'Ativar este hábito'}
                      >
                        {isActive ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <ToggleRight className="w-4 h-4" /> Ativo
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <ToggleLeft className="w-4 h-4" /> Inativo
                          </span>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(ind)}
                        className="p-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] text-slate-300 hover:text-white border border-[#2e2e36]"
                        title="Editar Indicador"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(ind.id)}
                        className="p-1.5 rounded-lg bg-[#1a1a1e] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2e2e36]"
                        title="Excluir Indicador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e293b] bg-[#0d0d10] flex items-center justify-between text-xs text-slate-400">
          <span>
            {indicators.filter((i) => i.active !== false).length} de {indicators.length} indicadores ativos pontuando no score diário.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
