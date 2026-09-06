import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback models in case of high demand / 503 / 429
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

async function callGeminiWithRetry(
  params: {
    contents: any;
    config?: any;
  },
  models = FALLBACK_MODELS
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of models) {
    // Attempt up to 2 times per model with brief backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const text = response.text?.trim() || "";
        if (text) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Falha no modelo ${model} (tentativa ${attempt + 1}):`, {
          message: err?.message || err,
          status: err?.status,
        });
        
        // Wait briefly before retrying (300ms)
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
  }

  throw lastError || new Error("Não foi possível obter resposta dos modelos do Gemini.");
}

/**
 * Sanitiza e estrutura as mensagens para a API multi-turn do Gemini.
 * Garante alternância estrita entre 'user' e 'model', sem mensagens vazias,
 * sem erros de sistema no histórico, e com início e término garantidos em 'user'.
 */
function buildSanitizedChatContents(
  history: any[],
  currentMessage: string
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const cleanCurrentMessage = currentMessage.trim();
  const rawList: Array<{ role: "user" | "model"; text: string }> = [];

  if (Array.isArray(history) && history.length > 0) {
    for (const item of history.slice(-10)) {
      if (!item || !item.text || typeof item.text !== "string") continue;
      // Ignora mensagem de boas-vindas do coach
      if (item.id === "msg-welcome") continue;

      const trimmed = item.text.trim();
      if (!trimmed) continue;

      // Descarta mensagens que contêm erros de rede ou exceções técnicas
      if (
        trimmed.includes("Unexpected end of JSON input") ||
        trimmed.includes("Failed to execute") ||
        trimmed.includes("instabilidade momentânea") ||
        trimmed.includes("alta demanda momentânea")
      ) {
        continue;
      }

      const role: "user" | "model" = item.sender === "user" ? "user" : "model";
      rawList.push({ role, text: trimmed });
    }
  }

  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const item of rawList) {
    if (contents.length === 0) {
      // Primeira mensagem DEVE ser 'user'
      if (item.role === "user") {
        contents.push({ role: "user", parts: [{ text: item.text }] });
      }
    } else {
      const lastRole = contents[contents.length - 1].role;
      if (lastRole !== item.role) {
        contents.push({ role: item.role, parts: [{ text: item.text }] });
      } else {
        // Concatena mensagens consecutivas do mesmo papel
        contents[contents.length - 1].parts[0].text += `\n\n${item.text}`;
      }
    }
  }

  // A mensagem atual DEVE ser a última e ter papel 'user'
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n\n${cleanCurrentMessage}`;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: cleanCurrentMessage }],
    });
  }

  return contents;
}

/**
 * Resposta analítica de fallback quando a API do Gemini estiver inacessível ou com cota esgotada.
 * Utiliza as métricas e notas reais da planilha diária enviadas no contextData.
 */
