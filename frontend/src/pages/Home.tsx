import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { ButtonAlt, ButtonLogin } from "../elements/buttonTypes";
import { useNavigate } from "react-router-dom";
import ModalNotification from "../components/ModalNotification";
import type { Relatorio } from "../types/relatorio";
import { fetchRelatorios } from "../services/api";
import RelatorioCard from "../components/RelatorioCard";
import SkeletonCard from "../components/SkeletonCard";
import ErrorMessage from "../components/ErrorMessage";
import Header from "../components/Header";
import SearchComponent from "../components/SearchComponent";
//import { AuthContext } from "../contexts/authContexts";

export default function HomePage() {
  const [filteredRelatorios, setFilteredRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show2faModal, setShow2faModal] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    setFilteredRelatorios((prevRelatorios) =>
      prevRelatorios.filter((relatorio) =>
        relatorio.nome_sistema.toLowerCase().includes(lowerQuery)
      )
    );
  };

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRelatorios();

      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.data_atualizacao || 0).getTime();
        const dateB = new Date(b.data_atualizacao || 0).getTime();
        return dateB - dateA;
      });

      sessionStorage.setItem("relatorios", JSON.stringify(sorted));
      setFilteredRelatorios(sorted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar relatórios"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedRelatorios = sessionStorage.getItem("relatorios");
    if (cachedRelatorios) {
      setFilteredRelatorios(JSON.parse(cachedRelatorios));
      setLoading(false);
    } else {
      loadRelatorios();
    }
    if (sessionStorage.getItem("show2faModal") === "true") {
      setShow2faModal(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {loading
            ? "Carregando..."
            : `${filteredRelatorios.length} relatório(s) encontrado(s)`}
        </p>
        <SearchComponent onSearch={handleSearch} />
        {error ? (
          <ErrorMessage message={error} onRetry={loadRelatorios} />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredRelatorios.length === 0 ? (
          <>
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum relatório encontrado
              </h3>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRelatorios.map((relatorio) => (
              <RelatorioCard key={relatorio.guid} relatorio={relatorio} />
            ))}
          </div>
        )}
        {/* Modal de 2FA */}
        <ModalNotification
          isOpen={show2faModal}
          onClose={() => {
            setShow2faModal(false);
            sessionStorage.removeItem("show2faModal");
          }}
          title="Valide sua sessão"
          message="Para prosseguir a essa tela, valide sua sessão via Authenticator."
          type="info"
        >
          <div className="flex gap-2 mt-4">
            <ButtonLogin
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setShow2faModal(false);
                sessionStorage.removeItem("show2faModal");
                navigate("/2fa/validate");
              }}
            >
              OK
            </ButtonLogin>
            <ButtonAlt
              onClick={() => {
                setShow2faModal(false);
                sessionStorage.removeItem("show2faModal");
                sessionStorage.removeItem("relatorios");
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                signOut();
              }}
            >
              Fechar
            </ButtonAlt>
          </div>
        </ModalNotification>
      </main>
    </div>
  );
}
