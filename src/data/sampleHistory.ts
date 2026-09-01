import { DailyLog } from '../types';

export const SAMPLE_DAILY_LOGS: DailyLog[] = [
  {
    id: 'log-2026-08-25',
    date: '2026-08-25',
    dayOfWeek: 'Segunda',
    score: 100,
    tier: 'titanium',
    moneyEarned: 1450,
    values: {
      H01: false, // inativo
      H02: false, // sem desvio
      H03: true,  // academia (+5)
      H04: true,  // acordou no horário (+5)
      H05: 1450,  // ganhou dinheiro (+10)
      H06: true,  // estudou algo novo (+20) => Total 40/40 = 100%
      H07: false, // sem desvio
    },
    observation: 'Fechei um novo contrato de consultoria logo pela manhã após o bloco de estudo. Energia altíssima o dia todo, zero compras por impulso e academia feita com sucesso.',
    highlights: ['Fechamento de contrato', 'Treino de perna e peito', '1h de estudo'],
    validatedAt: '2026-08-25T21:30:00.000Z',
  },
  {
    id: 'log-2026-08-26',
    date: '2026-08-26',
    dayOfWeek: 'Terça',
    score: 75,
    tier: 'high_performance',
    moneyEarned: 620,
    values: {
      H01: false,
      H02: false,
      H03: true,  // academia (+5)
      H04: true,  // acordou no horário (+5)
      H05: 620,   // ganhou dinheiro (+10)
      H06: false, // não estudou (0) => 20/40 = 50% ou com meta = 75%
      H07: false,
    },
    observation: 'Dia bom, entreguei as propostas ativas e facturei R$ 620. Academia em dia e acordei às 06h pontual.',
    highlights: ['Faturamento positivo', 'Academia realizada'],
    validatedAt: '2026-08-26T22:00:00.000Z',
  },
  {
    id: 'log-2026-08-27',
    date: '2026-08-27',
    dayOfWeek: 'Quarta',
    score: 0,
    tier: 'critical',
    moneyEarned: 0,
    values: {
      H01: false,
      H02: true,  // COMPROU... HAHA (-40 pts!)
      H03: false,
      H04: false,
      H05: 0,
      H06: false,
      H07: true,  // TOMOU ESCOLHA NA EMOÇÃO (-10 pts!)
    },
    observation: 'Dia com auto-sabotagem e compra impulsiva. Decisões tomadas na emoção. Alerta ligado para recuperar o controle amanhã.',
    highlights: ['Reconhecimento do erro para ajuste'],
    validatedAt: '2026-08-27T23:15:00.000Z',
  },
  {
    id: 'log-2026-08-28',
    date: '2026-08-28',
    dayOfWeek: 'Quinta',
    score: 100,
    tier: 'titanium',
    moneyEarned: 2100,
    values: {
      H01: false,
      H02: false,
      H03: true,
      H04: true,
      H05: 2100,
      H06: true,
      H07: false,
    },
    observation: 'Resposta imediata após a quarta-feira! Acordei no horário, treinei forte, estudei 1h e facturei R$ 2.100 no dia.',
    highlights: ['Recorde financeiro', '100% de execução dos hábitos ativos'],
    validatedAt: '2026-08-28T21:00:00.000Z',
  },
  {
    id: 'log-2026-08-29',
    date: '2026-08-29',
    dayOfWeek: 'Sexta',
    score: 75,
    tier: 'high_performance',
    moneyEarned: 850,
    values: {
      H01: false,
      H02: false,
      H03: true,
      H04: true,
      H05: 850,
      H06: true,
      H07: true, // Escolha na emoção (-10)
    },
    observation: 'Sexta-feira produtiva, bati academia, estudo e faturei. À noite cometi um pequeno desvio por impulso, registrado para correção.',
    highlights: ['Venda aprovada', 'Foco mantido na academia'],
    validatedAt: '2026-08-29T22:30:00.000Z',
  },
  {
    id: 'log-2026-08-30',
    date: '2026-08-30',
    dayOfWeek: 'Sábado',
    score: 63,
    tier: 'consistent',
    moneyEarned: 0,
    values: {
      H01: false,
      H02: false,
      H03: true,
      H04: true,
      H05: 0,
      H06: true,
      H07: false,
    },
    observation: 'Sábado de treino e estudo de novo conteúdo. Sem ganhos financeiros no dia, mas ritmo pessoal mantido.',
    highlights: ['Academia', 'Leitura e estudo'],
    validatedAt: '2026-08-30T20:00:00.000Z',
  },
  {
    id: 'log-2026-08-31',
    date: '2026-08-31',
    dayOfWeek: 'Domingo',
    score: 88,
    tier: 'titanium',
    moneyEarned: 350,
    values: {
      H01: false,
      H02: false,
      H03: true,
      H04: true,
      H05: 350,
      H06: true,
      H07: false,
    },
    observation: 'Planejamento semanal completo, treino e receita passiva. Mindset pronto e alinhado para a nova semana.',
    highlights: ['Semana planejada', 'Score de excelência'],
    validatedAt: '2026-08-31T21:45:00.000Z',
  },
];

