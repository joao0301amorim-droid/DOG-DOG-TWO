import React, { useState, useMemo } from 'react';
import { DailyLog, Indicator, ScoreTier } from '../types';
import { SCORE_TIERS } from '../data/defaultIndicators';
import { formatCurrencyBRL } from '../utils/scoreCalculator';
import { exportLogsToCSV, exportAllDataJSON } from '../utils/storage';
import {
  Table as TableIcon,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Eye,
  Trash2,
} from 'lucide-react';

interface SpreadsheetViewProps {
  logs: DailyLog[];
  indicators: Indicator[];
  onSelectDate: (date: string) => void;
  onDeleteLog?: (logId: string) => void;
  onOpenSpreadsheetModal?: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  logs,
  indicators,
  onSelectDate,
  onDeleteLog,
  onOpenSpreadsheetModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<DailyLog | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Search term in date, dayOfWeek, observation
        const matchesSearch =
          searchTerm === '' ||
          log.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.observation || '').toLowerCase().includes(searchTerm.toLowerCase());

        // Tier filter
        const matchesTier =
          selectedTierFilter === 'all' || log.tier === selectedTierFilter;

        return matchesSearch && matchesTier;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // descending date
  }, [logs, searchTerm, selectedTierFilter]);

  // Aggregate stats
  const totalMoney = useMemo(() => {
    return logs.reduce((sum, l) => {
      const val = Number(l.moneyEarned ?? l.values['H05'] ?? l.values['ind_money'] ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [logs]);

  const avgScore = useMemo(() => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, l) => acc + l.score, 0);
    return Math.round(sum / logs.length);
  }, [logs]);

  const idealDays = useMemo(() => {
    return logs.filter((l) => l.score >= 70).length;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Planilha & Banco de Indicadores</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Dados consolidados dia a dia com pontuações, ganhos de valor e observações.
          </p>
        </div>

        {/* Export CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenSpreadsheetModal && (
            <button
              id="open-spreadsheet-link-modal-btn"
              onClick={onOpenSpreadsheetModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1a1e] hover:bg-[#25252b] text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Janela de Registro & Vínculo</span>
            </button>
          )}

          <button
            id="export-csv-btn"
            onClick={() => exportLogsToCSV(logs, indicators)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>

          <button
            id="export-json-backup-btn"
            onClick={() => exportAllDataJSON(logs, indicators)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            title="Backup JSON"
          >
            <span>Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Faturado Anotado
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums block mt-1">
            {formatCurrencyBRL(totalMoney)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Média Geral do Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono tabular-nums">
              {avgScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Dias de Alta Performance
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-indigo-400 font-mono tabular-nums">
              {idealDays}
            </span>
            <span className="text-xs text-slate-400">de {logs.length} dias ({Math.round((idealDays / (logs.length || 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Registros na Planilha
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-200 font-mono tabular-nums block mt-1">
            {logs.length} dias
          </span>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#111114] border border-[#1e293b]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="spreadsheet-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por data, dia da semana ou observação..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="spreadsheet-tier-filter-select"
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todas as Faixas de Score</option>
            <option value="titanium">🏆 Mindset Titânio (85-100)</option>
            <option value="high_performance">🚀 Foco & Consistência (70-84)</option>
            <option value="consistent">⚡ Progresso Constante (55-69)</option>
            <option value="neutral">⚠️ Zona de Oscilação (40-54)</option>
            <option value="warning">🛑 Desvio / Alerta (25-39)</option>
            <option value="critical">🚨 Crítico / Sabotagem (0-24)</option>
          </select>
        </div>
      </div>

      {/* 3. Interactive Data Table (Spreadsheet Grid) */}
      <div className="rounded-2xl border border-[#1e293b] bg-[#111114] overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {/* Table Header */}
            <thead className="sticky top-0 z-20 bg-[#0d0d10] text-slate-400 font-semibold border-b border-[#1e293b] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Data / Dia</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Score</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Faixa de Mindset</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Ganho Financeiro</th>
                {/* Dynamically list top indicators */}
                {indicators
                  .filter((i) => i.id !== 'ind_money')
                  .slice(0, 5)
                  .map((ind) => (
                    <th key={ind.id} className="py-3.5 px-3 text-center whitespace-nowrap">
                      {ind.name.split('?')[0].replace('hoje', '').trim()}
                    </th>
                  ))}
                <th className="py-3.5 px-4 min-w-[220px]">Observações / Memórias do Dia</th>
                <th className="py-3.5 px-3 text-center">Ações</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const tier = SCORE_TIERS[log.tier] || SCORE_TIERS.neutral;
                  const money = Number(log.moneyEarned ?? log.values['ind_money'] ?? 0);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#16161b] transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogDetail(log)}
                    >
                      {/* Date & Day */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-white">
                        <div className="flex flex-col">
                          <span className="font-mono">{log.date}</span>
                          <span className="text-[11px] text-slate-400">{log.dayOfWeek}</span>
                        </div>
                      </td>

                      {/* Score Gauge Chip */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm bg-[#080809] text-white border border-[#1e293b] font-mono tabular-nums">
                          {log.score}
                        </span>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${tier.bgColor} ${tier.textColor} border ${tier.borderColor}`}
                        >
                          <span>{tier.emoji}</span>
                          <span className="truncate max-w-[130px]">{tier.label.split('(')[0].trim()}</span>
                        </span>
                      </td>

                      {/* Money Earned */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold font-mono tabular-nums ${
                            money > 0 ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {formatCurrencyBRL(money)}
                        </span>
                      </td>

                      {/* Top 5 Indicator values */}
                      {indicators
                        .filter((i) => i.id !== 'ind_money')
                        .slice(0, 5)
                        .map((ind) => {
                          const val = log.values[ind.id];
                          return (
                            <td key={ind.id} className="py-3 px-3 text-center whitespace-nowrap">
                              {ind.type === 'boolean' ? (
                                val === true ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1e293b]/40 text-slate-500">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </span>
                                )
                              ) : (
                                <span className="font-semibold text-xs text-slate-200 font-mono">
                                  {val || 0} {ind.unit}
                                </span>
                              )}
                            </td>
                          );
                        })}

                      {/* Observations */}
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-300 line-clamp-2 max-w-md">
                          {log.observation || <span className="text-slate-500 italic">Sem anotações</span>}
                        </p>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`edit-day-btn-${log.date}`}
                            onClick={() => onSelectDate(log.date)}
                            className="p-2 rounded-lg bg-[#080809] hover:bg-indigo-600/20 text-indigo-400 border border-[#1e293b] hover:border-indigo-500/50 transition-colors"
                            title="Editar no painel de coleta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onDeleteLog && (
                            <button
                              id={`delete-log-btn-${log.id}`}
                              onClick={() => onDeleteLog(log.id)}
                              className="p-2 rounded-lg bg-[#080809] hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-[#1e293b] hover:border-rose-800 transition-colors"
                              title="Excluir registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Modal when clicking a row */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            id="spreadsheet-log-detail-modal"
            className="w-full max-w-lg rounded-2xl bg-[#111114] border border-[#1e293b] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {selectedLogDetail.dayOfWeek}, {selectedLogDetail.date}
                </span>
                <h4 className="text-lg font-bold text-white">Detalhes do Registro</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {selectedLogDetail.score}<span className="text-xs text-slate-400">/100</span>
                </span>
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080809] border border-[#1e293b]">
                <span className="text-xs font-bold text-slate-300">Ganho Financeiro Lançado:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {formatCurrencyBRL(Number(selectedLogDetail.moneyEarned || selectedLogDetail.values['ind_money'] || 0))}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080809] border border-[#1e293b]">
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  Observações e Memórias:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedLogDetail.observation || 'Nenhuma observação registrada neste dia.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e293b] flex justify-end gap-2">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onSelectDate(selectedLogDetail.date);
                  setSelectedLogDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Abrir no Painel de Ações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
