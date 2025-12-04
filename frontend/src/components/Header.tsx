import type { Relatorio } from "../types/relatorio";
import { useEffect, useState } from "react";
import ModalNotification from "./ModalNotification";
import { ButtonDownload, ButtonHeader } from "../elements/buttonTypes";
import { IoMdLogOut } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { useAuth } from "../hooks/useAuth";
import { curr_user } from "../services/api";
import { useNavigate } from "react-router-dom";


export default function Header() {
  const { signOut } = useAuth();
  const [curr_user_data, setCurrUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCurrentUser() {
      const data = await curr_user();
      setCurrUserData(data);
    }
    fetchCurrentUser();
  }, []);

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/0 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/settings")}
                className="mr-4 cursor-pointer"
                title="Configurações"
              >
                <IoMdSettings className="w-8 h-8 text-2xl mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-300 hover:bg-gray-700 rounded-full hover:w-10 hover:h-10 transition-all" />
              </button>
              <button
                onClick={signOut}
                className="mr-4 cursor-pointer"
                title="Deslogar"
              >
                <IoMdLogOut className="w-8 h-8 text-2xl mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-300 hover:bg-gray-700 rounded-full hover:w-10 hover:h-10 transition-all" />
              </button>
              <div className="flex flex-col ml-2">
                <span title="Usuário logado" className="text-sm font-semibold text-gray-800 dark:text-white">
                  {curr_user_data ? curr_user_data.nome : ""}
                </span>
                {curr_user_data && curr_user_data.email && (
                  <span className="text-xs text-gray-500 dark:text-gray-300">{curr_user_data.email}</span>
                )}
              </div>
            </div>
            <div>
            </div>

            <div className="flex items-center gap-2">
              <nav>
                <ButtonHeader
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors"
                  onClick={() => navigate("/")}
                >
                  Relatórios
                </ButtonHeader>
              </nav>
              <nav>
                <ButtonDownload
                  onClick={() => setIsDownloadOpen(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Fila de Relatórios
                </ButtonDownload>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <ModalNotification
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        title="Fila de Relatórios"
        message="Selecione um relatório da lista para fazer o download."
        type="info"
      />
    </>
  );
}
