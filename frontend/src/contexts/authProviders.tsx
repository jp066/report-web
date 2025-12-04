import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthContext } from "./authContexts";
import type { Usuario } from "../types/usuario";
import { api, curr_user } from "../services/api";
import { useNavigate } from "react-router-dom";
import { login_user } from "../services/api";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [authLoading, setAuthLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !usuario) {
      curr_user()
        .then(user => setUsuario(user))
        .catch(() => setUsuario(null))
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, [usuario])

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <span className="text-gray-600 dark:text-gray-300">
        Autenticando...
      </span>
    </div>;
  }

  async function signIn(email: string, senha: string) {
    const response = await login_user(email, senha);
    const { usuario, access_token, refresh_token } = response;
    setUsuario(usuario);
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
  }

  function signOut() {
      setUsuario(null);
      api.defaults.headers.common.Authorization = "";
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("relatorios");
      sessionStorage.removeItem("show2faModal");
      navigate("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
