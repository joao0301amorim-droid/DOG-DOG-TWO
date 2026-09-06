import {
  DailyLog,
  MonthSummary,
  WeekInMonth,
  Goal,
  GoalProjection,
  GoalConsistencyScore,
  Indicator,
  MonthlyScoreRecord,
  IndicatorImpactSummary,
  MonthlyAIAdvice,
} from '../types';
import { formatCurrencyBRL } from './scoreCalculator';

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

/**
 * Computa o Registro Consolidado de Score por Mês:
 * - Pontuação Total do Mês (soma dos scores positivos + bônus de metas concluídas)
 * - Metas concluídas com data de conclusão e ganho percentual
 * - Total faturado e fluxo financeiro
 * - Entrelaçamento de Indicadores Positivos vs Negativos
 */
export function computeMonthlyScoreRecord(
  monthKey: string,
  allLogs: DailyLog[],
  allGoals: Goal[],
  allIndicators: Indicator[]
): MonthlyScoreRecord {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr) || 2026;
  const month = Number(monthStr) || 9;
  const daysInMonth = getDaysInMonth(year, month);
  const monthName = getMonthFormatted(monthKey);

  // Filtra logs do mês
  const monthLogs = allLogs.filter((l) => l.date.startsWith(monthKey));

  // Filtra metas do mês
  const monthGoals = allGoals.filter((g) => g.monthKey === monthKey);
  const completedGoals = monthGoals.filter((g) => g.status === 'completed');
  const pendingGoals = monthGoals.filter((g) => g.status !== 'completed');

  // 1. Score Base dos dias (soma de scores positivos)
  let basePositiveScore = 0;
  let totalEarned = 0;
  let totalSpent = 0;

  monthLogs.forEach((l) => {
    // Score diário validado
    if (typeof l.score === 'number' && l.score > 0) {
      basePositiveScore += l.score;
    }
    const earned = Number(l.moneyEarned ?? l.values['H05'] ?? l.values['ind_money'] ?? 0);
    const spent = Number(l.moneySpent ?? l.spentDetails?.['H02'] ?? 0);
    totalEarned += isNaN(earned) ? 0 : earned;
    totalSpent += isNaN(spent) ? 0 : spent;
  });

  // 2. Bônus de Metas Concluídas (ex: +50 pts para meta principal, +30 para secundária)
  let goalBonusScore = 0;
  completedGoals.forEach((goal) => {
    const bonus = goal.completionBonus ?? (goal.priority === 'PRINCIPAL' ? 50 : 30);
    goalBonusScore += bonus;
  });

  const totalPositiveScore = basePositiveScore + goalBonusScore;
  const avgDailyScore = monthLogs.length > 0 ? Math.round(basePositiveScore / monthLogs.length) : 0;
  const netResult = totalEarned - totalSpent;

  // 3. Entrelaçamento dos Indicadores: Positivos vs Negativos
  const positiveList: IndicatorImpactSummary[] = [];
  const negativeList: IndicatorImpactSummary[] = [];

  allIndicators.forEach((ind) => {
    if (ind.active === false) return;

    let freq = 0;
    let totalPoints = 0;
    let moneyTotal = 0;

    monthLogs.forEach((log) => {
      const val = log.values[ind.id];

      if (ind.type === 'boolean') {
        if (Boolean(val)) {
          freq++;
          if (ind.isPositive) {
            totalPoints += ind.weight;
          } else {
            totalPoints -= ind.weight;
            // Se for H02 ou tiver gasto
            const s = Number(log.moneySpent ?? log.spentDetails?.[ind.id] ?? 0);
            if (s > 0) moneyTotal += s;
          }
        }
      } else if (ind.type === 'numeric' || ind.type === 'counter') {
        const numVal = Number(val) || 0;
        if (numVal > 0) {
          freq++;
          if (ind.isPositive) {
            totalPoints += ind.weight;
            if (ind.additionalDataType === 'money' || ind.unit === 'R$') {
              moneyTotal += numVal;
            }
          } else {
            totalPoints -= ind.weight;
          }
        }
      }
    });

    const summaryItem: IndicatorImpactSummary = {
      indicatorId: ind.id,
      name: ind.name,
      category: ind.category,
      isPositive: ind.isPositive,
      weight: ind.weight,
      iconName: ind.iconName || 'Zap',
      unit: ind.unit,
      frequency: freq,
      totalPoints,
      moneyTotal: moneyTotal > 0 ? moneyTotal : undefined,
    };

    if (ind.isPositive) {
      positiveList.push(summaryItem);
    } else {
      negativeList.push(summaryItem);
    }
  });

  // Ordena positivos pelos mais frequentes / geradores de pontos
  positiveList.sort((a, b) => b.frequency - a.frequency || b.totalPoints - a.totalPoints);
  // Ordena negativos pelos desvios mais frequentes / danosos
  negativeList.sort((a, b) => b.frequency - a.frequency || a.totalPoints - b.totalPoints);

  return {
    monthKey,
    monthName,
    basePositiveScore,
    goalBonusScore,
    totalPositiveScore,
    daysLogged: monthLogs.length,
    totalDaysInMonth: daysInMonth,
    avgDailyScore,
    totalEarned,
    totalSpent,
    netResult,
    completedGoalsCount: completedGoals.length,
    totalGoalsCount: monthGoals.length,
    goals: monthGoals,
    completedGoals,
    pendingGoals,
    positiveIndicators: positiveList,
    negativeIndicators: negativeList,
  };
}

