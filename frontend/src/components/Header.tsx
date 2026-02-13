import { useEffect, useState } from "react";
import ModalNotification from "./ModalNotification";
import { IoMdLogOut } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { useAuth } from "../hooks/useAuth";
import { curr_user, handleDownload, api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { HiMiniQueueList } from "react-icons/hi2";
import { TbReportSearch } from "react-icons/tb";

export default function Header() {
  const { signOut } = useAuth();
  const [curr_user_data, setCurrUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const getPrefix = (name?: string) => {
    if (!name) return "";

    const firstName = name.trim().split(/\s+/)[0].toUpperCase();

    const feminineNames = [
      "ANA",
      "AMANDA",
      "ALICE",
      "ALINE",
      "ADELANY",
      "ÁDRIA",
      "ADRIELLE",
      "AGATA",
      "ÁGUILA",
      "ALANA",
      "ALESSANDRA",
      "ANDREA",
      "ANDRÉA",
      "ANDRESSA",
      "ANGELICA",
      "ANGÉLICA",
      "ANGELINA",
      "ANIELE",
      "ANIELLE",
      "ANNA",
      "ANNICELIA",
      "ANTONIA",
      "ANTÔNIA",
      "ARYANE",
      "BEATRICE",
      "BEATRIZ",
      "BIANCA",
      "BRENDA",
      "BRUNA",
      "CAMILA",
      "CAROLINA",
      "CATARINA",
      "CATHARINA",
      "CAULINE",
      "CECÍLIA",
      "CINTHYA",
      "CLARA",
      "CONCEIÇÃO",
      "CRISTIANE",
      "DANIELA",
      "DÉBORA",
      "EDUARDA",
      "ELIANE",
      "EMANUELLA",
      "FABIANA",
      "FERNANDA",
      "FLÁVIA",
      "GABRIELA",
      "GIOVANNA",
      "HELENA",
      "ISABELA",
      "JESSICA",
      "JÉSSICA",
      "JOANA",
      "JULIANA",
      "KAREN",
      "LARISSA",
      "LETÍCIA",
      "LÍVIA",
      "LORENA",
      "LUANA",
      "LUCIANA",
      "LUÍSA",
      "LUIZA",
      "MÁRCIA",
      "MARIANA",
      "MARINA",
      "MELISSA",
      "MICHELE",
      "MÔNICA",
      "NATÁLIA",
      "PATRICIA",
      "PATRÍCIA",
      "PAULA",
      "PRISCILA",
      "RAQUEL",
      "RENATA",
      "ROBERTA",
      "SABRINA",
      "SANDRA",
      "SARA",
      "SARAH",
      "SILVIA",
      "SOFIA",
      "SOPHIA",
      "TAÍS",
      "TATIANA",
      "THAÍS",
      "VALENTINA",
      "VANESSA",
      "VERÔNICA",
      "VITÓRIA",
      "VIVIANE",
    ];

    const masculineNames = [
      "ABDIEL",
      "ADEMAR",
      "ALCIDES",
      "ALEX",
      "ALEXANDRE",
      "ALFREDO",
      "ALISON",
      "ANDERSON",
      "ANDRE",
      "ANDRÉ",
      "ANTONIO",
      "ANTÔNIO",
      "ARTHUR",
      "ARTUR",
      "AUGUSTO",
      "AURICELIO",
      "BENICIO",
      "BENÍCIO",
      "BENJAMIN",
      "BERNARDO",
      "BRUNO",
      "CAIO",
      "CALLEBE",
      "CARLOS",
      "CLAUDIO",
      "CLÁUDIO",
      "DANIEL",
      "DAVID",
      "DIEGO",
      "EDUARDO",
      "EMANUEL",
      "ERICK",
      "FABIO",
      "FÁBIO",
      "FELIPE",
      "FERNANDO",
      "FRANCISCO",
      "GABRIEL",
      "GUILHERME",
      "GUSTAVO",
      "HENRIQUE",
      "HUGO",
      "IGOR",
      "ISAAC",
      "JOÃO",
      "JOSE",
      "JOSÉ",
      "LEONARDO",
      "LUCAS",
      "LUIS",
      "LUÍS",
      "LUIZ",
      "MARCELO",
      "MARCOS",
      "MATEUS",
      "MATHEUS",
      "MIGUEL",
      "MURILO",
      "NATHAN",
      "NICOLAS",
      "NICOLÁS",
      "PAULO",
      "PEDRO",
      "RAFAEL",
      "RAUL",
      "RAÚL",
      "RENAN",
      "RICARDO",
      "ROBERTO",
      "RODRIGO",
      "SAMUEL",
      "THIAGO",
      "VICTOR",
      "VINICIUS",
      "VINÍCIUS",
      "VITOR",
      "WESLEY",
    ];

    if (feminineNames.includes(firstName)) {
      return "Ms. ";
    } else {
      if (masculineNames.includes(firstName)) {
        return "Mr. ";
      }
    }

    const feminineEndings = ["A", "E"];
    const masculineEndings = ["O", "L", "R"];

    if (feminineEndings.some((ending) => firstName.endsWith(ending))) {
      return "Ms. ";
    }

    if (masculineEndings.some((ending) => firstName.endsWith(ending))) {
      return "Mr. ";
    }

    return "Ms. ";
  };

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        setLoadingUser(true);
        const data = await curr_user();
        setCurrUserData(data);
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        const cachedUser = sessionStorage.getItem("usuario");
        if (cachedUser) {
          try {
            setCurrUserData(JSON.parse(cachedUser));
          } catch {
            setCurrUserData(null);
          }
        }
      } finally {
        setLoadingUser(false);
      }
    }
    fetchCurrentUser();
  }, []);

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadQueue, setDownloadQueue] = useState<any[]>([]);

  const loadDownloadQueue = () => {
    try {
      const raw = sessionStorage.getItem("download_queue");
      const parsed = raw ? JSON.parse(raw) : [];
      setDownloadQueue(parsed);
    } catch (e) {
      console.error("Erro ao carregar fila de downloads:", e);
      setDownloadQueue([]);
    }
  };

  const downloadReport = async (item: any) => {
    try {
      if (!item || !item.guid) {
        throw new Error("Item inválido para download");
      }

      // Tenta obter o chunk completo usando guid e file_size
      // O backend espera POST /report/chunk/ com query params guid e size
      const size = item.file_size || 0;
      const resp = await api.post("/report/chunk/", null, {
        params: { guid: item.guid, size },
      });

      const b64 = resp?.data?.chunk_data ?? resp?.data;
      if (!b64) {
        throw new Error("Resposta do servidor não contém dados do arquivo");
      }

      // Agora chama o endpoint de exportação que espera { b64: string }
      await handleDownload({
        url: "/report/export",
        method: "post",
        data: { b64 },
        filename: item.nome_relatorio
          ? `${item.nome_relatorio}.pdf`
          : `${item.nome_relatorio}.pdf`,
      });
    } catch (err) {
      console.error("Erro ao baixar relatório:", err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/0 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("configuracoes")} // /settings
                className="mr-4 cursor-pointer hover:scale-110 transition-all flex items-center justify-center "
                title="Configurações"
              >
                <IoMdSettings className="w-8 h-8 text-2xl mr-2 text-bee-yellow dark:text-yellow-400 rounded-full hover:w-10 hover:h-10 transition-all" />
              </button>
              <button
                onClick={signOut}
                className="cursor-pointer hover:scale-110 w-10 h-10 rounded-full flex items-center justify-center text-xl font-semibold text-gray-700 dark:text-gray-300 transition-all"
                title="Deslogar"
              >
                <IoMdLogOut className="cursor-pointer hover:scale-110 w-10 h-10 rounded-full flex items-center justify-center text-xl font-semibold text-bee-yellow dark:text-yellow-400 transition-all" />
              </button>
              <div className="flex flex-col ml-2">
                <span
                  title="Usuário logado"
                  className="text-sm font-semibold text-gray-800 dark:text-white"
                >
                  {loadingUser ? (
                    "Carregando..."
                  ) : (
                    <pre className="inline bg-bee-yellow dark:bg-bee-yellow text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-700 font-semibold">
                      {" "}
                      {getPrefix(curr_user_data?.nome)}{" "}
                      {curr_user_data?.nome ?? "Usuário"}{" "}
                    </pre>
                  )}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div></div>{" "}
            <div className="flex items-center gap-5">
              {" "}
              <nav>
                {" "}
                <button
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
                  onClick={() => {
                    navigate("/");
                  }}
                >
                  {" "}
                  <TbReportSearch className="w-6 h-6 text-gray-900 dark:text-white hover:text-yellow-300" />{" "}
                </button>{" "}
                <div className="w-full text-center mt-1">
                  {" "}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {" "}
                    Relatórios{" "}
                  </span>{" "}
                </div>{" "}
              </nav>{" "}
              <nav>
                {" "}
                <button
                  onClick={() => {
                    loadDownloadQueue();
                    setIsDownloadOpen(true);
                  }}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
                >
                  {" "}
                  <HiMiniQueueList className="w-6 h-6 text-gray-900 dark:text-white hover:text-yellow-300" />{" "}
                </button>{" "}
                <div className="w-full text-center mt-1">
                  {" "}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {" "}
                    Fila de relatórios{" "}
                  </span>{" "}
                </div>{" "}
              </nav>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      <ModalNotification
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        title="Fila de Relatórios"
        message="Selecione um relatório da lista para fazer o download."
        type="success"
      >
        {" "}
        <div className="space-y-3">
          {downloadQueue.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum relatório na fila.</p>
          ) : (
            downloadQueue.map((item, idx) => (
              <div
                key={`${item.guid}-${idx}`}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {item.nome_relatorio || item.codigo_relatorio}
                  </p>
                  <p className="text-xs text-gray-500">
                    GUID: <span className="font-mono">{item.guid}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Adicionado: {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="cursor-pointer bg-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-700 text-white transition-colors"
                    onClick={() => downloadReport(item)}
                  >
                    Baixar
                  </button>
                  <button
                    className="cursor-pointer px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                    onClick={() => {
                      const raw = sessionStorage.getItem("download_queue");
                      const q = raw ? JSON.parse(raw) : [];
                      const newQ = q.filter(
                        (qitem: any) => qitem.guid !== item.guid,
                      );
                      sessionStorage.setItem(
                        "download_queue",
                        JSON.stringify(newQ),
                      );
                      setDownloadQueue(newQ);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ModalNotification>
    </>
  );
}
