export type IndicatorType = 'boolean' | 'numeric' | 'counter' | 'rating';

export type IndicatorCategory = 'Sucesso' | 'Desvio' | 'Saúde' | 'Mente' | 'Finanças' | 'Produtividade' | string;

export interface Indicator {
  id: string; // e.g. "H01", "H02", etc.
  name: string; // e.g. "FEZ O SEU PLANEJAMENTO DE ESTUDOS"
  description?: string;
  type: IndicatorType;
  category: IndicatorCategory;
  unit?: string; // e.g. "R$", "min", "págs", "un", "h"
  weight: number; // Point value (e.g. 10, -40, 5, 20)
  isPositive: boolean; // true for positive points, false for penalties/desvios
  active: boolean; // TRUE / FALSE for active habit
  iconName: string;
  defaultValue?: number | boolean;
  targetValue?: number; // target for numeric types
  isCustom?: boolean;
}

export interface IndicatorValue {
  indicatorId: string;
  value: boolean | number;
  timestamp?: string;
  note?: string;
}

export type ScoreTier = 'titanium' | 'high_performance' | 'consistent' | 'neutral' | 'warning' | 'critical';

export interface ScoreTierInfo {
  tier: ScoreTier;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  emoji: string;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Segunda', 'Terça', etc.
  score: number;
  tier: ScoreTier;
  values: Record<string, boolean | number>; // indicatorId -> value
  moneyEarned?: number; // specialized high-priority indicator
  observation: string; // "Anotar observação ou lembrar de algo relevante daquele dia"
  highlights?: string[]; // key wins of the day
  validatedAt: string;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  avgScore: number;
  totalMoneyEarned: number;
  bestDay: { date: string; dayOfWeek: string; score: number };
  worstDay: { date: string; dayOfWeek: string; score: number };
  idealDaysCount: number;
  consistencyPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

