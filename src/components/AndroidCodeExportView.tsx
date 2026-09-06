import React, { useState } from 'react';
import { Smartphone, Copy, Check, Code2, Database, Cpu, Layers } from 'lucide-react';

export const AndroidCodeExportView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<'compose' | 'room' | 'viewmodel' | 'gemini'>('compose');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const composeCode = `// ==========================================
// 1. ActionButtonsScreen.kt (Jetpack Compose)
// Interface de Botões de Ação, Coleta de Valor Financeiro e Score
// ==========================================
package com.mindsetscore.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ActionButtonsScreen(
    viewModel: MindsetScoreViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp)
    ) {
        // Banner do Score Diário
        ScoreBannerView(score = uiState.currentScore, tier = uiState.currentTier)

        Spacer(modifier = Modifier.height(16.dp))

        // Card de Coleta de Valor: Ganhou Dinheiro Hoje?
        FinancialValueCard(
            moneyEarned = uiState.moneyEarned,
            onMoneyChange = { viewModel.updateMoney(it) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Lista de Botões de Ação de Validação
        Text(
            text = "Botões de Validação de Ações",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(uiState.indicators.size) { index ->
                val indicator = uiState.indicators[index]
                ActionButtonItem(
                    indicator = indicator,
                    isChecked = uiState.validatedActions[indicator.id] == true,
                    onToggle = { viewModel.toggleAction(indicator.id) }
                )
            }
        }

        // Botão de Salvar no Banco de Dados
        Button(
            onClick = { viewModel.saveDailyLog() },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Salvar & Atualizar Planilha", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}
`;

  const roomCode = `// ==========================================
// 2. DailyLogEntity.kt (Room Database)
// Entidade do Banco de Dados SQLite / Room no Android Studio
// ==========================================
package com.mindsetscore.app.data.local

import androidx.room.*

@Entity(tableName = "daily_mindset_logs")
data class DailyLogEntity(
    @PrimaryKey
    val date: String, // "2026-09-01"
    val dayOfWeek: String, // "Segunda"
    val score: Int, // 0 a 100
    val tier: String, // "TITANIUM", "HIGH_PERFORMANCE", etc.
    val moneyEarned: Double, // Valor financeiro faturado
    val validatedActionsJson: String, // Map serialized in JSON
    val observation: String, // Observações e memórias do dia
    val createdAtTimestamp: Long = System.currentTimeMillis()
)

@Dao
interface DailyLogDao {
    @Query("SELECT * FROM daily_mindset_logs ORDER BY date DESC")
    fun getAllLogs(): kotlinx.coroutines.flow.Flow<List<DailyLogEntity>>

    @Query("SELECT * FROM daily_mindset_logs WHERE date = :date LIMIT 1")
    suspend fun getLogByDate(date: String): DailyLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(log: DailyLogEntity)

    @Query("SELECT AVG(score) FROM daily_mindset_logs")
    suspend fun getAverageScore(): Double?

    @Query("SELECT SUM(moneyEarned) FROM daily_mindset_logs")
    suspend fun getTotalMoneyEarned(): Double?
}
`;

  const viewmodelCode = `// ==========================================
// 3. MindsetScoreViewModel.kt (Lógica de Score)
// Validação dos Indicadores e Cálculo de Faixa de Score
// ==========================================
package com.mindsetscore.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class IndicatorModel(
    val id: String,
    val name: String,
    val weight: Int,
    val isPositive: Boolean
)

data class MindsetUiState(
    val currentScore: Int = 0,
    val currentTier: String = "NEUTRO",
    val moneyEarned: Double = 0.0,
    val observation: String = "",
    val indicators: List<IndicatorModel> = emptyList(),
    val validatedActions: Map<String, Boolean> = emptyMap()
)

class MindsetScoreViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MindsetUiState())
    val uiState: StateFlow<MindsetUiState> = _uiState

    fun toggleAction(indicatorId: String) {
        val current = _uiState.value.validatedActions.toMutableMap()
        val currentVal = current[indicatorId] ?: false
        current[indicatorId] = !currentVal

        _uiState.value = _uiState.value.copy(
            validatedActions = current
        )
        recalculateScore()
    }

    fun updateMoney(value: Double) {
        _uiState.value = _uiState.value.copy(moneyEarned = value)
        recalculateScore()
    }

    private fun recalculateScore() {
        var earnedPoints = 0
        var totalPositiveWeight = 0

        _uiState.value.indicators.forEach { ind ->
            if (ind.isPositive) {
                totalPositiveWeight += ind.weight
                if (_uiState.value.validatedActions[ind.id] == true) {
                    earnedPoints += ind.weight
                }
            } else {
                if (_uiState.value.validatedActions[ind.id] == true) {
                    earnedPoints -= ind.weight
                }
            }
        }

        // Bônus proporcional de faturamento
        if (_uiState.value.moneyEarned > 0) {
            earnedPoints += 10
        }

        val maxWeight = if (totalPositiveWeight > 0) totalPositiveWeight else 100
        val finalScore = ((earnedPoints.toDouble() / maxWeight) * 100).toInt().coerceIn(0, 100)

        val tier = when {
            finalScore >= 85 -> "TITANIUM"
            finalScore >= 70 -> "HIGH_PERFORMANCE"
            finalScore >= 55 -> "CONSISTENT"
            finalScore >= 40 -> "NEUTRAL"
            else -> "CRITICAL"
        }

        _uiState.value = _uiState.value.copy(
            currentScore = finalScore,
            currentTier = tier
        )
    }

    fun saveDailyLog() {
        viewModelScope.launch {
            // Salva na Room Database / SQLite
        }
    }
}
`;

  const geminiCode = `// ==========================================
// 4. GeminiMindsetService.kt (Google GenAI Android SDK)
// Integração do Gemini API no Android Studio
// build.gradle: implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
// ==========================================
package com.mindsetscore.app.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.GoogleGenerativeAIException

class GeminiMindsetService(apiKey: String) {

    private val generativeModel = GenerativeModel(
        // Utilize o modelo estável padrão do SDK do Android
        modelName = "gemini-1.5-flash", 
        apiKey = apiKey
    )

    suspend fun analyzeWeeklyProgression(
        weeklyLogsJson: String,
        indicatorsList: String,
        userQuestion: String? = null
    ): String {
        // Validação básica para evitar requisições sem contexto
        if (weeklyLogsJson.isBlank() && indicatorsList.isBlank()) {
            return "Nenhum dado diário ou indicador foi encontrado para análise."
        }

        val prompt = """
            Você é um Mentor de Alta Performance e Mindset Score.
            Analise os seguintes dados do usuário:
            
            Indicadores: $indicatorsList
            Registros Diários: $weeklyLogsJson
            
            Pergunta/Contexto do Usuário: \${userQuestion ?: "Análise geral de progresso"}
            
            Responda de forma clara:
            1. Avaliação de progresso ou estagnação.
            2. Dias com melhor comportamento.
            3. Correlação entre ações e ganhos financeiros.
            4. 3 ações práticas de ajuste.
        """.trimIndent()

        return try {
            val response = generativeModel.generateContent(prompt)
            response.text ?: "O modelo gerou uma resposta vazia por restrição de conteúdo."
        } catch (e: GoogleGenerativeAIException) {
            "Erro na comunicação com a API do Gemini: \${e.localizedMessage}"
        } catch (e: Exception) {
            "Erro inesperado ao processar análise."
        }
    }
}
`;

  const getActiveCode = () => {
    switch (selectedSnippet) {
      case 'compose':
        return composeCode;
      case 'room':
        return roomCode;
      case 'viewmodel':
        return viewmodelCode;
      case 'gemini':
        return geminiCode;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111114] border border-[#1e293b] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Estrutura Kotlin para Android Studio
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Jetpack Compose + Room + Gemini SDK
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Copie os blocos de código prontos para implementar no seu projeto no Android Studio com a mesma lógica de botões, pontuação, banco de dados e IA.
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(getActiveCode(), selectedSnippet)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all self-start md:self-auto"
          >
            {copiedSection === selectedSnippet ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Código Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snippet Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#111114] rounded-2xl border border-[#1e293b]">
        <button
          onClick={() => setSelectedSnippet('compose')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSnippet === 'compose'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. ActionButtonsScreen.kt (UI Compose)</span>
        </button>

        <button
          onClick={() => setSelectedSnippet('viewmodel')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSnippet === 'viewmodel'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>2. MindsetScoreViewModel.kt (Lógica de Score)</span>
        </button>

        <button
          onClick={() => setSelectedSnippet('room')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSnippet === 'room'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>3. DailyLogEntity.kt (Banco Room)</span>
        </button>

        <button
          onClick={() => setSelectedSnippet('gemini')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedSnippet === 'gemini'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>4. GeminiMindsetService.kt (Google GenAI)</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-2xl bg-[#080809] border border-[#1e293b] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111114] border-b border-[#1e293b] text-xs text-slate-400 font-mono">
          <span>Kotlin (Android Studio)</span>
          <button
            onClick={() => copyToClipboard(getActiveCode(), selectedSnippet)}
            className="hover:text-white flex items-center gap-1 transition-colors"
          >
            {copiedSection === selectedSnippet ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <pre className="p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-400/90 leading-relaxed max-h-[600px] overflow-y-auto">
          <code>{getActiveCode()}</code>
        </pre>
      </div>
    </div>
  );
};
