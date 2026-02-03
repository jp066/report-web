import React from "react";
import { useState, useEffect } from "react";
import { get2faQrCode } from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

const ShowQrCode: React.FC = () => {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isActivated2fa, setIsActivated2fa] = useState(false);
  const [isTokenGeneratedClick, setIsTokenGeneratedClick] = useState(false);
  const [valorSecret, setvalorSecret] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQrCode() {
      try {
        const qrCodeBlob = await get2faQrCode();
        const qrCodeUrl = URL.createObjectURL(qrCodeBlob);
        setQrCode(qrCodeUrl);
      } catch (error: any) {
        console.error("Erro ao buscar o QR Code 2FA:", error);
        const errorMessage =
          error.message ||
          "Não foi possível carregar o QR Code. Tente novamente ou contate o suporte.";
        setQrError(errorMessage);
      }
    }
    setIsActivated2fa(false);
    setIsTokenGeneratedClick(false);
    fetchQrCode();
  }, []);

  useEffect(() => {
    if (isTokenGeneratedClick) {
      const timer = setTimeout(() => {
        const generatedToken = "123456";
        setvalorSecret(generatedToken);
        setIsActivated2fa(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTokenGeneratedClick]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className="cursor-pointer absolute top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            aria-label="Voltar"
          >
            <FaArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Escaneie o QR Code
          </h2>
          <p className="text-md text-gray-600 dark:text-gray-400 mb-4">
            Use seu aplicativo autenticador (Microsoft Authenticator) para
            escanear o QR Code abaixo e ativar o 2FA.
          </p>
          {qrError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-6">
              <p className="text-red-600 dark:text-red-400 font-semibold text-lg mb-2">
                Erro ao carregar QR Code
              </p>
              <p className="text-red-700 dark:text-red-300">{qrError}</p>
            </div>
          ) : qrCode ? (
            <img
              src={qrCode}
              alt="QR Code para 2FA"
              className="mx-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow"
              style={{ width: 220, height: 220 }}
            />
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Gerando QR Code, aguarde...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Isso pode levar até 60 segundos na primeira vez
              </p>
            </div>
          )}

          {/* Quando o usuário tem ativo o 2FA */}
          {isActivated2fa && (
            <>
              <button
                onClick={() => {
                  navigate("/2fa/validate");
                }}
                className="buttonLogin w-full mt-2 cursor-not-allowed disabled:opacity-50"
              >
                Ir para validação 2FA
              </button>
              <h3 className="text-md text-green-600">
                Autenticação em duas etapas ativada com sucesso!
              </h3>
            </>
          )}

          {/* Quando o usuário não tem ativo o 2FA */}
          {!isActivated2fa && (
            <>
              <h3 className="mt-2 text-md text-red-600">
                Vejo que seu usuario ainda não ativou a autenticação em duas
                etapas. Para isso,{" "}
                <a
                  className="cursor-pointer"
                  onClick={() => {
                    setIsTokenGeneratedClick(true);
                  }}
                >
                  clique aqui.
                </a>
              </h3>
              <h4>
                {isTokenGeneratedClick && valorSecret
                  ? `Seu secret foi gerado e adicionado ao seu usuário, esse secret é único e identifica unicamente seu usuário no sistema TOTP.`
                  : "Aguarde o código ser gerado ao clicar no link acima."}
              </h4>
              <button
                onClick={() => navigate("/2fa/validate")}
                className="buttonLogin w-full cursor-text disabled:opacity-50"
                disabled={!isActivated2fa}
              >
                Ir para validação 2FA
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowQrCode;