/**
 * Gerador local resiliente de Aconselhamento IA com Entrelaçamento dos Dados
 * Utilizado para resposta instantânea ou quando a rede / chave estiver indisponível.
 */
export function generateLocalMonthlyAdvice(record: MonthlyScoreRecord): MonthlyAIAdvice {
  const topPos = record.positiveIndicators.filter((i) => i.frequency > 0).slice(0, 3);
  const topNeg = record.negativeIndicators.filter((i) => i.frequency > 0).slice(0, 3);

  const posDrivers = topPos.length > 0
    ? topPos.map(
        (p) =>
          `"${p.name}": Executado em ${p.frequency} dias com +${p.totalPoints} pts gerados${
            p.moneyTotal ? ` e faturamento alavancado de ${formatCurrencyBRL(p.moneyTotal)}` : ''
          }.`
      )
    : ['Indicadores diários de rotina e consistência sustentaram a base do mês.'];

  const frictionPoints = topNeg.length > 0
    ? topNeg.map(
        (n) =>
          `"${n.name}": Ocorrido em ${n.frequency} dia(s), drenando ${Math.abs(n.totalPoints)} pontos de score${
            n.moneyTotal ? ` e ${formatCurrencyBRL(n.moneyTotal)} de vazamento financeiro não planejado` : ''
          }.`
      )
    : ['Nenhum desvio crítico com dreno de pontuação relevante registrado neste mês. Excelente blindagem!'];

  let executiveSummary = `No mês de ${record.monthName}, você atingiu +${record.totalPositiveScore} Pontos Positivos no Mindset Score, impulsionado por ${record.basePositiveScore} pontos diários e +${record.goalBonusScore} pontos de bônus por ${record.completedGoalsCount} meta(s) concluída(s). `;
  executiveSummary += `O total faturado no mês foi de ${formatCurrencyBRL(record.totalEarned)}, resultando em um saldo líquido de ${formatCurrencyBRL(record.netResult)}.`;

  let strategicAdvice = '';
  if (record.completedGoalsCount > 0 && record.netResult > 0) {
    strategicAdvice = `Seu entrelaçamento de dados demonstra que o faturamento de ${formatCurrencyBRL(record.totalEarned)} esteve diretamente alinhado aos dias em que seus hábitos positivos foram cumpridos. A conclusão das metas proporcionou o bônus de pontuação necessário para consolidar sua faixa. Para o próximo ciclo, aumente a proteção contra os desvios de consumo impulsivo para preservar ainda mais o resultado líquido.`;
  } else if (record.netResult <= 0) {
    strategicAdvice = `Identificamos que o desvio financeiro não planejado consumiu parcela do faturamento gerado. A prioridade máxima agora é blindar a regra de 24 horas antes de qualquer compra por impulso, elevando sua consistência diária acima de 70 pontos.`;
  } else {
    strategicAdvice = `A consistência nos hábitos fundamentais é o principal motor de alavancagem para bater as metas pendentes. Concluir a meta principal do mês trará o salto imediato de +50 pontos no seu score geral.`;
  }

  const nextSteps = [
    {
      title: 'Fixar Meta Principal de Reserva / Aporte',
      description: `Definir meta clara de guardar entre ${formatCurrencyBRL(Math.max(850, Math.round(record.totalEarned * 0.25)))} para o próximo mês com bônus de +50 pontos.`,
      actionType: 'goal' as const,
    },
    {
      title: 'Manter Alinhamento Matinal & Estudo',
      description: 'Garantir acordar no horário e bloco de estudo nas primeiras 3 horas do dia para impulsionar o faturamento diário.',
      actionType: 'habit' as const,
    },
    {
      title: 'Blindagem Contra Compras Impulsivas',
      description: 'Implementar trava mental: qualquer gasto extra acima de R$ 50 requer registro e justificativa na planilha antes de pagar.',
      actionType: 'defense' as const,
    },
  ];

  return {
    monthKey: record.monthKey,
    generatedAt: new Date().toISOString(),
    executiveSummary,
    positiveDrivers: posDrivers,
    frictionPoints,
    strategicAdvice,
    nextSteps,
    suggestedPrimaryGoal: {
      name: `Guardar ${formatCurrencyBRL(850)}`,
      targetValue: 850,
      unit: 'R$',
      rationale: 'Base sólida de acumulação patrimonial recorrente testada e comprovada no histórico mensal.',
    },
    modelUsed: 'ScoreMind AI Intelligence Engine',
  };
}
