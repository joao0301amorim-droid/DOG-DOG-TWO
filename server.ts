import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  "gemini-3.7-flash",
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
        return { text, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Falha no modelo ${model} (tentativa ${attempt + 1}):`, err?.message || err);
        
        // Wait briefly before retrying (400ms)
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  }

  throw lastError || new Error("Não foi possível obter resposta dos modelos do Gemini.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Mindset Analysis Endpoint
app.post("/api/ai/analyze-mindset", async (req, res) => {
  try {
    const { logs, indicators, period } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "Nenhum dado de registro fornecido para análise." });
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

    const { text } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const analysisText = text || "Não foi possível gerar a análise no momento.";
    res.json({ analysis: analysisText });
  } catch (error: any) {
    console.error("Erro na análise de mindset:", error);
    res.status(500).json({
      error: error.message || "Erro ao processar análise com o Gemini. Tente novamente em instantes.",
    });
  }
});

// AI Chat Endpoint for Interactive Mindset Consultation
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, contextData } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem obrigatória." });
    }

    const systemInstruction = `Você é o Gemini Coach de Mindset Score integrado diretamente ao aplicativo de rastreamento do usuário.
Você tem acesso em tempo real aos indicadores ativos, histórico recente de notas, valores financeiros e scores do usuário.
Contexto dos dados do usuário:
${JSON.stringify(contextData || {}, null, 2)}

Seu objetivo:
- Responder às perguntas do usuário sobre seu progresso, hábitos, pontuação e indicadores.
- Ajudar a desenhar novos botões de ação e indicadores que façam sentido para a vida pessoal dele.
- Tirar dúvidas sobre o algoritmo de score, fornecer incentivo psicológico e sugestões práticas de evolução.
- Responda em Português de forma acolhedora, afiada, focada em resultados e clareza.`;

    // Construct conversation history for multi-turn in a single API call
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      // Take last 8 messages for context
      for (const item of history.slice(-8)) {
        if (!item.text || item.id === 'msg-welcome') continue;
        contents.push({
          role: item.sender === "user" ? "user" : "model",
          parts: [{ text: item.text }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const { text } = await callGeminiWithRetry({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: text || "Aqui está a resposta para sua dúvida sobre mindset e desempenho." });
  } catch (error: any) {
    console.error("Erro no chat com Gemini:", error);
    res.status(500).json({
      error: error.message || "Erro ao conversar com o Gemini. Os servidores estão com alta demanda temporária; por favor, tente novamente.",
    });
  }
});

// AI Suggest Indicators Endpoint
app.post("/api/ai/suggest-indicators", async (req, res) => {
  try {
    const { userGoal, currentIndicators } = req.body;

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

    const { text } = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = text?.trim() || "[]";
    let suggestions = [];
    try {
      suggestions = JSON.parse(jsonText);
    } catch {
      suggestions = [];
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error("Erro ao sugerir indicadores:", error);
    res.status(500).json({
      error: error.message || "Erro ao gerar sugestões de indicadores.",
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
