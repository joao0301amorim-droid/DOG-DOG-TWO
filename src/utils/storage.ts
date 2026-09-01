import { DailyLog, Indicator } from '../types';
import { DEFAULT_INDICATORS } from '../data/defaultIndicators';
import { SAMPLE_DAILY_LOGS } from '../data/sampleHistory';

const STORAGE_KEYS = {
  INDICATORS: 'mindset_indicators_v1',
  LOGS: 'mindset_daily_logs_v1',
  SELECTED_DATE: 'mindset_selected_date_v1',
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

export function exportLogsToCSV(logs: DailyLog[], indicators: Indicator[]): void {
  if (!logs || logs.length === 0) return;

  const header = [
    'Data',
    'Dia da Semana',
    'Score Final',
    'Faixa / Classificação',
    'Dinheiro Ganho (R$)',
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

    const money = log.moneyEarned ?? log.values['ind_money'] ?? 0;

    return [
      log.date,
      log.dayOfWeek,
      log.score,
      log.tier,
      money,
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

export function exportAllDataJSON(logs: DailyLog[], indicators: Indicator[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    indicators,
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