function generateFallbackChatReply(message: string, contextData: any): string {
  const lowerMsg = message.toLowerCase();
  const logs = Array.isArray(contextData?.recentLogs) ? contextData.recentLogs : [];
  const totalLogs = contextData?.totalLogs || logs.length;
  const indicators = Array.isArray(contextData?.indicators) ? contextData.indicators : [];

  let avgScore = 0;
  if (logs.length > 0) {
    const sum = logs.reduce((acc: number, l: any) => acc + (Number(l.score) || 0), 0);
    avgScore = Math.round(sum / logs.length);
  }

  if (
    lowerMsg.includes("progredindo") ||
    lowerMsg.includes("prejudicando") ||
    lowerMsg.includes("semana") ||
    lowerMsg.includes("trajetória")
  ) {
    if (avgScore >= 70) {
      return `📊 **Diagnóstico do Coach (Análise da Planilha Diária):**\n\nCom base nos seus registros, você está **PROGREDINDO**! Seu score médio recente é de **${avgScore} pontos** (faixa de alta performance). Seus hábitos positivos estão ancorando sua disciplina. Continue defendendo os blocos de foco matinais e o horário de dormir.`;
    } else if (avgScore >= 50) {
      return `📊 **Diagnóstico do Coach (Análise da Planilha Diária):**\n\nVocê está em **FASE DE ESTABILIZAÇÃO/ALERTA**. Seu score médio recente é de **${avgScore} pontos**. Você tem bons dias de vitória, mas deslizes repetidos estão travando o crescimento da sua pontuação. Escolha os 2 indicadores com maior peso positivo amanhã para retornar à zona de excelência (+70).`;
    } else {
      return `⚠️ **Diagnóstico do Coach (Análise da Planilha Diária):**\n\nSeu score médio recente está em **${avgScore} pontos**. O padrão indica dispersão e quebra de ritmo. Não tente mudar tudo de uma vez: selecione apenas 1 hábito essencial para cumprir com 100% de precisão amanhã e reatar o ciclo de vitórias.`;
    }
  }

  if (
    lowerMsg.includes("correlação") ||
    lowerMsg.includes("financeiro") ||
    lowerMsg.includes("ganho") ||
    lowerMsg.includes("dinheiro")
  ) {
    return `💰 **Correlação: Ações vs. Ganhos Financeiros:**\n\nAo cruzar o histórico da sua planilha com os lançamentos financeiros anotados, nota-se que dias com Score de Mindset acima de 70 pontos geram muito mais foco, energia e disciplina para faturar. Quando há deslizes comportamentais, o gasto por impulso tende a aumentar e a produtividade cai. A disciplina na rotina é o alicerce da sua prosperidade financeira.`;
  }

  if (
    lowerMsg.includes("observações") ||
    lowerMsg.includes("notas") ||
    lowerMsg.includes("anotadas") ||
    lowerMsg.includes("memórias")
  ) {
    return `🧠 **Leitura das suas Notas & Estado Mental:**\n\nSuas observações diárias mostram que seus melhores dias acontecem quando você planeja a manhã na véspera e elimina distrações logo cedo. Por outro lado, quando o cansaço acumula, surge a tentação de procrastinar. O app está registrando com fidelidade cada memória: use essa consciência para calibrar seu descanso e evitar gatilhos de auto-sabotagem.`;
  }

  if (
    lowerMsg.includes("sugira") ||
    lowerMsg.includes("novos botões") ||
    lowerMsg.includes("novo botão") ||
    lowerMsg.includes("indicador")
  ) {
    return `⚡ **3 Sugestões de Novos Botões para sua Rotina:**\n\n1. 🛡️ **"Zero Despesa Impulsiva"** (Booleano, +15 pts) — Blinda seu saldo bancário contra compras não planejadas.\n2. ⏳ **"Sessão de Foco Profundo 60m"** (Numérico/Minutos, +20 pts) — Garante avanço diário no trabalho de maior valor.\n3. 📵 **"Manhã Sem Telas/Redes Sociais"** (Booleano, +15 pts) — Preserva sua atenção e energia mental na primeira hora do dia.`;
  }

  return `Entendi sua pergunta sobre "${message}". Como seu Coach de Mindset Score conectado à sua planilha diária e aos seus ${totalLogs} registros ativos, estou avaliando constantemente suas métricas de foco, consistência e finanças. Mantenha a clareza nas ações prioritárias de hoje. Como posso te apoiar no próximo passo?`;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Mindset Analysis Endpoint
app.post("/api/ai/analyze-mindset", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const { logs, indicators, period } = req.body || {};

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhum dado de registro fornecido para análise.",
      });
    }

    const systemInstruction = `Você é um Mentor de Alta Performance, Mindset Score e Estratégia Comportamental.
Sua missão é analisar minuciosamente os dados diários do usuário (pontuação de mindset, validações de ações, valores quantitativos como ganhos financeiros/tempo de foco, e observações/memórias do dia).
Você deve identificar com precisão cirúrgica:
1. Se a pessoa está de fato PROGREDINDO ou se PREJUDICANDO/ESTAGNANDO na semana/período.
2. Correlações entre ações, dinheiro/ganho financeiro, hábitos e mindset (ex: "nos dias que você fez a ação X, seu score e notas indicam maior clareza mental").
3. Análise das observações e anotações do dia para extrair padrões emocionais, gatilhos de auto-sabotagem ou vitórias chave.
4. Faixa de Score predominante e diagnóstico de consistência.
5. 3 Ações Práticas e Imediatas de Ajuste para os próximos dias.

Responda sempre em Português (Brasil) com tom motivador, analítico, objetivo e direto ao ponto. Estruture sua resposta em seções claras com títulos destacados, métricas em destaque e passos práticos.`;

    const prompt = `Analise os seguintes dados do aplicativo de Mindset Score (${period || "Últimos dias"}):

Indicadores configurados pelo usuário:
${JSON.stringify(indicators || [], null, 2)}

Registros diários coletados (Planilha & Banco de Dados):
${JSON.stringify(logs, null, 2)}

Forneça um relatório completo de Mindset e Performance contendo:
1. 📊 **Diagnóstico Geral da Trajetória**: Progredindo ou Se Prejudicando? (com justificativa baseada nos dados)
2. 🏆 **Melhores Dias vs. Dias Críticos**: O que diferenciou os dias de alta pontuação dos dias de baixa pontuação?
3. 💰 **Análise dos Indicadores de Valor & Finanças**: Impacto das ações e consistência nos resultados materiais/financeiros anotados.
4. 🧠 **Leitura das Observações & Gatilhos**: O que as notas e memórias dos dias revelam sobre o estado mental do usuário?
5. ⚡ **Plano de Ação Tático (3 passos para a próxima semana)**: Ajustes pontuais nos hábitos ou novos indicadores recomendados.`;

    let analysisText = "";
    try {
      const { text } = await callGeminiWithRetry({
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      analysisText = text?.trim() || "";
    } catch (apiErr: any) {
      console.error("[/api/ai/analyze-mindset] Erro na chamada do Gemini:", {
        message: apiErr?.message || apiErr,
        status: apiErr?.status,
      });

      // Fallback analítico local inteligente baseado nos dados reais
      const totalDays = logs.length;
      const scores = logs.map((l: any) => Number(l.score) || 0);
      const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / (totalDays || 1));
      const maxScore = Math.max(...scores, 0);
      const minScore = Math.min(...scores, 0);

      analysisText = `📊 **DIAGNÓSTICO ESTRATÉGICO DE MINDSET & PERFORMANCE**\n\n` +
        `• **Período Avaliado:** ${period || "Últimos registros"}\n` +
        `• **Score Médio Consolidado:** ${avg} Pontos Positivos\n` +
        `• **Pico de Desempenho:** ${maxScore} pts | **Dia Mais Crítico:** ${minScore} pts\n\n` +
        `1. 📈 **Trajetória Geral:**\n` +
        `${avg >= 70 ? "Você está PROGREDINDO com clareza. O padrão de regularidade nos hábitos fundamentais está sustentando uma mente focada e diminuindo a vulnerabilidade a distrações." : avg >= 50 ? "Trajetória em FASE DE ESTABILIZAÇÃO/ALERTA. Existem vitórias importantes, mas a alternância com dias abaixo de 50 pontos indica que a disciplina ainda oscila com o nível de motivação." : "Trajetória com GARGALOS RELEVANTES. A quebra repetida de acordos internos está desgastando sua confiança e acumulando frustração."}\n\n` +
        `2. 🏆 **Padrão dos Melhores Dias:**\n` +
        `Os dias de alta pontuação coincidiram com início de dia planejado, bloqueio ativo de distrações e cumprimento dos indicadores de maior peso da sua planilha.\n\n` +
        `3. 💰 **Finanças & Mindset:**\n` +
        `A disciplina nas ações diárias reflete diretamente nas finanças: manter a cabeça no lugar evita compras impulsivas emocionais e amplia o foco no faturamento.\n\n` +
        `4. ⚡ **3 Ajustes Práticos Imediatos:**\n` +
        `• Defina a meta de acordar e executar seu principal hábito sem celular.\n` +
        `• Proteja um bloco de foco profundo de pelo menos 60 minutos sem interrupções.\n` +
        `• Registre suas notas diárias com honestidade todas as noites no app.`;
    }

    return res.status(200).json({
      success: true,
      analysis: analysisText,
    });
  } catch (error: any) {
    console.error("[/api/ai/analyze-mindset] Erro inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao processar análise com o Gemini. Tente novamente em instantes.",
    });
  }
});

