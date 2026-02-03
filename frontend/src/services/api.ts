import axios, { AxiosError } from "axios";
import type { Relatorio } from "../types/relatorio";

const baseURL = import.meta.env.VITE_API_URL;
export const api = axios.create({
  baseURL: baseURL,
  timeout: 30000, // Aumentado para 30 segundos
  headers: {
    "Content-Type": "application/json",
  },
  // Inclui cookies (caso o backend use refresh token em cookie httpOnly)
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(err: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (err) {
      prom.reject(err);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

export async function renovate_token(): Promise<any> {
  try {
    const refToken = localStorage.getItem("refresh_token");
    if (!refToken) {
      throw new Error("Refresh token não encontrado");
    }
    const headers = {
      Authorization: `Bearer ${refToken}`,
      // Header customizado para sinalizar ao interceptor que não deve
      // sobrescrever o Authorization desta requisição de refresh
      "x-skip-auth": "true",
    };
    // Envia o refresh token também no corpo (alguns backends esperam assim)
    // e garante withCredentials para suportar refresh em cookie httpOnly.
    const response = await api.post(
      "/auth/refresh",
      { refresh_token: refToken },
      { headers, withCredentials: true },
    );
    const { access_token, refresh_token: new_refresh_token } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", new_refresh_token);
    return response.data;
  } catch (error) {
    // Se falhar o refresh, limpa os tokens
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    throw new Error(`Erro ao renovar token: ${error}`);
  }
}

export function setupInterceptors() {
  api.interceptors.request.use(
    (config) => {
      // Permite pular a injeção automática do access token quando
      // a requisição define o header customizado `x-skip-auth`.
      const skipAuth =
        config.headers &&
        (config.headers["x-skip-auth"] || config.headers["X-Skip-Auth"]);
      if (skipAuth) {
        // Remove o header auxiliar antes de enviar
        if (config.headers) {
          delete config.headers["x-skip-auth"];
          delete config.headers["X-Skip-Auth"];
        }
        return config;
      }

      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Verifica se há refresh_token antes de tentar renovar
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          console.log("⚠️ Sem refresh_token, não é possível renovar");
          // Limpa tudo
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          return Promise.reject(error);
        }

        // Se já está renovando, adiciona à fila
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve(token) {
                if (token && originalRequest.headers) {
                  originalRequest.headers["Authorization"] = `Bearer ${token}`;
                }
                resolve(api(originalRequest));
              },
              reject,
            });
          });
        }
        isRefreshing = true;
        try {
          console.log("🔄 Token expirado, renovando...");
          const refData = await renovate_token();
          const { access_token } = refData;

          localStorage.setItem("token", access_token);
          api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
          }

          console.log("✅ Token renovado com sucesso");
          return api(originalRequest);
        } catch (err) {
          console.error("❌ Falha ao renovar token:", err);
          processQueue(err, null);
          isRefreshing = false;

          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");

          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    },
  );
}
export async function fetchRelatorios(): Promise<Relatorio[]> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await api.get("/report", { headers });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Não autorizado. Por favor, faça login novamente.");
    }
    throw error;
  }
}

export async function curr_user(): Promise<any> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await api.get("/auth/me", { headers, timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error("Erro em curr_user:", error);
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Tempo limite excedido. Verifique se o servidor está rodando.",
        );
      }
      if (error.response?.status === 401) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
    }
    throw new Error(`Erro ao buscar usuário atual: ${error}`);
  }
}

export async function login_user(email: string, senha: string): Promise<any> {
  try {
    const response = await api.post("/auth/login", { email, senha });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao fazer login: ${error}`);
  }
}

export async function signup_user(email: string, senha: string): Promise<any> {
  try {
    const response = await api.post("/auth/signup", { email, senha });
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao fazer cadastro: ${error}`);
  }
}

