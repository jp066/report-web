import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthContext } from "./authContexts";
import type { Usuario } from "../types/usuario";
import { api, curr_user, signup_user } from "../services/api";
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
    let isMounted = true;
    
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        // Não tem token, não está autenticado
        if (isMounted) setAuthLoading(false);
        return;
      }
      
      try {
        // Tem token, tenta buscar usuário
        const user = await curr_user();
        if (isMounted) {
          setUsuario(user);
          console.log("✅ Usuário autenticado:", user);
        }
      } catch (error) {
        if (isMounted) {
          console.error("❌ Erro ao buscar usuário:", error);
          // Limpa tokens inválidos
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          sessionStorage.removeItem("usuario");
          setUsuario(null);
          // Redireciona para login apenas se não estiver na página de login
          if (window.location.pathname !== "/login") {
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <span className="text-gray-600 dark:text-gray-300">
        Autenticando...
      </span>
    </div>;
  }

  async function signIn(email: string, senha: string) {
    const response = await login_user(email, senha);
    const { usuario, access_token/*, refresh_token*/ } = response;
    setUsuario(usuario);
    
    // Salva usuário no sessionStorage
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
  }

  async function signUp(email: string, senha: string) {
    await signup_user(email, senha);    
  }

  function signOut() {
      setUsuario(null);
      api.defaults.headers.common.Authorization = "";
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("relatorios");
      sessionStorage.removeItem("show2faModal");
      sessionStorage.removeItem("usuario");
      navigate("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