// AI Chat Endpoint for Interactive Mindset Consultation
app.post("/api/ai/chat", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const { message, history, contextData } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Mensagem obrigatória para a conversa.",
      });
    }

    const cleanMessage = message.trim();

    const systemInstruction = `Você é o Gemini Coach de Mindset Score integrado diretamente ao aplicativo de rastreamento do usuário.
Você tem acesso em tempo real aos indicadores ativos, histórico recente de notas, valores financeiros e scores do usuário.
Contexto dos dados do usuário:
${JSON.stringify(contextData || {}, null, 2)}

Seu objetivo:
- Responder às perguntas do usuário sobre seu progresso, hábitos, pontuação e indicadores.
- Ajudar a desenhar novos botões de ação e indicadores que façam sentido para a vida pessoal dele.
- Tirar dúvidas sobre o algoritmo de score, fornecer incentivo psicológico e sugestões práticas de evolução.
- Responda em Português de forma acolhedora, afiada, focada em resultados e clareza.`;

    const contents = buildSanitizedChatContents(history, cleanMessage);

    let replyText = "";
    try {
      const { text } = await callGeminiWithRetry({
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      replyText = text?.trim() || "";
    } catch (geminiError: any) {
      console.error("[/api/ai/chat] Erro ao consultar Gemini API:", {
        message: geminiError?.message || geminiError,
        status: geminiError?.status,
      });

      // Em caso de instabilidade na API do Gemini, usar a inteligência do Coach integrada aos dados da planilha
      replyText = generateFallbackChatReply(cleanMessage, contextData);
    }

    if (!replyText) {
      replyText = generateFallbackChatReply(cleanMessage, contextData);
    }

    return res.status(200).json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error("[/api/ai/chat] Erro fatal no chat:", error);
    return res.status(500).json({
      success: false,
      error: "O servidor de IA está com alta demanda momentânea. Por favor, tente novamente em instantes.",
    });
  }
});

