import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validate2fa } from "../services/api";
import { CodeInput } from "../components/inputMask";

const TwoFactorAuth: React.FC = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("O código deve ter 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await validate2fa(code);
      if (response.status === 200) {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Erro na validação 2FA:", err);
      setError(err.message || "Erro ao validar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
              <img
                src="../../public/favicon.ico"
                alt="Logo"
                className="w-12 h-12"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Validação em duas etapas
            </h2>
            <p className="text-md text-gray-600 dark:text-gray-400 mt-2">
              Insira o código gerado pelo seu aplicativo autenticador.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Código do autenticador
              </label>
              <CodeInput
                value={code}
                onChange={setCode}
                length={6}
              />
            </div>
            <button
              type="submit"
              className="buttonLogin w-full"
              disabled={isLoading}
            >
              {isLoading ? "Validando..." : "Validar"}
            </button>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <a
              onClick={() => navigate("/2fa/qrcode")}
              className="cursor-pointer text-blue-500 hover:underline block text-center mt-4"
            >
              Visualizar meu QR code
            </a>
            <a
              onClick={() => navigate("/login")}
              className="cursor-pointer text-blue-500 hover:underline block text-center mt-4"
            >
              Voltar
            </a>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
