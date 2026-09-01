import React, { useState } from 'react';
import {
  Database,
  Server,
  HardDrive,
  Code2,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Check,
  X,
  Smartphone,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DatabaseTrackingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseTrackingGuideModal: React.FC<DatabaseTrackingGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'sql' | 'android' | 'firebase'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const sqlSchema = `-- Tabela de Indicadores / Hábitos
CREATE TABLE habitos_indicadores (
    id_habito VARCHAR(10) PRIMARY KEY, -- 'H01', 'H02', etc.
    nome_habito VARCHAR(255) NOT NULL,
    pontos INT NOT NULL,               -- +10, -40, +5, etc.
    categoria VARCHAR(50) NOT NULL,    -- 'Sucesso', 'Desvio', 'Saúde', 'Mente'
    ativo BOOLEAN DEFAULT TRUE,
    tipo VARCHAR(20) DEFAULT 'boolean',
    icone VARCHAR(50),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Registros Diários (Histórico e Score)
CREATE TABLE registros_diarios (
    data_registro DATE PRIMARY KEY,     -- '2026-09-01'
    dia_semana VARCHAR(20) NOT NULL,   -- 'Terça-feira'
    score_dia INT NOT NULL,             -- 0 a 100
    faixa_score VARCHAR(50) NOT NULL,  -- 'Mindset Titânio', 'Consistência', etc.
    pontos_positivos INT DEFAULT 0,
    pontos_penalidade INT DEFAULT 0,
    pontos_liquidos INT DEFAULT 0,
    faturamento_h05 NUMERIC(10,2) DEFAULT 0.00,
    observacoes TEXT,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Execução Detalhada por Hábito e Dia
CREATE TABLE execucoes_habitos_dia (
    id SERIAL PRIMARY KEY,
    data_registro DATE REFERENCES registros_diarios(data_registro) ON DELETE CASCADE,
    id_habito VARCHAR(10) REFERENCES habitos_indicadores(id_habito),
    executado BOOLEAN DEFAULT FALSE,
    valor_numerico NUMERIC(10,2) DEFAULT 0.00,
    pontos_gerados INT DEFAULT 0
);`;

  const androidRoomCode = `// Android Studio (Kotlin Room Database Entity)
@Entity(tableName = "registros_diarios")
data class RegistroDiario(
    @PrimaryKey val dataRegistro: String, // "2026-09-01"
    val diaSemana: String,
    val scoreDia: Int,                   // 0 a 100
    val faixaScore: String,
    val h01Planejamento: Boolean = false,
    val h02ComprouHaha: Boolean = false, // Desvio (-40)
    val h03Academia: Boolean = false,    // +5
    val h04AcordouHorario: Boolean = false, // +5
    val h05GanhouDinheiro: Double = 0.0, // +10
    val h06EstudouPraticou: Boolean = false, // +20
    val h07EscolhaEmocao: Boolean = false, // Desvio (-10)
    val observacoes: String = ""
)

@Dao
interface RegistroDiarioDao {
    @Query("SELECT * FROM registros_diarios ORDER BY dataRegistro DESC")
    fun getAllRegistros(): Flow<List<RegistroDiario>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(registro: RegistroDiario)
}`;

  const firebaseSchema = `// Estrutura do Documento no Firestore: /users/{userId}/daily_logs/{date}
{
  "date": "2026-09-01",
  "dayOfWeek": "Terça-feira",
  "score": 85,
  "tier": "Mindset Titânio",
  "positivePoints": 35,
  "penaltyPoints": 0,
  "earnedPoints": 35,
  "indicators": {
    "H01": { "name": "FEZ O SEU PLANEJAMENTO DE ESTUDOS", "active": false, "value": false },
    "H02": { "name": "COMPROU... HAHA", "active": true, "value": false, "points": -40 },
    "H03": { "name": "FOI PARA ACADEMIA", "active": true, "value": true, "points": 5 },
    "H04": { "name": "ACORDOU NO HORARIO", "active": true, "value": true, "points": 5 },
    "H05": { "name": "GANHOU DINHEIRO HOJE", "active": true, "value": 350.00, "points": 10 },
    "H06": { "name": "ESTUDOU OU PRATICOU ALGO NOVO", "active": true, "value": true, "points": 20 },
    "H07": { "name": "TOMOU ESCOLHA NA EMOÇÃO", "active": true, "value": false, "points": -10 }
  },
  "observation": "Treino e estudo com foco total."
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="database-guide-modal"
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111114] border border-[#1e293b] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                Arquitetura de Dados & Persistência
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Como Acompanhar as Informações no Banco de Dados
              </h3>
            </div>
          </div>

          <button
            id="close-db-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#1a1a1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#1e293b] pb-3">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#1a1a1e] text-slate-400 hover:text-white border border-[#2e2e36]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Visão Geral & Como Acompanhar</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#1a1a1e] text-slate-400 hover:text-white border border-[#2e2e36]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>2. Schema SQL (Postgres/SQLite)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'android'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#1a1a1e] text-slate-400 hover:text-white border border-[#2e2e36]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3. Android Studio (Room Kotlin)</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'firebase'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#1a1a1e] text-slate-400 hover:text-white border border-[#2e2e36]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>4. Firebase / NoSQL</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'architecture' && (
          <div className="space-y-4 text-xs leading-relaxed text-slate-300">
            <div className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Como os seus dados já estão sendo gravados e acompanhados:</span>
              </h4>
              <p className="text-slate-400">
                O aplicativo já possui <strong>Persistência Local Automática</strong> via navegador. Cada vez que você clica em <strong>"Salvar & Atualizar Planilha do Dia"</strong>, os dados do dia são gravados e o histórico semanal é recalculado instantaneamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] space-y-2">
                <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                  Camada 1: Planilha Visual
                </div>
                <h5 className="text-sm font-bold text-white">Google Sheets / CSV</h5>
                <p className="text-slate-400">
                  Ideal para você analisar em gráficos, ver tabelas dinâmicas e compartilhar relatórios. Você pode exportar o CSV com 1 clique ou colar direto.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] space-y-2">
                <div className="p-2 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[10px]">
                  Camada 2: Banco Local
                </div>
                <h5 className="text-sm font-bold text-white">LocalStorage / Room</h5>
                <p className="text-slate-400">
                  Armazena tudo no próprio dispositivo (offline-first). Não depende de internet para registrar a pontuação ou calcular o score.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] space-y-2">
                <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 font-mono font-bold text-[10px]">
                  Camada 3: Banco Cloud
                </div>
                <h5 className="text-sm font-bold text-white">PostgreSQL ou Firebase</h5>
                <p className="text-slate-400">
                  Permite sincronizar entre o seu app no celular Android e o computador em tempo real, além de alimentar a IA Gemini para análises avançadas.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-slate-300">
              <span className="font-bold text-indigo-400 block mb-1">Deseja conectar um banco de dados real na nuvem agora?</span>
              Podemos provisionar um banco de dados <strong>Firestore</strong> ou <strong>PostgreSQL</strong> diretamente na sua conta, bastando você solicitar quando desejar sincronização multi-dispositivo!
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Script DDL completo para PostgreSQL / MySQL / SQLite:
              </span>
              <button
                onClick={() => handleCopy(sqlSchema, 'sql')}
                className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] text-indigo-300 border border-[#2e2e36] transition-all"
              >
                {copiedCode === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] text-indigo-200 font-mono text-xs overflow-x-auto leading-relaxed">
              {sqlSchema}
            </pre>
          </div>
        )}

        {activeTab === 'android' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Código Kotlin para o seu aplicativo no Android Studio (Room Database):
              </span>
              <button
                onClick={() => handleCopy(androidRoomCode, 'android')}
                className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] text-indigo-300 border border-[#2e2e36] transition-all"
              >
                {copiedCode === 'android' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Kotlin</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {androidRoomCode}
            </pre>
          </div>
        )}

        {activeTab === 'firebase' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Estrutura de Coleção e Documento JSON para Cloud Firestore / Firebase:
              </span>
              <button
                onClick={() => handleCopy(firebaseSchema, 'firebase')}
                className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#25252b] text-indigo-300 border border-[#2e2e36] transition-all"
              >
                {copiedCode === 'firebase' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-[#080809] border border-[#1e293b] text-purple-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {firebaseSchema}
            </pre>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
