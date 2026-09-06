import { DailyLog, MonthSummary, WeekInMonth, Goal, GoalProjection, GoalConsistencyScore } from '../types';

export const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

export function getMonthFormatted(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const name = MONTH_NAMES_PT[month] || `Mês ${month}`;
  return `${name} de ${year}`;
}

export function getDaysInMonth(year: number, month1Indexed: number): number {
  return new Date(year, month1Indexed, 0).getDate();
}

export function computeMonthSummary(monthKey: string, allLogs: DailyLog[]): MonthSummary {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr) || 2026;
  const month = Number(monthStr) || 9;
  const daysInMonth = getDaysInMonth(year, month);
  const monthName = getMonthFormatted(monthKey);

  // Filter logs for this month
  const monthLogs = allLogs.filter((l) => l.date.startsWith(monthKey));

  // Determine current day of month (or last logged day if historical)
  const todayStr = new Date().toISOString().split('T')[0];
  let currentDay = daysInMonth;
  if (todayStr.startsWith(monthKey)) {
    currentDay = Math.min(daysInMonth, Math.max(1, Number(todayStr.split('-')[2])));
  } else if (monthLogs.length > 0) {
    const maxDay = Math.max(...monthLogs.map((l) => Number(l.date.split('-')[2]) || 1));
    currentDay = Math.min(daysInMonth, maxDay);
  }

  // Financial aggregates
  let totalEarned = 0;
  let totalSpent = 0;
  let totalScore = 0;
  let consistentDaysCount = 0;

  monthLogs.forEach((l) => {
    const earned = Number(l.moneyEarned ?? l.values['H05'] ?? l.values['ind_money'] ?? 0);
    const spent = Number(l.moneySpent ?? l.spentDetails?.['H02'] ?? 0);
    totalEarned += isNaN(earned) ? 0 : earned;
    totalSpent += isNaN(spent) ? 0 : spent;

    totalScore += l.score || 0;
    if (l.score >= 70) {
      consistentDaysCount++;
    }
  });

  const netResult = totalEarned - totalSpent;
  const avgScore = monthLogs.length > 0 ? Math.round(totalScore / monthLogs.length) : 0;

  // Split into Weeks:
  // Week 1: 01 to 07
  // Week 2: 08 to 14
  // Week 3: 15 to 21
  // Week 4: 22 to 28
  // Week 5: 29 to end (if any)
  const weekRanges = [
    { num: 1, start: 1, end: 7 },
    { num: 2, start: 8, end: 14 },
    { num: 3, start: 15, end: 21 },
    { num: 4, start: 22, end: 28 },
    { num: 5, start: 29, end: daysInMonth },
  ].filter((w) => w.start <= daysInMonth);

  const weeks: WeekInMonth[] = weekRanges.map((w) => {
    const startPadded = String(w.start).padStart(2, '0');
    const endPadded = String(Math.min(w.end, daysInMonth)).padStart(2, '0');
    const startDate = `${monthKey}-${startPadded}`;
    const endDate = `${monthKey}-${endPadded}`;

    const weekLogs = monthLogs.filter((l) => {
      const day = Number(l.date.split('-')[2]);
      return day >= w.start && day <= w.end;
    });

    let wEarned = 0;
    let wSpent = 0;
    let wScore = 0;

    weekLogs.forEach((l) => {
      const e = Number(l.moneyEarned ?? l.values['H05'] ?? l.values['ind_money'] ?? 0);
      const s = Number(l.moneySpent ?? l.spentDetails?.['H02'] ?? 0);
      wEarned += isNaN(e) ? 0 : e;
      wSpent += isNaN(s) ? 0 : s;
      wScore += l.score || 0;
    });

    return {
      weekNumber: w.num,
      label: `Semana ${w.num} (${startPadded} a ${endPadded})`,
      startDate,
      endDate,
      daysCount: Math.min(w.end, daysInMonth) - w.start + 1,
      avgScore: weekLogs.length > 0 ? Math.round(wScore / weekLogs.length) : 0,
      totalEarned: wEarned,
      totalSpent: wSpent,
      netResult: wEarned - wSpent,
      logs: weekLogs,
    };
  });

  return {
    monthKey,
    monthName,
    daysInMonth,
    currentDay,
    totalEarned,
    totalSpent,
    netResult,
    avgScore,
    consistentDaysCount,
    weeks,
    logs: monthLogs,
  };
}