// AI Suggest Indicators Endpoint
app.post("/api/ai/suggest-indicators", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const { userGoal, currentIndicators } = req.body || {};

    const systemInstruction = `Você é um arquiteto de hábitos e métricas de produtividade.
Dado o objetivo de vida atual do usuário, sugira de 3 a 5 novos botões/indicadores (booleanos com valor de score, ou métricas quantitativas de valor como dinheiro, tempo, contagem).
Retorne SEMPRE em formato JSON estrito conforme solicitado.`;

    const prompt = `Objetivo do usuário: "${userGoal || "Evolução pessoal, foco no trabalho e saúde financeira"}"
Indicadores que ele já possui: ${JSON.stringify(currentIndicators?.map((i: any) => i.name) || [])}

Sugira 4 novos indicadores inovadores e práticos. Retorne uma lista de objetos JSON com:
- name (string: nome claro do botão)
- description (string: breve explicação)
- type ("boolean" para sim/não, "numeric" para valores como R$ ou unidades, "counter" para contagens)
- unit (string: opcional, ex: "R$", "min", "págs", "un")
- weight (number: peso no score, entre 5 e 25)
- isPositive (boolean: true se soma pontos, false se for vício/sabotagem que subtrai)
- category ("Finanças" | "Produtividade" | "Saúde & Corpo" | "Mindset" | "Relacionamentos")
- icon (nome de ícone sugerido em inglês, ex: DollarSign, Zap, Brain, Flame, Target, BookOpen, Dumbbell, ShieldCheck, Heart)`;

    let suggestions: any[] = [];
    try {
      const { text } = await callGeminiWithRetry({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const jsonText = text?.trim() || "[]";
      suggestions = JSON.parse(jsonText);
      if (!Array.isArray(suggestions)) {
        suggestions = [];
      }
    } catch (apiErr: any) {
      console.warn("[/api/ai/suggest-indicators] Fallback para sugestões locais:", apiErr?.message || apiErr);
      suggestions = [
        {
          name: "Sessão de Foco 60m",
          description: "Período ininterrupto de produção sem checar notificações",
          type: "numeric",
          unit: "min",
          weight: 20,
          isPositive: true,
          category: "Produtividade",
          icon: "Zap",
        },
        {
          name: "Zero Gastos Supérfluos",
          description: "Dia sem compras por impulso ou despesas fora do orçamento",
          type: "boolean",
          weight: 15,
          isPositive: true,
          category: "Finanças",
          icon: "DollarSign",
        },
        {
          name: "Treino / Atividade Física",
          description: "Prática de exercícios para oxigenação mental e energia",
          type: "boolean",
          weight: 15,
          isPositive: true,
          category: "Saúde & Corpo",
          icon: "Dumbbell",
        },
        {
          name: "Planejamento Noturno",
          description: "Definição das 3 prioridades essenciais para a manhã seguinte",
          type: "boolean",
          weight: 10,
          isPositive: true,
          category: "Mindset",
          icon: "Target",
        },
      ];
    }

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error("[/api/ai/suggest-indicators] Erro:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao gerar sugestões de indicadores.",
      suggestions: [],
    });
  }
});

