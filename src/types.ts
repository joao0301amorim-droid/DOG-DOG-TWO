export type IndicatorType = 'boolean' | 'numeric' | 'counter' | 'rating';

export type AdditionalDataType = 'none' | 'money' | 'quantity' | 'text' | 'scale';

export type IndicatorCategory = 'Sucesso' | 'Desvio' | 'Saúde' | 'Mente' | 'Finanças' | 'Produtividade' | 'Comportamento' | 'Desenvolvimento' | 'Personalizado' | string;

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
  additionalDataType?: AdditionalDataType; // e.g. 'money' for "Quanto foi gasto?"
  order?: number; // for reordering
}

export interface IndicatorValue {
  indicatorId: string;
  value: boolean | number;
  additionalValue?: string | number; // e.g. amount spent or text description
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
  textValues?: Record<string, string>; // indicatorId -> text note
  moneyEarned?: number; // specialized high-priority indicator (Ganhos)
  moneySpent?: number; // specialized indicator (Gastos: ex H02 Comprou... haha)
  spentDetails?: Record<string, number>; // indicatorId -> amount spent
  observation: string; // "Anotar observação ou lembrar de algo relevante daquele dia"
  highlights?: string[]; // key wins of the day
  validatedAt: string;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  avgScore: number;
  totalMoneyEarned: number;
  totalMoneySpent?: number;
  netResult?: number;
  bestDay: { date: string; dayOfWeek: string; score: number };
  worstDay: { date: string; dayOfWeek: string; score: number };
  idealDaysCount: number;
  consistencyPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface WeekInMonth {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  avgScore: number;
  totalEarned: number;
  totalSpent: number;
  netResult: number;
  logs: DailyLog[];
}

export interface MonthSummary {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Setembro de 2026"
  daysInMonth: number;
  currentDay: number;
  totalEarned: number;
  totalSpent: number;
  netResult: number;
  avgScore: number;
  consistentDaysCount: number;
  weeks: WeekInMonth[];
  logs: DailyLog[];
}

// 🎯 SISTEMA DE METAS
export type GoalType = 'financial' | 'personal' | 'professional' | 'custom';
export type GoalPriority = 'PRINCIPAL' | 'ALTA' | 'MEDIA' | 'BAIXA';
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string;
  monthKey: string; // e.g. "2026-09"
  name: string; // e.g. "Guardar R$ 850"
  type: GoalType;
  priority: GoalPriority;
  targetValue: number;
  currentValue: number;
  unit: string; // 'R$', '%', 'h', 'un'
  status: GoalStatus;
  autoSyncFinancial?: boolean; // if true, financial goal currentValue = monthly netResult or totalEarned
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Data de conclusão da meta (ex: "2026-08-25" ou "2026-09-06")
  completionBonus?: number; // Bônus de pontos positivos para o score do mês (ex: 50 pontos)
  percentGainAchieved?: number; // Percentual de ganho atingido com a meta (ex: 100%, 105%)
}

export type MonthlyGoal = Goal;

export type PaceStatus = 'above' | 'on_track' | 'behind';

export interface GoalProjection {
  idealRatePerDay: number; // targetValue / daysInMonth
  currentRatePerDay: number; // currentValue / currentDay
  expectedAmountToDate: number; // idealRatePerDay * currentDay
  remainingAmount: number;
  daysInMonth: number;
  currentDayOfMonth: number;
  remainingDays: number;
  paceStatus: PaceStatus; // 🟢 Acima do ritmo | 🟡 No ritmo | 🔴 Abaixo do ritmo
  progressPercentage: number; // 0 - 100%
}

export interface GoalConsistencyScore {
  progressScore: number; // 0 - 100
  paceScore: number; // 0 - 100
  consistencyScore: number; // 0 - 100 (days logged consistently)
  behaviorScore: number; // 0 - 100 (avg mindset score)
  totalConsistencyScore: number; // 0 - 100 weighted
  statusLabel: string; // 'META SUSTENTÁVEL', 'BOM RITMO DE CONSTRUÇÃO', 'EM RISCO POR OSCILAÇÃO', 'RITMO CRÍTICO OU DESVIADO'
  statusColor: string; // emerald, teal, amber, rose
}

// 📊 SISTEMA DE REGISTRO DE SCORE MENSAL & IA
export interface IndicatorImpactSummary {
  indicatorId: string;
  name: string;
  category: string;
  isPositive: boolean;
  weight: number;
  iconName: string;
  unit?: string;
  frequency: number; // Quantos dias esteve ativo/marcado no mês
  totalPoints: number; // Total de pontos gerados ou perdidos
  moneyTotal?: number; // Valor financeiro faturado ou gasto com este indicador
}

export interface MonthlyAIAdvice {
  monthKey: string;
  generatedAt: string;
  executiveSummary: string;
  positiveDrivers: string[];
  frictionPoints: string[];
  strategicAdvice: string;
  nextSteps: Array<{
    title: string;
    description: string;
    actionType: 'goal' | 'habit' | 'defense';
  }>;
  suggestedPrimaryGoal?: {
    name: string;
    targetValue: number;
    unit: string;
    rationale: string;
  };
  modelUsed?: string;
}

export interface MonthlyScoreRecord {
  monthKey: string; // "2026-08"
  monthName: string; // "Agosto de 2026"
  basePositiveScore: number; // Soma dos scores positivos diários validados
  goalBonusScore: number; // Bônus de metas concluídas (ex: +50 por meta concluída)
  totalPositiveScore: number; // Score Total do Mês (ex: +240 Pontos positivos)
  daysLogged: number;
  totalDaysInMonth: number;
  avgDailyScore: number;
  totalEarned: number; // Total faturado no mês
  totalSpent: number; // Total gasto no mês
  netResult: number; // Resultado Líquido
  completedGoalsCount: number;
  totalGoalsCount: number;
  goals: Goal[];
  completedGoals: Goal[];
  pendingGoals: Goal[];
  positiveIndicators: IndicatorImpactSummary[];
  negativeIndicators: IndicatorImpactSummary[];
  advice?: MonthlyAIAdvice;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}


