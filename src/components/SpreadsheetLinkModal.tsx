import React, { useState } from 'react';
import { Indicator, DailyLog } from '../types';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import { exportLogsToCSV } from '../utils/storage';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Sparkles,
} from 'lucide-react';

interface SpreadsheetLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  onToggleIndicatorActive: (id: string) => void;
  currentValues: Record<string, boolean | number>;
  selectedDate: string;
  dayOfWeek: string;
  score: number;
  allLogs: DailyLog[];
}

export const SpreadsheetLinkModal: React.FC<SpreadsheetLinkModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicatorActive,
  currentValues,
  selectedDate,
  dayOfWeek,
  score,
  allLogs,
}) => {
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedTableSuccess, setCopiedTableSuccess] = useState(false);

  if (!isOpen) return null;

  // Generate tab-delimited text ready to paste directly into Google Sheets or Excel
  const handleCopyTableToClipboard = () => {
    const headers = ['ID_Habito', 'Nome_Habito', 'Pontos', 'Categoria', 'Ativo', 'Status_Hoje', 'Impacto_Score'];
    const rows = indicators.map((ind) => {
      const val = currentValues[ind.id];
      const isActive = ind.active !== false;
      const status =
        ind.type === 'boolean'
          ? val === true
            ? 'CONCLUÍDO'
            : 'NÃO CONCLUÍDO'
          : `${val || 0} ${ind.unit || ''}`;

      let impacto = '0 pts';
      if (isActive) {
        if (ind.isPositive) {
          if (val === true || (typeof val === 'number' && val > 0)) {
            impacto = `+${ind.weight} pts`;
          }
        } else {
          if (val === true || (typeof val === 'number' && val > 0)) {
            impacto = `-${ind.weight} pts (Penalidade)`;
          }
        }
      } else {
        impacto = 'Inativo (0 pts)';
      }

      return [ind.id, ind.name, ind.isPositive ? ind.weight : -ind.weight, ind.category, isActive ? 'TRUE' : 'FALSE', status, impacto].join('\t');
    });

    const fullText = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedTableSuccess(true);
    setTimeout(() => setCopiedTableSuccess(false), 2500);
  };

  const handleCopySpreadsheetFormula = () => {
    const formula = `=QUERY(IMPORTDATA("mindset_score_planilha.csv"); "SELECT *")`;
    navigator.clipboard.writeText(formula);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="spreadsheet-link-modal"
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111114] border border-[#1e293b] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Controle & Sincronização
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  Score Atual: {score}/100
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Registro de Indicadores & Vínculo com Planilha
              </h3>
            </div>
          </div>

          <button
            id="close-spreadsheet-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#1a1a1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Date Record Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#080809] border border-[#1e293b]">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-slate-500">Data ativa:</span>
            <span className="font-bold text-indigo-400">{dayOfWeek}, {selectedDate}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-table-clipboard-btn"
              onClick={handleCopyTableToClipboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1a1e] hover:bg-[#25252b] text-slate-200 hover:text-white text-xs font-mono font-bold border border-[#2e2e36] transition-all active:scale-95 shadow-sm"
            >
              {copiedTableSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado para Google Sheets!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Tabela (Colar no Sheets/Excel)</span>
                </>
              )}
            </button>

            <button
              id="export-csv-modal-btn"
              onClick={() => exportLogsToCSV(allLogs, indicators)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all active:scale-95 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Planilha CSV</span>
            </button>
          </div>
        </div>

        {/* Indicator Registry Table (Exact user schema H01..H07) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider">
              Tabela de Indicadores & Pontuação
            </span>
            <span>Clique em Ativo/Inativo para calibrar a regra</span>
          </div>

          <div className="rounded-2xl border border-[#1e293b] bg-[#080809] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-[#0f0f13] text-slate-400 font-bold border-b border-[#1e293b] text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">ID_Habito</th>
                    <th className="py-3 px-3.5">Nome_Habito</th>
                    <th className="py-3 px-3.5 text-center">Pontos</th>
                    <th className="py-3 px-3.5">Categoria</th>
                    <th className="py-3 px-3.5 text-center">Ativo</th>
                    <th className="py-3 px-3.5 text-center">Status Hoje</th>
                    <th className="py-3 px-3.5 text-right">Impacto no Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                  {indicators.map((ind) => {
                    const val = currentValues[ind.id];
                    const isActive = ind.active !== false;
                    const isChecked = ind.type === 'boolean' ? val === true : Number(val || 0) > 0;

                    return (
                      <tr
                        key={ind.id}
                        className={`hover:bg-[#131317] transition-colors ${
                          !isActive ? 'opacity-50 bg-[#0a0a0d]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-bold text-indigo-400 whitespace-nowrap">
                          {ind.id}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-white">
                          {ind.name}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              ind.isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {ind.isPositive ? `+${ind.weight}` : `-${ind.weight}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-[#1a1a1e] text-slate-400 border border-[#2e2e36]">
                            {ind.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => onToggleIndicatorActive(ind.id)}
                            className="inline-flex items-center gap-1 font-bold text-xs hover:opacity-80 transition-all"
                          >
                            {isActive ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <ToggleRight className="w-4 h-4" /> TRUE
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <ToggleLeft className="w-4 h-4" /> FALSE
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          {ind.type === 'boolean' ? (
                            isChecked ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                SIM
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#1a1a1e] text-slate-500">
                                NÃO
                              </span>
                            )
                          ) : (
                            <span className="font-bold text-emerald-400 font-mono">
                              {formatCurrencyBRL(Number(val || 0))}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          {!isActive ? (
                            <span className="text-slate-500">Inativo (0 pts)</span>
                          ) : ind.isPositive ? (
                            isChecked ? (
                              <span className="text-emerald-400 font-bold">+{ind.weight} pts</span>
                            ) : (
                              <span className="text-slate-500">0 pts</span>
                            )
                          ) : isChecked ? (
                            <span className="text-rose-400 font-bold">-{ind.weight} pts (Desvio)</span>
                          ) : (
                            <span className="text-slate-400">0 pts (Blindado)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Spreadsheet Linking Instructions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0c10] border border-[#1e293b] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Como vincular e usar no Google Sheets / Microsoft Excel:
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-[#080809] border border-[#1e293b] space-y-1">
              <span className="font-bold text-indigo-400 block font-mono">Opção 1: Colar Direto</span>
              <p className="text-slate-400 leading-relaxed">
                Clique no botão <strong>"Copiar Tabela"</strong> acima, abra sua planilha no Google Sheets e pressione <strong>Ctrl+V</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080809] border border-[#1e293b] space-y-1">
              <span className="font-bold text-emerald-400 block font-mono">Opção 2: Exportação CSV</span>
              <p className="text-slate-400 leading-relaxed">
                Clique em <strong>"Baixar Planilha CSV"</strong>. O arquivo vem pronto no formato UTF-8 compatível com Excel e Sheets.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080809] border border-[#1e293b] space-y-1">
              <span className="font-bold text-teal-400 block font-mono">Opção 3: Histórico Automático</span>
              <p className="text-slate-400 leading-relaxed">
                Cada dia salvo no botão verde é acumulado na aba <strong>"Planilha"</strong> com cálculo de médias e consistência semanal.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="close-spreadsheet-modal-bottom-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Concluir & Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