export async function validate2fa(code: string): Promise<any> {
  try {
    const response = await api.post(
      "/auth/2fa/validate",
      { token: code },
      {
        timeout: 10000, // 10 segundos é suficiente para validação
      },
    );
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error("Timeout ao validar código. Verifique sua conexão.");
      }
      if (error.response?.status === 401) {
        throw new Error("Código inválido ou expirado.");
      }
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
    }
    throw new Error("Erro ao validar o código. Tente novamente.");
  }
}

export async function get2faQrCode(): Promise<any> {
  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    const response = await api.get("/auth/2fa/qrcode", {
      headers,
      responseType: "blob",
      timeout: 60000, // 60 segundos para gerar o QR Code pela primeira vez
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Se for erro 403, é porque o email não é @brightbee.com.br
      if (error.response.status === 403) {
        throw new Error(
          error.response.data?.detail ||
            "Apenas emails corporativos (@brightbee.com.br) podem usar autenticação de dois fatores.",
        );
      }
      throw new Error(error.response.data?.detail || error.message);
    }
    throw new Error(`Erro ao obter QR Code 2FA: ${error}`);
  }
}

export async function requestPasswordReset(
  email: string,
  token: string,
): Promise<any> {
  try {
    const response = await api.post("/auth/forgot-password", { email, token });
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || error.message);
    }
    throw new Error(String(error));
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<any> {
  try {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || error.message);
    }
    throw new Error(String(error));
  }
}

export async function generateReport(idReport: number): Promise<any> {
  try {
    const response = await api.post(
      `/report/generate/${idReport}`,
      {},
      {
        timeout: 60000,
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        if (Array.isArray(detail)) {
          const errorMsg = detail
            .map((err: any) => `${err.loc.join(".")}: ${err.msg}`)
            .join(", ");
          throw new Error(`Erro de validação: ${errorMsg}`);
        }
        throw new Error(error.response.data?.detail || "Erro de validação");
      }
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message);
    }
    throw new Error(`Erro ao gerar relatório: ${error}`);
  }
}

export async function handleDownload({
  baseURL,
  url = "/report/export",
  filename,
  method = "post",
  data = undefined,
  extraHeaders = undefined,
}: {
  baseURL?: string;
  url: string;
  filename?: string;
  method?: "get" | "post" | "put" | "delete";
  data?: any;
  extraHeaders?: Record<string, string> | undefined;
}): Promise<void> {
  try {
    if (!url) throw new Error("URL de download inválida");

    // Se url for absoluta (começa com http(s) ou //), usa-a como está.
    const isAbsolute = /^(https?:)?\/\//i.test(String(url));

    const downloadUrl = isAbsolute
      ? url
      : baseURL
        ? `${String(baseURL).replace(/\/$/, "")}/${String(url).replace(/^\//, "")}`
        : url;

    // Log útil para depuração (ver console): método, URL e payload
    // Remova ou ajuste em produção
    // eslint-disable-next-line no-console
    console.log("handleDownload ->", method.toUpperCase(), downloadUrl, data);

    const response = await api.request({
      url: downloadUrl,
      method,
      data,
      responseType: "blob",
      timeout: 30000,
      headers: extraHeaders,
    });

    if (response.status >= 400) {
      throw new Error(
        `Server returned ${response.status} ${response.statusText}`,
      );
    }

    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type: response.data?.type || "application/octet-stream",
          });

    // Tentativa de extrair filename do header Content-Disposition
    const contentDisp =
      response.headers?.["content-disposition"] ||
      response.headers?.["Content-Disposition"];
    const extractFilename = (cd?: string) => {
      if (!cd) return null;
      const m = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/.exec(cd);
      return m ? decodeURIComponent(m[1]) : null;
    };
    const suggestedName =
      filename || extractFilename(contentDisp) || "download";

    const link = document.createElement("a");
    const objectUrl = window.URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Erro ao fazer download: ${error.response.status} ${error.response.statusText}`,
      );
    }
    throw new Error(`Erro ao fazer download: ${error}`);
  }
}

export { baseURL };
