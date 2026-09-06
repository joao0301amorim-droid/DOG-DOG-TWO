import { DailyLog, Indicator, Goal, MonthlyAIAdvice } from '../types';
import { DEFAULT_INDICATORS } from '../data/defaultIndicators';
import { SAMPLE_DAILY_LOGS } from '../data/sampleHistory';
import { DEFAULT_GOALS } from '../data/defaultGoals';

const STORAGE_KEYS = {
  INDICATORS: 'mindset_indicators_v2',
  LOGS: 'mindset_daily_logs_v2',
  GOALS: 'mindset_monthly_goals_v2',
  SELECTED_DATE: 'mindset_selected_date_v1',
  MONTHLY_ADVICE_PREFIX: 'mindset_monthly_advice_v2_',
};

export function loadIndicators(): Indicator[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INDICATORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao carregar indicadores:', e);
  }
  return DEFAULT_INDICATORS;
}

export function saveIndicators(indicators: Indicator[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INDICATORS, JSON.stringify(indicators));
  } catch (e) {
    console.error('Erro ao salvar indicadores:', e);
  }
}

export function loadDailyLogs(): DailyLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao carregar registros diários:', e);
  }
  return SAMPLE_DAILY_LOGS;
}

export function saveDailyLogs(logs: DailyLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar registros diários:', e);
  }
}

export function loadGoals(): Goal[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default goals like August exist if not already present
        const existingIds = new Set(parsed.map((g: Goal) => g.id));
        const missingDefaults = DEFAULT_GOALS.filter((dg) => !existingIds.has(dg.id));
        if (missingDefaults.length > 0) {
          return [...parsed, ...missingDefaults];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar metas:', e);
  }
  return DEFAULT_GOALS;
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Erro ao salvar metas:', e);
  }
}

export { loadGoals as loadSavedGoals, saveGoals as saveMonthlyGoals };

export function loadMonthlyAdvice(monthKey: string): MonthlyAIAdvice | null {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEYS.MONTHLY_ADVICE_PREFIX}${monthKey}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar aconselhamento mensal:', e);
  }
  return null;
}

