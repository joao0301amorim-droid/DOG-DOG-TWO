import React, { useState, useEffect, useMemo } from 'react';
import { Indicator, DailyLog, ScoreTier, MonthlyGoal } from './types';
import {
  loadIndicators,
  saveIndicators,
  loadDailyLogs,
  saveDailyLogs,
  loadSavedGoals,
  saveMonthlyGoals,
} from './utils/storage';
import { calculateDailyScore, getDayOfWeekName } from './utils/scoreCalculator';
import { SCORE_TIERS } from './data/defaultIndicators';
import { Navbar } from './components/Navbar';
import { ScoreBanner } from './components/ScoreBanner';
import { ActionButtonsPanel } from './components/ActionButtonsPanel';
import { GoalsView } from './components/GoalsView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { WeeklyAnalysisView } from './components/WeeklyAnalysisView';
import { GeminiCoachView } from './components/GeminiCoachView';
import { AndroidCodeExportView } from './components/AndroidCodeExportView';
import { AddIndicatorModal } from './components/AddIndicatorModal';
import { SpreadsheetLinkModal } from './components/SpreadsheetLinkModal';
import { DatabaseTrackingGuideModal } from './components/DatabaseTrackingGuideModal';
import { IndicatorManagerModal } from './components/IndicatorManagerModal';
import { ImportDataModal } from './components/ImportDataModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'actions' | 'goals' | 'spreadsheet' | 'weekly' | 'gemini' | 'android'>('actions');

  // Persistence State
  const [indicators, setIndicators] = useState<Indicator[]>(() => loadIndicators());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => loadDailyLogs());
  const [goals, setGoals] = useState<MonthlyGoal[]>(() => loadSavedGoals());

  // Date Selection (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Current day editing state
  const [currentValues, setCurrentValues] = useState<Record<string, boolean | number>>({});
  const [currentMoneySpent, setCurrentMoneySpent] = useState<number>(0);
  const [currentSpentDetails, setCurrentSpentDetails] = useState<Record<string, number>>({});
  const [currentTextValues, setCurrentTextValues] = useState<Record<string, string>>({});
  const [currentObservation, setCurrentObservation] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [isDatabaseGuideModalOpen, setIsDatabaseGuideModalOpen] = useState(false);
  const [isIndicatorManagerOpen, setIsIndicatorManagerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync with storage on changes
  useEffect(() => {
    saveIndicators(indicators);
  }, [indicators]);

  useEffect(() => {
    saveDailyLogs(dailyLogs);
  }, [dailyLogs]);

  useEffect(() => {
    saveMonthlyGoals(goals);
  }, [goals]);

  // When selectedDate changes, load existing log if present
  useEffect(() => {
    const existingLog = dailyLogs.find((l) => l.date === selectedDate);
    if (existingLog) {
      setCurrentValues(existingLog.values || {});
      const spentTotal = Number(existingLog.moneySpent ?? existingLog.spentDetails?.['H02'] ?? 0);
      setCurrentMoneySpent(spentTotal);
      setCurrentSpentDetails(existingLog.spentDetails || (spentTotal > 0 ? { H02: spentTotal } : {}));
      setCurrentTextValues(existingLog.textValues || {});
      setCurrentObservation(existingLog.observation || '');
    } else {
      // Default empty day
      const defaults: Record<string, boolean | number> = {};
      indicators.forEach((ind) => {
        defaults[ind.id] = ind.defaultValue ?? (ind.type === 'boolean' ? false : 0);
      });
      setCurrentValues(defaults);
      setCurrentMoneySpent(0);
      setCurrentSpentDetails({});
      setCurrentTextValues({});
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

  const handleUpdateMoneySpent = (amount: number, indicatorId = 'H02') => {
    setCurrentSpentDetails((prev) => {
      const updated = { ...prev, [indicatorId]: amount };
      // Sum all spent details safely
      const total = Object.values(updated).reduce<number>((acc, curr) => acc + (Number(curr) || 0), 0);
      setCurrentMoneySpent(total);
      return updated;
    });
  };

  const handleUpdateTextValue = (indicatorId: string, text: string) => {
    setCurrentTextValues((prev) => ({
      ...prev,
      [indicatorId]: text,
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
      moneySpent: currentMoneySpent,
      spentDetails: { ...currentSpentDetails },
      textValues: { ...currentTextValues },
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

  // Goal Handlers & Priority Swap
  const handleSaveGoal = (goalToSave: MonthlyGoal) => {
    setGoals((prev) => {
      let updated = [...prev];
      // If saving as PRINCIPAL, ensure only 1 PRINCIPAL exists for this monthKey
      if (goalToSave.priority === 'PRINCIPAL') {
        updated = updated.map((g) => {
          if (g.monthKey === goalToSave.monthKey && g.id !== goalToSave.id && g.priority === 'PRINCIPAL') {
            return { ...g, priority: 'ALTA' as any, updatedAt: new Date().toISOString() };
          }
          return g;
        });
      }
      const index = updated.findIndex((g) => g.id === goalToSave.id);
      if (index !== -1) {
        updated[index] = goalToSave;
      } else {
        updated.push(goalToSave);
      }
      return updated;
    });
  };

  const handleSwapPrimaryGoal = (monthKey: string, newPrimaryGoalId: string) => {
    setGoals((prev) => {
      const monthGoals = prev.filter((g) => g.monthKey === monthKey);
      const currentPrimary = monthGoals.find((g) => g.priority === 'PRINCIPAL');
      return prev.map((g) => {
        if (g.monthKey !== monthKey) return g;
        if (g.id === newPrimaryGoalId) {
          return { ...g, priority: 'PRINCIPAL', updatedAt: new Date().toISOString() };
        }
        if (currentPrimary && g.id === currentPrimary.id) {
          return { ...g, priority: 'ALTA', updatedAt: new Date().toISOString() };
        }
        return g;
      });
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // Import Data Handler
  const handleImportSuccess = (imported: {
    logs?: DailyLog[];
    indicators?: Indicator[];
    goals?: MonthlyGoal[];
    mode: 'merge' | 'replace';
  }) => {
    if (imported.mode === 'replace') {
      if (imported.logs) setDailyLogs(imported.logs);
      if (imported.indicators) setIndicators(imported.indicators);
      if (imported.goals) setGoals(imported.goals);
    } else {
      // Merge mode
      if (imported.logs && imported.logs.length > 0) {
        setDailyLogs((prev) => {
          const map = new Map<string, DailyLog>(prev.map((l) => [l.date, l]));
          imported.logs!.forEach((l) => map.set(l.date, l));
          return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
        });
      }
      if (imported.indicators && imported.indicators.length > 0) {
        setIndicators((prev) => {
          const map = new Map<string, Indicator>(prev.map((i) => [i.id, i]));
          imported.indicators!.forEach((i) => map.set(i.id, i));
          return Array.from(map.values());
        });
      }
      if (imported.goals && imported.goals.length > 0) {
        setGoals((prev) => {
          const map = new Map<string, MonthlyGoal>(prev.map((g) => [g.id, g]));
          imported.goals!.forEach((g) => map.set(g.id, g));
          return Array.from(map.values());
        });
      }
    }
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
        onOpenIndicatorManagerModal={() => setIsIndicatorManagerOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
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

            {/* Action Validation Buttons, Financial Integration & Value Inputs */}
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
              onOpenIndicatorManagerModal={() => setIsIndicatorManagerOpen(true)}
              moneySpent={currentMoneySpent}
              onUpdateMoneySpent={handleUpdateMoneySpent}
              spentDetails={currentSpentDetails}
              textValues={currentTextValues}
              onUpdateTextValue={handleUpdateTextValue}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            logs={dailyLogs}
            indicators={indicators}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onSwapPrimaryGoal={handleSwapPrimaryGoal}
            onSelectDate={handleSelectDateFromOtherViews}
            onOpenIndicatorManager={() => setIsIndicatorManagerOpen(true)}
          />
        )}

        {activeTab === 'spreadsheet' && (
          <SpreadsheetView
            logs={dailyLogs}
            indicators={indicators}
            onSelectDate={handleSelectDateFromOtherViews}
            onDeleteLog={handleDeleteLog}
            onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
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
            Mindset Score & Indicadores Diários — Sistema de Metas Mensais & Projeção Integrado.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIndicatorManagerOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline"
            >
              ⚙️ Gerenciador de Indicadores
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setIsDatabaseGuideModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline"
            >
              Guia de Banco de Dados
            </button>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-400">
              ScoreMind v2.0
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

      <IndicatorManagerModal
        isOpen={isIndicatorManagerOpen}
        onClose={() => setIsIndicatorManagerOpen(false)}
        indicators={indicators}
        onSaveIndicators={(updatedList) => setIndicators(updatedList)}
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

      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        indicators={indicators}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
