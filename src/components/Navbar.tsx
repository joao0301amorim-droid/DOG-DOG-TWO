import React from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  Table,
  LineChart,
  Bot,
  Smartphone,
  PlusCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ScoreTierInfo } from '../types';

interface NavbarProps {
  activeTab: 'actions' | 'spreadsheet' | 'weekly' | 'gemini' | 'android';
  setActiveTab: (tab: 'actions' | 'spreadsheet' | 'weekly' | 'gemini' | 'android') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  currentScore: number;
  currentTierInfo: ScoreTierInfo;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  currentScore,
  currentTierInfo,
  onOpenAddModal,
}) => {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e293b] bg-[#080809]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-900/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#64748b] font-bold leading-tight">
                Mindset Performance System
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-light text-xl tracking-tight text-white">
                  ScoreMind <span className="text-indigo-400 font-semibold">Alpha</span>
                </span>
                <div className="h-4 w-[1px] bg-[#1e293b] hidden sm:block"></div>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-mono tracking-widest text-[#94a3b8]">
                  Android Engine
                </span>
              </div>
            </div>
          </div>

          {/* Current Day Score Indicator */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-xl bg-[#111114] border border-[#1e293b]">
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-[#64748b] font-bold text-[10px]">
                Score Diário
              </div>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-black font-mono text-indigo-400 tracking-tight">
                  {currentScore}
                </span>
                <span className="text-[10px] text-[#64748b] font-mono">/100</span>
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${currentTierInfo.bgColor} ${currentTierInfo.textColor} border ${currentTierInfo.borderColor}`}
            >
              <span>{currentTierInfo.emoji}</span>
              <span className="truncate max-w-[130px]">{currentTierInfo.label.split('(')[0].trim()}</span>
            </div>
          </div>

          {/* Controls: Date Picker & Add Indicator Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex items-center">
              <input
                id="date-picker-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#1a1a1e] hover:bg-[#222228] text-[#e2e8f0] text-xs sm:text-sm font-mono rounded-lg px-3 py-2 border border-[#2e2e36] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              />
              {!isToday && (
                <button
                  id="go-to-today-btn"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="ml-2 text-xs font-mono text-indigo-400 hover:text-indigo-300 underline underline-offset-2 hidden sm:inline-block"
                >
                  Hoje
                </button>
              )}
            </div>

            <button
              id="add-custom-indicator-nav-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-md shadow-indigo-900/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Indicador</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 border-t border-[#1e293b]">
          <button
            id="tab-action-panel"
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'actions'
                ? 'bg-[#1a1a1e] text-white border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111114]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Coleta & Ações</span>
          </button>

          <button
            id="tab-spreadsheet"
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'spreadsheet'
                ? 'bg-[#1a1a1e] text-white border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111114]'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Planilha & Indicadores</span>
          </button>

          <button
            id="tab-weekly"
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'weekly'
                ? 'bg-[#1a1a1e] text-white border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111114]'
            }`}
          >
            <LineChart className="w-4 h-4 text-indigo-400" />
            <span>Entrelaçamento Semanal</span>
          </button>

          <button
            id="tab-gemini"
            onClick={() => setActiveTab('gemini')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'gemini'
                ? 'bg-[#1a1a1e] text-white border border-teal-500/60 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111114]'
            }`}
          >
            <Bot className="w-4 h-4 text-teal-400" />
            <span className="flex items-center gap-1.5">
              Conversa com Gemini
              <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" />
            </span>
          </button>

          <button
            id="tab-android"
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'android'
                ? 'bg-[#1a1a1e] text-white border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#111114]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Código Android Studio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
