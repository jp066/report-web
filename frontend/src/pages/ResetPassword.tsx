import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ButtonLogin } from "../elements/buttonTypes";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de recuperação inválido ou ausente.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validações
    if (newPassword.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token inválido. Solicite um novo link de recuperação.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setMessage("Senha alterada com sucesso! Redirecionando para login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Redefinir Senha</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Digite sua nova senha abaixo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite novamente"
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            <div className="flex items-center">
              <div>
                
              </div>
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Mostrar senha
              </label>
            </div>

            {message && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-sm text-emerald-700 dark:text-emerald-300">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <ButtonLogin type="submit" disabled={!token || isLoading} className="flex-1">
                {isLoading ? "Alterando..." : "Redefinir Senha"}
              </ButtonLogin>
              <button type="button" onClick={() => navigate("/login")} className="buttonAlt">
                Voltar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