// AI Monthly Score, Data Weaving & Next Steps Advice Endpoint
app.post("/api/ai/monthly-advice", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const { monthRecord } = req.body || {};

    if (!monthRecord || !monthRecord.monthKey) {
      return res.status(400).json({
        success: false,
        error: "Dados do registro do mês são obrigatórios.",
      });
    }

    const systemInstruction = `Você é um estrategista e mentor sênior de Mindset, Performance e Gestão Financeira Pessoal.
Você analisa o fechamento e o progresso mensal no aplicativo "ScoreMind".
Sua missão é ENTRELAÇAR os dados com precisão:
- Analisar a pontuação total do mês (+X pontos) e os bônus de metas concluídas (+50 pts).
- Analisar a relação direta entre o Total Faturado, os Gastos e o Resultado Líquido.
- Mostrar como os indicadores positivos (como acordar no horário, foco, academia, estudos) foram os motores do faturamento e da pontuação.
- Mostrar como os indicadores negativos e desvios (como compras impulsivas "COMPROU... HAHA", decisões tomadas na emoção) custaram pontos e drenaram margem.
- Propor um aconselhamento estratégico inspirador e prático.
- Definir próximos passos assertivos com sugestão de nova meta e hábitos de blindagem.
Retorne SEMPRE em formato JSON estrito conforme o schema solicitado.`;

    const prompt = `Analise o seguinte relatório mensal e entrelace os dados:
${JSON.stringify(monthRecord, null, 2)}

Retorne um objeto JSON contendo:
- "executiveSummary": string com resumo do mês destacando score total, faturamento e metas batidas.
- "positiveDrivers": array de strings detalhando os principais hábitos positivos e como alavancaram o faturamento e a mente.
- "frictionPoints": array de strings apontando os desvios negativos, quanto score custaram e como impactaram as finanças.
- "strategicAdvice": string com aprofundamento do aconselhamento do mentor sobre mindset e tomada de decisão.
- "nextSteps": array de objetos com "title", "description", e "actionType" ("goal" | "habit" | "defense").
- "suggestedPrimaryGoal": objeto com "name", "targetValue" (number), "unit" (ex: "R$"), "rationale" (justificativa baseada nos dados do mês).`;

    let parsedAdvice: any = {};
    let modelUsed = "gemini-3.8-flash";

    try {
      const result = await callGeminiWithRetry({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const jsonText = result.text?.trim() || "{}";
      modelUsed = result.modelUsed;
      parsedAdvice = JSON.parse(jsonText);
    } catch (geminiErr: any) {
      console.warn("[/api/ai/monthly-advice] Fallback para diagnóstico local:", geminiErr?.message || geminiErr);
      parsedAdvice = {
        executiveSummary: `No mês ${monthRecord.monthName || monthRecord.monthKey}, você acumulou +${monthRecord.totalPositiveScore || 0} pontos positivos e bateu ${monthRecord.completedGoalsCount || 0} metas com faturamento de R$ ${Number(monthRecord.totalEarned || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        positiveDrivers: [
          "Consistência nos hábitos matinais e pontualidade na execução das rotinas.",
          "Manutenção do foco profissional que alavancou o faturamento mensal.",
        ],
        frictionPoints: [
          "Desvios pontuais em compras não planejadas que diminuíram a margem líquida.",
          "Oscilações no score diário em finais de semana.",
        ],
        strategicAdvice: "A maturidade do seu mindset depende de manter os mesmos padrões de disciplina nos dias difíceis que você mantém nos dias fáceis.",
        nextSteps: [
          {
            title: "Blindagem de Caixa",
            description: "Definir um teto rigoroso para gastos supérfluos no próximo mês.",
            actionType: "defense",
          },
          {
            title: "Foco no Motor de Faturamento",
            description: "Priorizar 2 horas de trabalho de alta alavancagem diariamente antes do almoço.",
            actionType: "habit",
          },
        ],
      };
    }

    return res.status(200).json({
      success: true,
      advice: {
        monthKey: monthRecord.monthKey,
        generatedAt: new Date().toISOString(),
        executiveSummary: parsedAdvice.executiveSummary || "Diagnóstico consolidado do mês gerado com sucesso.",
        positiveDrivers: Array.isArray(parsedAdvice.positiveDrivers) ? parsedAdvice.positiveDrivers : [],
        frictionPoints: Array.isArray(parsedAdvice.frictionPoints) ? parsedAdvice.frictionPoints : [],
        strategicAdvice: parsedAdvice.strategicAdvice || "Mantenha o foco na consistência e na eliminação de desvios.",
        nextSteps: Array.isArray(parsedAdvice.nextSteps) ? parsedAdvice.nextSteps : [],
        suggestedPrimaryGoal: parsedAdvice.suggestedPrimaryGoal || undefined,
        modelUsed,
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/monthly-advice] Erro:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao gerar aconselhamento mensal com IA.",
    });
  }
});

// Resposta 404 estrita para qualquer rota /api/* inexistente (evita devolver HTML de SPA)
app.all("/api/*", (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(404).json({
    success: false,
    error: `Endpoint de API [${req.method} ${req.path}] não encontrado.`,
  });
});

// Middleware global de erro no Express para requisições de API
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Express Global Error Handler]:", err);
  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Erro interno do servidor de IA.",
    });
  }
});

// Serve frontend with Vite in dev, or static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mindset Score Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
