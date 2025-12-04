import axios, { Axios, AxiosError } from "axios";
import type { Relatorio } from "../types/relatorio";

const baseURL = import.meta.env.VITE_API_URL;
export const api = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
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
    const token = localStorage.getItem("acess_token");
    if (!token) {
      throw new Error("Token de acesso não encontrado");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await api.post("/auth/refresh", {}, { headers });
    const { access_token, refresh_token: new_refresh_token } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", new_refresh_token);
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao renovar token: ${error}`);
  }
}

export function setupInterceptors() {
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refToken = localStorage.getItem("refresh_token");
        if (!refToken) {
          return Promise.reject(error);
        }

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
          const refData = await renovate_token();
          const { access_token } = refData;

          localStorage.setItem("token", access_token);
          api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          isRefreshing = false;

          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");

          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );
}

export async function fetchRelatorios(): Promise<Relatorio[]> {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await api.get("/report", { headers });
    if (response.status === 401) {
      throw new Error("Não autorizado. Por favor, faça login novamente.");
    }
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
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    const response = await api.get("/auth/me", { headers });
    return response.data;
  } catch (error) {
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

export async function validate2fa(code: string): Promise<any> {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
  const response = await api.post(
    "/auth/2fa/validate",
    { token: code },
    { headers }
  );
  if (response.status !== 200) {
    throw new Error("Código inválido");
  }
  return response;
}

export async function get2faQrCode(): Promise<any> {
  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    const response = await api.get("/auth/2fa/qrcode", {
      headers,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao obter QR Code 2FA: ${error}`);
  }
}

export { baseURL };
