import React, { useState } from 'react';
import { DailyLog, Indicator, ChatMessage } from '../types';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  BrainCircuit,
  TrendingUp,
  AlertOctagon,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface GeminiCoachViewProps {
  logs: DailyLog[];
  indicators: Indicator[];
  selectedDate: string;
}

export const GeminiCoachView: React.FC<GeminiCoachViewProps> = ({
  logs,
  indicators,
  selectedDate,
}) => {
  // Mindset Diagnosis State
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Interactive Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'gemini',
      text: 'Olá! Sou o seu Coach de Mindset Score com Gemini. Estou conectado à sua planilha diária, histórico de ações e notas. Posso te dizer se você está progredindo ou se prejudicando, correlacionar seus ganhos com seus hábitos ou sugerir novos botões de indicadores para o seu dia a dia. Como posso te ajudar agora?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const quickQuestions = [
    'Estou progredindo ou me prejudicando esta semana?',
    'Qual a correlação entre minhas ações e os ganhos financeiros?',
    'O que as minhas observações anotadas revelam sobre meu mindset?',
    'Sugira 3 novos botões de ação para minha evolução pessoal.',
  ];

  // Run full trajectory diagnosis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/ai/analyze-mindset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs,
          indicators,
          period: 'Últimos 7 a 14 dias',
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysisError(data.error || 'Erro ao gerar análise do Gemini.');
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError('Falha ao conectar com o servidor Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send message to interactive chat
  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || isChatting) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsChatting(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages,
          contextData: {
            totalLogs: logs.length,
            recentLogs: logs.slice(-7),
            indicators: indicators.map((i) => ({ name: i.name, category: i.category, weight: i.weight })),
            selectedDate,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao conectar ao serviço.');
      }

      const botMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: data.reply || 'Aqui está a orientação solicitada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: err?.message || 'O servidor de IA está com alta demanda momentânea. Por favor, tente novamente em instantes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Conversa & Diagnóstico com o Gemini
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  gemini-3.7-flash
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                O Gemini lê sua planilha, correlaciona suas notas, ganhos financeiros e botões de ação para avaliar sua evolução real.
              </p>
            </div>
          </div>

          <button
            id="run-ai-diagnosis-cta"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all self-start md:self-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando Diagnóstico...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Diagnóstico da Semana</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Full AI Analysis Section (If generated) */}
      {analysis && (
        <div
          id="gemini-deep-analysis-result"
          className="rounded-2xl bg-[#111114] border border-indigo-500/40 p-5 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <BrainCircuit className="w-5 h-5" />
              <span>Diagnóstico de Trajetória & Mindset</span>
            </div>
            <button
              onClick={handleRunAnalysis}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalcular</span>
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {analysis}
          </div>
        </div>
      )}

      {analysisError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 flex-shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* 3. Interactive Chat Interface */}
      <div className="rounded-2xl bg-[#111114] border border-[#1e293b] p-5 sm:p-6 shadow-xl flex flex-col h-[550px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h4 className="text-base font-bold text-white">
              Chat Interativo com o Gemini Coach
            </h4>
          </div>
          <span className="text-xs text-slate-400">Contexto da Planilha Ativo</span>
        </div>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1 rounded-lg bg-[#080809] hover:bg-[#16161b] text-indigo-300 text-xs whitespace-nowrap border border-[#1e293b] hover:border-indigo-500/40 transition-all flex-shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 py-2">
          {messages.map((msg) => {
            const isBot = msg.sender === 'gemini';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-[#080809] border border-[#1e293b] text-slate-200'
                      : 'bg-indigo-600 text-white shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`text-[10px] block mt-1 text-right font-mono ${
                      isBot ? 'text-slate-500' : 'text-indigo-200'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isChatting && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#080809] border border-[#1e293b] rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                <span>Gemini está analisando seus dados...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-3 border-t border-[#1e293b] flex items-center gap-2"
        >
          <input
            id="chat-input-field"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pergunte ao Gemini sobre seu progresso, hábitos, ou peça sugestões de botões..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#080809] border border-[#1e293b] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
          />

          <button
            id="send-chat-btn"
            type="submit"
            disabled={isChatting || !inputMessage.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
