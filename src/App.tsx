import React, { useState, useEffect, useMemo } from 'react';
import { Indicator, DailyLog, ScoreTier } from './types';
import { loadIndicators, saveIndicators, loadDailyLogs, saveDailyLogs } from './utils/storage';
import { calculateDailyScore, getDayOfWeekName } from './utils/scoreCalculator';
import { SCORE_TIERS } from './data/defaultIndicators';
import { Navbar } from './components/Navbar';
import { ScoreBanner } from './components/ScoreBanner';
import { ActionButtonsPanel } from './components/ActionButtonsPanel';
import { SpreadsheetView } from './components/SpreadsheetView';
import { WeeklyAnalysisView } from './components/WeeklyAnalysisView';
import { GeminiCoachView } from './components/GeminiCoachView';
import { AndroidCodeExportView } from './components/AndroidCodeExportView';
import { AddIndicatorModal } from './components/AddIndicatorModal';
import { SpreadsheetLinkModal } from './components/SpreadsheetLinkModal';
import { DatabaseTrackingGuideModal } from './components/DatabaseTrackingGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'actions' | 'spreadsheet' | 'weekly' | 'gemini' | 'android'>('actions');

  // Persistence State
  const [indicators, setIndicators] = useState<Indicator[]>(() => loadIndicators());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => loadDailyLogs());

  // Date Selection (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Current day editing state
  const [currentValues, setCurrentValues] = useState<Record<string, boolean | number>>({});
  const [currentObservation, setCurrentObservation] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [isDatabaseGuideModalOpen, setIsDatabaseGuideModalOpen] = useState(false);

  // Sync with storage on changes
  useEffect(() => {
    saveIndicators(indicators);
  }, [indicators]);

  useEffect(() => {
    saveDailyLogs(dailyLogs);
  }, [dailyLogs]);

  // When selectedDate changes, load existing log if present
  useEffect(() => {
    const existingLog = dailyLogs.find((l) => l.date === selectedDate);
    if (existingLog) {
      setCurrentValues(existingLog.values || {});
      setCurrentObservation(existingLog.observation || '');
    } else {
      // Default empty day
      const defaults: Record<string, boolean | number> = {};
      indicators.forEach((ind) => {
        defaults[ind.id] = ind.defaultValue ?? (ind.type === 'boolean' ? false : 0);
      });
      setCurrentValues(defaults);
      setCurrentObservation('');
    }
  }, [selectedDate, dailyLogs, indicators]);

  // Compute live score for the active date
  const scoreResult = useMemo(() => {
    return calculateDailyScore(currentValues, indicators);
  }, [currentValues, indicators]);

  const currentTierInfo = useMemo(() => {
    return SCORE_TIERS[scoreResult.tier] || SCORE_TIERS.neutral;
  }, [scoreResult.tier]);

  const dayOfWeek = useMemo(() => {
    return getDayOfWeekName(selectedDate);
  }, [selectedDate]);

  // Active indicators count
  const activeIndicatorsCount = useMemo(() => {
    return indicators.filter((i) => i.active !== false).length;
  }, [indicators]);

  // Compute positive & negative counts
  const positiveCompletedCount = useMemo(() => {
    return indicators.filter((i) => {
      if (i.active === false || !i.isPositive || i.id === 'H05' || i.id === 'ind_money') return false;
      const val = currentValues[i.id];
      return i.type === 'boolean' ? Boolean(val) : typeof val === 'number' && val > 0;
    }).length;
  }, [indicators, currentValues]);

  const totalPositiveCount = useMemo(() => {
    return indicators.filter((i) => i.active !== false && i.isPositive && i.id !== 'H05' && i.id !== 'ind_money').length;
  }, [indicators]);

  const negativeTriggeredCount = useMemo(() => {
    return indicators.filter((i) => {
      if (i.active === false || i.isPositive) return false;
      const val = currentValues[i.id];
      return i.type === 'boolean' ? Boolean(val) : typeof val === 'number' && val > 0;
    }).length;
  }, [indicators, currentValues]);

  const moneyEarned = useMemo(() => {
    return Number(currentValues['H05'] ?? currentValues['ind_money'] ?? 0);
  }, [currentValues]);

  // Compute streak
  const streakCount = useMemo(() => {
    const sorted = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (const log of sorted) {
      if (log.score >= 55) streak++;
      else break;
    }
    return streak;
  }, [dailyLogs]);

  // Handlers
  const handleUpdateValue = (indicatorId: string, value: boolean | number) => {
    setCurrentValues((prev) => ({
      ...prev,
      [indicatorId]: value,
    }));
  };

  const handleToggleIndicatorActive = (indicatorId: string) => {
    setIndicators((prev) =>
      prev.map((ind) => {
        if (ind.id === indicatorId) {
          const nextActive = ind.active === false ? true : false;
          return { ...ind, active: nextActive };
        }
        return ind;
      })
    );
  };

  const handleSaveDay = () => {
    const newLog: DailyLog = {
      id: `log-${selectedDate}`,
      date: selectedDate,
      dayOfWeek,
      score: scoreResult.score,
      tier: scoreResult.tier,
      values: { ...currentValues },
      moneyEarned,
      observation: currentObservation,
      validatedAt: new Date().toISOString(),
    };

    setDailyLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== selectedDate);
      return [...filtered, newLog].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const handleAddIndicator = (newInd: Indicator) => {
    setIndicators((prev) => [...prev, newInd]);
  };

  const handleDeleteCustomIndicator = (indId: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== indId));
  };

  const handleDeleteLog = (logId: string) => {
    setDailyLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const handleSelectDateFromOtherViews = (date: string) => {
    setSelectedDate(date);
    setActiveTab('actions');
  };

  return (
    <div className="min-h-screen bg-[#080809] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        currentScore={scoreResult.score}
        currentTierInfo={currentTierInfo}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Render Tab Views */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            {/* Live Score Banner */}
            <ScoreBanner
              score={scoreResult.score}
              tierInfo={currentTierInfo}
              earnedPoints={scoreResult.earnedPoints}
              positivePoints={scoreResult.positivePoints}
              maxPositivePoints={scoreResult.maxPositivePoints}
              penaltyPoints={scoreResult.penaltyPoints}
              activeIndicatorsCount={activeIndicatorsCount}
              totalIndicatorsCount={indicators.length}
              moneyEarned={moneyEarned}
              positiveCompletedCount={positiveCompletedCount}
              totalPositiveCount={totalPositiveCount}
              negativeTriggeredCount={negativeTriggeredCount}
              dateStr={selectedDate}
              dayOfWeek={dayOfWeek}
              streakCount={streakCount}
              onOpenSpreadsheetLink={() => setIsSpreadsheetModalOpen(true)}
            />

            {/* Action Validation Buttons & Value Inputs */}
            <ActionButtonsPanel
              indicators={indicators}
              values={currentValues}
              onUpdateValue={handleUpdateValue}
              onToggleIndicatorActive={handleToggleIndicatorActive}
              observation={currentObservation}
              setObservation={setCurrentObservation}
              onSaveDay={handleSaveDay}
              selectedDate={selectedDate}
              dayOfWeek={dayOfWeek}
              onDeleteCustomIndicator={handleDeleteCustomIndicator}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
              onOpenDatabaseGuideModal={() => setIsDatabaseGuideModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'spreadsheet' && (
          <SpreadsheetView
            logs={dailyLogs}
            indicators={indicators}
            onSelectDate={handleSelectDateFromOtherViews}
            onDeleteLog={handleDeleteLog}
            onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyAnalysisView
            logs={dailyLogs}
            indicators={indicators}
            onOpenGeminiAnalysis={() => setActiveTab('gemini')}
            onSelectDate={handleSelectDateFromOtherViews}
          />
        )}

        {activeTab === 'gemini' && (
          <GeminiCoachView
            logs={dailyLogs}
            indicators={indicators}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'android' && <AndroidCodeExportView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#080809] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Mindset Score & Indicadores Diários — Integrado ao Google Gemini e preparado para Android Studio.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDatabaseGuideModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline"
            >
              Guia de Banco de Dados
            </button>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-400">
              Armazenamento Local & Sincronização em Tempo Real
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddIndicatorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddIndicator={handleAddIndicator}
        existingIndicators={indicators}
      />

      <SpreadsheetLinkModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        indicators={indicators}
        onToggleIndicatorActive={handleToggleIndicatorActive}
        currentValues={currentValues}
        selectedDate={selectedDate}
        dayOfWeek={dayOfWeek}
        score={scoreResult.score}
        allLogs={dailyLogs}
      />

      <DatabaseTrackingGuideModal
        isOpen={isDatabaseGuideModalOpen}
        onClose={() => setIsDatabaseGuideModalOpen(false)}
      />
    </div>
  );
}

