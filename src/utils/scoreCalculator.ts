import { Indicator, ScoreTier, DailyLog, WeeklySummary } from '../types';
import { SCORE_TIERS } from '../data/defaultIndicators';

export interface DailyScoreResult {
  score: number;
  tier: ScoreTier;
  maxPossible: number;
  earnedPoints: number;
  positivePoints: number;
  maxPositivePoints: number;
  penaltyPoints: number;
  activeCount: number;
}

export function calculateDailyScore(
  values: Record<string, boolean | number>,
  indicators: Indicator[]
): DailyScoreResult {
  let positivePoints = 0;
  let penaltyPoints = 0;
  let maxPositivePoints = 0;
  let activeCount = 0;

  for (const ind of indicators) {
    // Only active indicators participate in the daily scoring
    if (ind.active === false) {
      continue;
    }

    activeCount++;
    const val = values[ind.id];

    if (ind.isPositive) {
      maxPositivePoints += ind.weight;

      if (ind.type === 'boolean') {
        if (val === true) {
          positivePoints += ind.weight;
        }
      } else if (ind.type === 'numeric' || ind.type === 'counter') {
        const numVal = typeof val === 'number' ? val : 0;
        if (numVal > 0) {
          // If money or numeric target is set, award points
          positivePoints += ind.weight;
        }
      } else if (ind.type === 'rating') {
        const rating = typeof val === 'number' ? val : 3;
        positivePoints += (ind.weight * rating) / 5;
      }
    } else {
      // Negative habit / Desvio / Sabotagem
      if (val === true || (typeof val === 'number' && val > 0)) {
        penaltyPoints += ind.weight;
      }
    }
  }

  const earnedPoints = positivePoints - penaltyPoints;

  // Calculate percentage based on positive weights (max 100)
  const baseDenominator = maxPositivePoints > 0 ? maxPositivePoints : 100;
  let normalizedScore = Math.round((earnedPoints / baseDenominator) * 100);

  // Clamp score between 0 and 100
  normalizedScore = Math.max(0, Math.min(100, normalizedScore));

  // Determine tier
  let tier: ScoreTier = 'critical';
  for (const key of Object.keys(SCORE_TIERS) as ScoreTier[]) {
    const t = SCORE_TIERS[key];
    if (normalizedScore >= t.minScore && normalizedScore <= t.maxScore) {
      tier = key;
      break;
    }
  }

  return {
    score: normalizedScore,
    tier,
    maxPossible: 100,
    earnedPoints,
    positivePoints,
    maxPositivePoints,
    penaltyPoints,
    activeCount,
  };
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
}

export function computeWeeklySummary(logs: DailyLog[]): WeeklySummary {
  if (logs.length === 0) {
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      avgScore: 0,
      totalMoneyEarned: 0,
      bestDay: { date: '', dayOfWeek: '', score: 0 },
      worstDay: { date: '', dayOfWeek: '', score: 0 },
      idealDaysCount: 0,
      consistencyPercentage: 0,
      trend: 'stable',
    };
  }

  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recent7 = sortedLogs.slice(-7);

  const totalScore = recent7.reduce((acc, l) => acc + l.score, 0);
  const avgScore = Math.round(totalScore / recent7.length);

  const totalMoneyEarned = recent7.reduce((acc, l) => {
    const moneyVal = Number(l.moneyEarned ?? l.values['H05'] ?? l.values['ind_money'] ?? 0);
    return acc + (isNaN(moneyVal) ? 0 : moneyVal);
  }, 0);

  let best = recent7[0];
  let worst = recent7[0];
  let idealCount = 0;

  for (const l of recent7) {
    if (l.score > best.score) best = l;
    if (l.score < worst.score) worst = l;
    if (l.score >= 70) idealCount++;
  }

  // Calculate trend comparing first half with second half
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recent7.length >= 4) {
    const mid = Math.floor(recent7.length / 2);
    const firstHalfAvg = recent7.slice(0, mid).reduce((a, b) => a + b.score, 0) / mid;
    const secondHalfAvg = recent7.slice(mid).reduce((a, b) => a + b.score, 0) / (recent7.length - mid);
    if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';
  }

  return {
    startDate: recent7[0].date,
    endDate: recent7[recent7.length - 1].date,
    avgScore,
    totalMoneyEarned,
    bestDay: { date: best.date, dayOfWeek: best.dayOfWeek, score: best.score },
    worstDay: { date: worst.date, dayOfWeek: worst.dayOfWeek, score: worst.score },
    idealDaysCount: idealCount,
    consistencyPercentage: Math.round((idealCount / recent7.length) * 100),
    trend,
  };
}

