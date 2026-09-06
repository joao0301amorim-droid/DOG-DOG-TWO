import React, { useState, useRef } from 'react';
import { Indicator, DailyLog, Goal } from '../types';
import { parseImportJSON, parseCSVToLogs, ParsedImportData } from '../utils/storage';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Calendar,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  onImportSuccess: (imported: {
    logs?: DailyLog[];
    indicators?: Indicator[];
    goals?: Goal[];
    mode: 'merge' | 'replace';
  }) => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [pastedContent, setPastedContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('O arquivo selecionado está vazio.');
        }

        if (selectedFile.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const res = parseImportJSON(text);
          if (res.summary.logsCount === 0 && res.summary.indicatorsCount === 0 && res.summary.goalsCount === 0) {
            throw new Error('Nenhum dado compatível (registros, indicadores ou metas) foi encontrado no arquivo JSON.');
          }
          setParsedData(res);
        } else if (selectedFile.name.endsWith('.csv') || text.includes(';')) {
          const res = parseCSVToLogs(text, indicators);
          if (res.summary.logsCount === 0) {
            throw new Error('Nenhuma linha de registro diário válida foi encontrada no CSV.');
          }
          setParsedData(res);
        } else {
          throw new Error('Formato não reconhecido. Por favor envie um arquivo .json ou .csv.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao processar o arquivo.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo.');
    };
    reader.readAsText(selectedFile);
  };

  const handlePastedContentChange = (text: string) => {
    setPastedContent(text);
    setErrorMessage(null);
    setParsedData(null);

    if (!text.trim()) return;

    try {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const res = parseImportJSON(text);
        if (res.summary.logsCount === 0 && res.summary.indicatorsCount === 0 && res.summary.goalsCount === 0) {
          throw new Error('Nenhum dado compatível encontrado no JSON colado.');
        }
        setParsedData(res);
      } else if (text.includes(';')) {
        const res = parseCSVToLogs(text, indicators);
        if (res.summary.logsCount === 0) {
          throw new Error('Nenhuma linha de registro diário encontrada no CSV.');
        }
        setParsedData(res);
      } else {
        throw new Error('O texto colado deve ser um JSON válido ou linhas de CSV separadas por ponto e vírgula (;).');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar o conteúdo.');
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    setIsProcessing(true);
    try {
      onImportSuccess({
        logs: parsedData.logs,
        indicators: parsedData.indicators,
        goals: parsedData.goals,
        mode: importMode,
      });

      setIsSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
      });

      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('Falha ao aplicar os dados importados: ' + err.message);
    }
  };

  const handleDownloadSampleJSON = () => {
    const sample = {
      exportedAt: new Date().toISOString(),
      indicators: [
        {
          id: 'H01',
          name: 'ESTUDOU 1H DE HARD SKILLS?',
          weight: 15,
          isPositive: true,
          category: 'DISCIPLINA',
          type: 'boolean',
          iconName: 'BookOpen',
        },
        {
          id: 'H05',
          name: 'GANHOU DINHEIRO HOJE?',
          weight: 10,
          isPositive: true,
          category: 'FINANCEIRO',
          type: 'numeric',
          unit: 'R$',
          iconName: 'DollarSign',
        },
      ],
      goals: [
        {
          id: 'goal-sample-01',
          monthKey: '2026-09',
          name: 'Guardar R$ 850 no Mês',
          type: 'financial',
          priority: 'PRINCIPAL',
          targetValue: 850,
          currentValue: 300,
          unit: 'R$',
          status: 'active',
          autoSyncFinancial: true,
          notes: 'Foco no faturamento líquido',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      logs: [
        {
          id: 'log-2026-09-01',
          date: '2026-09-01',
          dayOfWeek: 'Terça-feira',
          score: 85,
          tier: 'high',
          values: { H01: true, H05: 150 },
          moneyEarned: 150,
          moneySpent: 0,
          observation: 'Dia produtivo com estudo e vendas.',
          validatedAt: new Date().toISOString(),
        },
      ],
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_score_mind.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        id="import-data-modal"
        className="relative w-full max-w-2xl rounded-3xl bg-[#111114] border border-[#2e2e36] shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e293b] bg-[#16161b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400 block">
                Sincronização & Backup
              </span>
              <h3 className="text-xl font-black text-white">Importar Dados do Sistema</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#25252b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Tabs: Upload Arquivo vs Colar JSON */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#080809] border border-[#2e2e36]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#1a1a20] text-white shadow-sm border border-[#3e3e4a]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Enviar Arquivo (.JSON ou .CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'paste'
                  ? 'bg-[#1a1a20] text-white shadow-sm border border-[#3e3e4a]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Colar JSON Diretamente</span>
            </button>
          </div>

          {/* Mode Selector (Merge vs Replace) */}
          <div className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
              Modo de Importação:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'merge'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#111114] border-[#2e2e36] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">Mesclar com os dados atuais</span>
                  {importMode === 'merge' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Adiciona novos registros e atualiza os coincidentes. Mantém os dados que não estiverem no arquivo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'replace'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                    : 'bg-[#111114] border-[#2e2e36] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">Substituir tudo (Restauração)</span>
                  {importMode === 'replace' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Substitui completamente os registros, indicadores e metas pelos dados contidos no arquivo importado.
                </p>
              </button>
            </div>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[#2e2e36] hover:border-indigo-500/80 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-[#080809] hover:bg-[#0c0c10] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Arraste e solte o arquivo aqui, ou clique para selecionar
                </h4>
                <p className="text-xs text-slate-400">
                  Suporta arquivos de backup <span className="font-mono text-indigo-300">.json</span> ou exportações <span className="font-mono text-emerald-300">.csv</span>
                </p>

                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16161b] border border-[#2e2e36] text-xs font-mono text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{file.name}</span>
                    <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paste JSON */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Cole o conteúdo JSON abaixo:
              </label>
              <textarea
                rows={5}
                value={pastedContent}
                onChange={(e) => handlePastedContentChange(e.target.value)}
                placeholder='Ex: { "exportedAt": "...", "logs": [ { "date": "2026-09-01", ... } ], "goals": [ ... ] }'
                className="w-full p-3.5 rounded-2xl bg-[#080809] text-white font-mono text-xs border border-[#2e2e36] focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-bold block">Falha na leitura dos dados:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {parsedData && !errorMessage && (
            <div className="p-4 rounded-2xl bg-[#0e1814] border border-emerald-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dados Validados com Sucesso</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#080809] border border-emerald-500/20">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Dias / Logs</span>
                  <span className="text-lg font-black font-mono text-emerald-300">
                    {parsedData.summary.logsCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080809] border border-emerald-500/20">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Indicadores</span>
                  <span className="text-lg font-black font-mono text-indigo-300">
                    {parsedData.summary.indicatorsCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080809] border border-emerald-500/20">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Metas Mensais</span>
                  <span className="text-lg font-black font-mono text-amber-300">
                    {parsedData.summary.goalsCount}
                  </span>
                </div>
              </div>

              {parsedData.summary.dateRange && (
                <div className="text-xs font-mono text-slate-300 flex items-center justify-between px-1">
                  <span className="text-slate-400">Intervalo de datas:</span>
                  <span className="font-semibold text-emerald-300">
                    {parsedData.summary.dateRange.start} até {parsedData.summary.dateRange.end}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer controls & Model download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={handleDownloadSampleJSON}
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar arquivo modelo JSON</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-[#1a1a1e] transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="confirm-import-data-btn"
                disabled={!parsedData || isProcessing}
                onClick={handleConfirmImport}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                  !parsedData || isProcessing
                    ? 'bg-[#1a1a20] text-slate-500 cursor-not-allowed border border-[#2e2e36]'
                    : isSuccess
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Importado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Confirmar Importação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