export function calculateGoalProjection(
  goal: Goal,
  currentDayOfMonth: number,
  daysInMonth: number
): GoalProjection {
  const target = Math.max(1, goal.targetValue || 1);
  const current = Math.max(0, goal.currentValue || 0);
  const progressPercentage = Math.min(100, Math.round((current / target) * 100));

  const safeCurrentDay = Math.max(1, Math.min(daysInMonth, currentDayOfMonth));
  const remainingDays = Math.max(0, daysInMonth - safeCurrentDay);

  const idealRatePerDay = target / daysInMonth;
  const currentRatePerDay = current / safeCurrentDay;
  const expectedAmountToDate = idealRatePerDay * safeCurrentDay;
  const remainingAmount = Math.max(0, target - current);

  // Status de ritmo:
  // 🟢 Acima do ritmo (> 105% do esperado)
  // 🟡 No ritmo (90% a 105% do esperado)
  // 🔴 Abaixo do ritmo (< 90% do esperado)
  let paceStatus: 'above' | 'on_track' | 'behind' = 'on_track';
  if (expectedAmountToDate > 0) {
    const ratio = current / expectedAmountToDate;
    if (ratio >= 1.05) {
      paceStatus = 'above';
    } else if (ratio >= 0.88) {
      paceStatus = 'on_track';
    } else {
      paceStatus = 'behind';
    }
  }

  return {
    idealRatePerDay,
    currentRatePerDay,
    expectedAmountToDate,
    remainingAmount,
    daysInMonth,
    currentDayOfMonth: safeCurrentDay,
    remainingDays,
    paceStatus,
    progressPercentage,
  };
}

export function calculateGoalConsistencyScore(
  goal: Goal,
  projection: GoalProjection,
  monthLogs: DailyLog[]
): GoalConsistencyScore {
  // 1. Progresso (0 a 100)
  const progressScore = projection.progressPercentage;

  // 2. Ritmo (0 a 100)
  let paceScore = 50;
  if (projection.expectedAmountToDate > 0) {
    const ratio = (projection.currentRatePerDay / Math.max(0.1, projection.idealRatePerDay));
    paceScore = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }

  // 3. Consistência (dias registrados com score acima do crítico / total de dias decorridos)
  let consistencyScore = 70;
  if (projection.currentDayOfMonth > 0) {
    const validDays = monthLogs.filter((l) => l.score >= 55).length;
    const ratio = validDays / projection.currentDayOfMonth;
    consistencyScore = Math.min(100, Math.max(10, Math.round(ratio * 100)));
  }

  // 4. Comportamento (Média do score diário)
  let behaviorScore = 75;
  if (monthLogs.length > 0) {
    const sum = monthLogs.reduce((acc, l) => acc + (l.score || 0), 0);
    behaviorScore = Math.round(sum / monthLogs.length);
  }

  // Ponderação:
  // Progresso: 30%, Ritmo: 30%, Consistência: 20%, Comportamento: 20%
  const total = Math.round(
    progressScore * 0.3 + paceScore * 0.3 + consistencyScore * 0.2 + behaviorScore * 0.2
  );
  const totalConsistencyScore = Math.min(100, Math.max(0, total));

  let statusLabel = 'META SUSTENTÁVEL';
  let statusColor = 'emerald';

  if (totalConsistencyScore >= 80) {
    statusLabel = 'META SUSTENTÁVEL';
    statusColor = 'emerald';
  } else if (totalConsistencyScore >= 65) {
    statusLabel = 'BOM RITMO DE CONSTRUÇÃO';
    statusColor = 'teal';
  } else if (totalConsistencyScore >= 45) {
    statusLabel = 'EM RISCO POR OSCILAÇÃO';
    statusColor = 'amber';
  } else {
    statusLabel = 'RITMO CRÍTICO OU DESVIADO';
    statusColor = 'rose';
  }

  return {
    progressScore,
    paceScore,
    consistencyScore,
    behaviorScore,
    totalConsistencyScore,
    statusLabel,
    statusColor,
  };
}
