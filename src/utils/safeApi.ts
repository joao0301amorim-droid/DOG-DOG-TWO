/**
 * Utilitário seguro para requisições HTTP e tratamento de JSON.
 * Evita erros como "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * ao lidar com respostas vazias, status de erro ou payloads não-JSON.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data?: T;
  error?: string;
  rawBody?: string;
}

/**
 * Executa uma chamada fetch de forma segura, verificando response.ok,
 * checando se o corpo está vazio antes de parsear, e tratando JSON inválido.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const status = res.status;
    const statusText = res.statusText;
    const contentType = res.headers.get('content-type') || '';

    // Ler como texto primeiro para inspecionar com segurança
    const rawText = await res.text();

    // 1. Tratamento de resposta vazia
    if (!rawText || rawText.trim().length === 0) {
      console.error(`[safeFetchJson] Resposta vazia recebida de ${url}:`, {
        status,
        statusText,
        contentType,
      });

      return {
        ok: false,
        status,
        statusText,
        error: !res.ok
          ? `O servidor retornou status ${status} (${statusText || 'sem mensagem'}) com corpo vazio.`
          : 'O servidor retornou uma resposta vazia.',
        rawBody: '',
      };
    }

    // 2. Parse seguro do JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr: any) {
      console.error(`[safeFetchJson] Falha ao processar JSON de ${url}:`, {
        status,
        statusText,
        contentType,
        rawPreview: rawText.slice(0, 300),
        parseError: parseErr?.message || parseErr,
      });

      return {
        ok: false,
        status,
        statusText,
        error: `Resposta do servidor não está em formato JSON válido (Status ${status}).`,
        rawBody: rawText,
      };
    }

    // 3. Verificação de status HTTP (response.ok)
    if (!res.ok) {
      const serverErrorMessage =
        parsed?.error ||
        parsed?.message ||
        `Erro na requisição (Status HTTP ${status}).`;

      console.error(`[safeFetchJson] Erro retornado pelo servidor em ${url}:`, {
        status,
        statusText,
        serverError: serverErrorMessage,
        parsedData: parsed,
      });

      return {
        ok: false,
        status,
        statusText,
        data: parsed,
        error: serverErrorMessage,
        rawBody: rawText,
      };
    }

    // 4. Verificação de erro de negócio mesmo com status 200
    if (parsed && typeof parsed === 'object' && parsed.success === false && parsed.error) {
      console.warn(`[safeFetchJson] Sucesso falso reportado por ${url}:`, parsed);
      return {
        ok: false,
        status,
        statusText,
        data: parsed,
        error: parsed.error,
        rawBody: rawText,
      };
    }

    return {
      ok: true,
      status,
      statusText,
      data: parsed as T,
      rawBody: rawText,
    };
  } catch (networkErr: any) {
    console.error(`[safeFetchJson] Exceção de rede ou conexão em ${url}:`, networkErr);

    return {
      ok: false,
      status: 0,
      statusText: 'Network / Connection Error',
      error:
        networkErr?.name === 'AbortError'
          ? 'A requisição demorou muito e foi cancelada por tempo limite.'
          : 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      rawBody: '',
    };
  }
}