export function saveMonthlyAdvice(monthKey: string, advice: MonthlyAIAdvice): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.MONTHLY_ADVICE_PREFIX}${monthKey}`, JSON.stringify(advice));
  } catch (e) {
    console.error('Erro ao salvar aconselhamento mensal:', e);
  }
}

export function exportLogsToCSV(logs: DailyLog[], indicators: Indicator[]): void {
  if (!logs || logs.length === 0) return;

  const header = [
    'Data',
    'Dia da Semana',
    'Score Final',
    'Faixa / Classificação',
    'Ganhos (R$)',
    'Gastos (R$)',
    'Resultado Líquido (R$)',
    ...indicators.map((i) => `"${i.name.replace(/"/g, '""')}"`),
    'Observação do Dia',
    'Hora de Validação',
  ].join(';');

  const rows = logs.map((log) => {
    const indicatorCols = indicators.map((ind) => {
      const val = log.values[ind.id];
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'SIM' : 'NÃO';
      return String(val);
    });

    const moneyEarned = Number(log.moneyEarned ?? log.values['H05'] ?? log.values['ind_money'] ?? 0);
    const moneySpent = Number(log.moneySpent ?? log.spentDetails?.['H02'] ?? 0);
    const netResult = moneyEarned - moneySpent;

    return [
      log.date,
      log.dayOfWeek,
      log.score,
      log.tier,
      moneyEarned,
      moneySpent,
      netResult,
      ...indicatorCols.map((c) => `"${String(c).replace(/"/g, '""')}"`),
      `"${(log.observation || '').replace(/"/g, '""')}"`,
      log.validatedAt,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `mindset_score_planilha_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAllDataJSON(logs: DailyLog[], indicators: Indicator[], goals?: Goal[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    indicators,
    goals: goals || [],
    logs,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `mindset_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ParsedImportData {
  logs?: DailyLog[];
  indicators?: Indicator[];
  goals?: Goal[];
  sourceType: 'json_full' | 'json_logs' | 'json_goals' | 'json_indicators' | 'csv_logs';
  summary: {
    logsCount: number;
    indicatorsCount: number;
    goalsCount: number;
    dateRange?: { start: string; end: string };
  };
}

export function parseImportJSON(jsonString: string): ParsedImportData {
  const parsed = JSON.parse(jsonString);

  let logs: DailyLog[] = [];
  let indicators: Indicator[] = [];
  let goals: Goal[] = [];
  let sourceType: ParsedImportData['sourceType'] = 'json_full';

  // Case 1: Full backup object { indicators, goals, logs }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (Array.isArray(parsed.logs)) logs = parsed.logs;
    if (Array.isArray(parsed.indicators)) indicators = parsed.indicators;
    if (Array.isArray(parsed.goals)) goals = parsed.goals;
    sourceType = 'json_full';
  } else if (Array.isArray(parsed)) {
    // Case 2: Array of something
    if (parsed.length > 0) {
      const first = parsed[0];
      if ('date' in first && ('score' in first || 'values' in first)) {
        logs = parsed as DailyLog[];
        sourceType = 'json_logs';
      } else if ('monthKey' in first && 'targetValue' in first) {
        goals = parsed as Goal[];
        sourceType = 'json_goals';
      } else if ('weight' in first && 'category' in first) {
        indicators = parsed as Indicator[];
        sourceType = 'json_indicators';
      }
    }
  }

  // Validate and clean logs
  logs = logs.filter((l) => l && typeof l === 'object' && l.date).map((l) => ({
    ...l,
    id: l.id || `log-${l.date}`,
    values: l.values || {},
    score: typeof l.score === 'number' ? l.score : 0,
    tier: l.tier || 'neutral',
  }));

  // Sort logs by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));

  // Determine date range
  let dateRange: { start: string; end: string } | undefined;
  if (logs.length > 0) {
    const dates = logs.map((l) => l.date).sort();
    dateRange = { start: dates[0], end: dates[dates.length - 1] };
  }

  return {
    logs,
    indicators,
    goals,
    sourceType,
    summary: {
      logsCount: logs.length,
      indicatorsCount: indicators.length,
      goalsCount: goals.length,
      dateRange,
    },
  };
}

export function parseCSVToLogs(csvString: string, existingIndicators: Indicator[]): ParsedImportData {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados.');
  }

  const headerLine = lines[0].replace(/^\uFEFF/, ''); // Strip BOM
  const headers = headerLine.split(';').map((h) => h.replace(/^"|"$/g, '').trim());

  const dateIdx = headers.findIndex((h) => h.toLowerCase().includes('data'));
  const scoreIdx = headers.findIndex((h) => h.toLowerCase().includes('score'));
  const dayOfWeekIdx = headers.findIndex((h) => h.toLowerCase().includes('dia da semana'));
  const tierIdx = headers.findIndex((h) => h.toLowerCase().includes('faixa'));
  const earnedIdx = headers.findIndex((h) => h.toLowerCase().includes('ganho') || h.toLowerCase().includes('faturado'));
  const spentIdx = headers.findIndex((h) => h.toLowerCase().includes('gasto'));
  const obsIdx = headers.findIndex((h) => h.toLowerCase().includes('observa'));

  if (dateIdx === -1) {
    throw new Error('Não foi possível identificar a coluna de Data no CSV.');
  }

  const logs: DailyLog[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple semicolon split considering quotes
    const cols = line.split(';').map((c) => c.replace(/^"|"$/g, '').trim());
    const date = cols[dateIdx];
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

    const score = scoreIdx !== -1 ? Number(cols[scoreIdx]) || 0 : 0;
    const dayOfWeek = dayOfWeekIdx !== -1 ? cols[dayOfWeekIdx] : '';
    const tier = tierIdx !== -1 ? (cols[tierIdx] as any) : 'neutral';
    const moneyEarned = earnedIdx !== -1 ? Number(cols[earnedIdx].replace(/[^\d.-]/g, '')) || 0 : 0;
    const moneySpent = spentIdx !== -1 ? Number(cols[spentIdx].replace(/[^\d.-]/g, '')) || 0 : 0;
    const observation = obsIdx !== -1 ? cols[obsIdx] : '';

    const values: Record<string, boolean | number> = {
      H05: moneyEarned,
      H02: moneySpent > 0,
    };

    logs.push({
      id: `log-${date}`,
      date,
      dayOfWeek: dayOfWeek || 'Dia',
      score,
      tier: (tier && ['elite', 'high', 'neutral', 'critical'].includes(tier)) ? tier : 'neutral',
      values,
      moneyEarned,
      moneySpent,
      spentDetails: moneySpent > 0 ? { H02: moneySpent } : {},
      observation,
      validatedAt: new Date().toISOString(),
    });
  }

  logs.sort((a, b) => b.date.localeCompare(a.date));

  let dateRange: { start: string; end: string } | undefined;
  if (logs.length > 0) {
    const dates = logs.map((l) => l.date).sort();
    dateRange = { start: dates[0], end: dates[dates.length - 1] };
  }

  return {
    logs,
    indicators: [],
    goals: [],
    sourceType: 'csv_logs',
    summary: {
      logsCount: logs.length,
      indicatorsCount: 0,
      goalsCount: 0,
      dateRange,
    },
  };
}


