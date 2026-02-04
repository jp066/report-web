import Header from "../components/Header";
import { useState, useEffect } from "react";
import { curr_user } from "../services/api";
import { FiEdit } from "react-icons/fi";
import { FiSave, FiX } from "react-icons/fi";
import Switch from "../components/Switch";
import { PiPasswordBold } from "react-icons/pi";

export default function SettingsPage() {
  const [largeFiles, setLargeFiles] = useState(false);
  const [autoChunk, setAutoChunk] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  /*  const userData = (() => {
    try {
      const raw = sessionStorage.getItem("usuario");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();*/
  const [user, setUser] = useState<{ nome?: string; email?: string }>({});
  const [editField, setEditField] = useState<null | "nome" | "email" | "senha">(
    null,
  );
  const [editValues, setEditValues] = useState<{
    nome: string;
    email: string;
    senha: string;
  }>({ nome: "", email: "", senha: "" });

  useEffect(() => {
    curr_user()
      .then((data) => {
        setUser(data);
        setEditValues({
          nome: data.nome || "",
          email: data.email || "",
          senha: "",
        });
      })
      .catch(() => setUser({}));
  }, []);

  function handleEditClick(field: "nome" | "email" | "senha") {
    setEditField(field);
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditBlur(field: "nome" | "email" | "senha") {
    setEditField(null);
    setUser((prev) => ({ ...prev, [field]: editValues[field] }));
  }

  function handleEditKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "nome" | "email" | "senha",
  ) {
    if (e.key === "Enter") {
      setEditField(null);
      setUser((prev) => ({ ...prev, [field]: editValues[field] }));
    }
  }

  useEffect(() => {
    curr_user()
      .then(setUser)
      .catch(() => setUser({}));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <div className="flex flex-row w-full">
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-8 px-6">
          <nav className="fixed space-y-4">
            <a
              href="#conta"
              className="block text-gray-700 dark:text-gray-200 hover:underline"
            >
              Conta
            </a>
            <a
              href="#preferencias"
              className="block text-gray-700 dark:text-gray-200 hover:underline"
            >
              Preferências
            </a>
          </nav>
        </aside>
        <div className="opacity-40 pointer-events-none">
          <main className="flex-1 py-12 px-12">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Configurações da Conta
            </h1>
            <form className="space-y-8 max-w-2xl">
              <section id="conta" className="space-y-4 scroll-mt-6 pt-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Conta
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Nome
                  </label>
                  <div className="mt-1 flex items-center w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2">
                    {editField === "nome" ? (
                      <input
                        type="text"
                        name="nome"
                        className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100"
                        value={editValues.nome}
                        autoFocus
                        onChange={handleEditChange}
                        onBlur={() => handleEditBlur("nome")}
                        onKeyDown={(e) => handleEditKeyDown(e, "nome")}
                      />
                    ) : (
                      <>
                        <span className="flex-1">
                          {user.nome || (
                            <span className="text-gray-200">
                              (não informado)
                            </span>
                          )}
                        </span>
                        <FiEdit
                          className="ml-2 text-sm hover:text-blue-600 dark:hover:text-blue-300 font-medium underline cursor-pointer transition-all duration-200"
                          size={18}
                          title="Editar nome"
                          onClick={() => handleEditClick("nome")}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    E-mail
                  </label>
                  <div className="mt-1 flex items-center w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2">
                    {editField === "email" ? (
                      <input
                        type="email"
                        name="email"
                        className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100"
                        value={editValues.email}
                        autoFocus
                        onChange={handleEditChange}
                        onBlur={() => handleEditBlur("email")}
                        onKeyDown={(e) => handleEditKeyDown(e, "email")}
                      />
                    ) : (
                      <>
                        <span className="flex-1">
                          {user.email || (
                            <span className="text-gray-200">
                              (não informado)
                            </span>
                          )}
                        </span>
                        <FiEdit
                          className="ml-2 text-sm hover:text-blue-600 dark:hover:text-blue-300 font-medium underline cursor-pointer transition-all duration-200"
                          size={18}
                          title="Editar e-mail"
                          onClick={() => handleEditClick("email")}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Senha
                  </label>
                  <div className="mt-1 flex items-center w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2">
                    <span className="flex-1 text-gray-400">••••••••</span>
                    <button
                      type="button"
                      onClick={() =>
                        (window.location.href = "/forgot-password")
                      }
                      className="ml-2 text-sm hover:text-blue-600 dark:hover:text-blue-300 font-medium underline cursor-pointer transition-all duration-200"
                    >
                      <PiPasswordBold className="inline-block mr-1" size={24} />
                    </button>
                  </div>
                </div>
              </section>
              <section id="preferencias" className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Preferências
                </h3>

                <div>
                  <Switch
                    checked={largeFiles}
                    onChange={setLargeFiles}
                    label="Gerar arquivos grandes"
                    description="(acima de 100MB)"
                    id="largeFiles"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    Ative para permitir geração de relatórios grandes.
                  </span>
                </div>

                <div>
                  <Switch
                    checked={twoFA}
                    onChange={setTwoFA}
                    label="Ativar 2FA"
                    description=""
                    id="2fa"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    Recomendado para proteger sua conta contra acessos não
                    autorizados. Somente disponível se você já configurou um
                    autenticador.
                  </span>
                </div>

                <div>
                  <Switch
                    checked={autoChunk}
                    onChange={setAutoChunk}
                    label="Auto-incrementar chunks de relatórios"
                    description=""
                    id="autoChunk"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    Divide relatórios grandes em partes menores automaticamente,
                    aumentando o tamanho dos chunks conforme necessário para
                    otimizar o download e evitar travamentos. Quando ativado, o
                    sistema ajusta o tamanho dos chunks automaticamente para
                    melhorar a performance do download de relatórios extensos.
                  </span>
                </div>
              </section>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="submit"
                  className="cursor-pointer flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <FiSave size={18} />
                  Salvar alterações
                </button>
                <button
                  type="button"
                  className="cursor-pointer flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 hover:from-red-400 hover:to-red-600 text-gray-800 dark:text-white font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <FiX size={18} />
                  Cancelar
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
