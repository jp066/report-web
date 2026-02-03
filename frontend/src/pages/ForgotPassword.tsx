import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonLogin } from "../elements/buttonTypes";
import { requestPasswordReset } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token/*, setToken*/] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      await requestPasswordReset(email, token);
      console.log("Password reset request sent");
      console.log(`Password reset requested for email: ${email}`);
      setMessage(
        "Se o email existir em nosso sistema, você receberá instruções para alterar a senha."
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Erro ao solicitar alteração de senha"
      );
    } finally {
      setIsLoading(false);
    }
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center">Recuperar senha</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Digite o e-mail associado à sua conta e enviaremos instruções para redefinir sua senha.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@brightbee.com.br"
                autoFocus
              />
            </div>

            {message && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-sm text-emerald-700">{message}</div>}
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700">{error}</div>}

            <div className="flex gap-2">
              <ButtonLogin type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Enviando..." : "Enviar instruções"}
              </ButtonLogin>
              <button type="button" onClick={() => navigate(-1)} className="buttonAlt">Voltar</button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">Bright Bee & Bright Bee School © {new Date().getFullYear()}.</p>
      </div>
    </div>
  );
}
