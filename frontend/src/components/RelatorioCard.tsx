import type { Relatorio } from "../types/relatorio";
import { ButtonReport } from "../elements/buttonTypes";
import { generateReport } from "../services/api";
import { useState } from "react";
import { fetchParams } from "../services/api";

interface RelatorioCardProps {
  relatorio: Relatorio;
}

export default function RelatorioCard({ relatorio }: RelatorioCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [params, setParams] = useState<any>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não disponível";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Tentativa ${attempts}/${maxAttempts}`);
        console.log("Dados do relatório:", relatorio);
        console.log("id_interno raw:", relatorio.id_interno);

        const reportId = parseInt(relatorio.id_interno.trim(), 10);
        const codColigada = parseInt(relatorio.codigo_sistema.trim(), 10);
        console.log("Parâmetros a serem enviados:", paramValues);

        if (isNaN(reportId)) {
          throw new Error(
            `ID do relatório inválido: "${relatorio.codigo_relatorio}". Use o campo id_interno que contém apenas números.`,
          );
        }

        console.log(`Iniciando geração do relatório ID: ${reportId}`);
  const result = await generateReport(reportId, codColigada, paramValues);
        console.log("Relatório gerado com sucesso:", result);

        try {
          const queueRaw = sessionStorage.getItem("download_queue");
          const queue = queueRaw ? JSON.parse(queueRaw) : [];
          const item = {
            guid: result.guid,
            nome_relatorio: relatorio.nome_relatorio,
            codigo_relatorio: relatorio.codigo_relatorio,
            created_at: new Date().toISOString(),
            file_size: result.file_size || null,
          };
          queue.unshift(item);
          sessionStorage.setItem("download_queue", JSON.stringify(queue));
          sessionStorage.setItem(
            "download_queue_updated_at",
            new Date().toISOString(),
          );
        } catch (e) {
          console.warn("Não foi possível atualizar a fila de downloads:", e);
        }

        // Para a animação de loading
        setIsGenerating(false);

        setSuccess(
          "Relatório gerado com sucesso! Verifique a Fila de Relatórios.",
        );

        setTimeout(() => {
          setSuccess(null);
        }, 5000);

        return result;
      } catch (err: any) {
        console.error(`Erro na tentativa ${attempts}:`, err);

        if (attempts < maxAttempts) {
          console.log(`Aguardando 2 segundos antes de tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        console.error("Todas as tentativas falharam");
        setError(err.message || "Erro ao gerar relatório");
        setIsGenerating(false);
      }
    }
  };

  const handleConsultaParams = async () => {
    try {
      const reportId = parseInt(relatorio.id_interno.trim(), 10);
      const codColigada = parseInt(relatorio.codigo_sistema.trim(), 10);

      if (isNaN(reportId) || isNaN(codColigada)) {
        throw new Error("ID do relatório ou código da coligada inválido.");
      }

      const params = await fetchParams(reportId, codColigada);
      setParams(params);
      // inicializa valores padrão dos inputs se parâmetros vierem como lista de objetos
      if (Array.isArray(params)) {
        const initial: Record<string, string> = {};
        params.forEach((p: any, i: number) => {
          const name = typeof p === "string" ? `param_${i}` : (p.ParamName ?? p.Param ?? p.name ?? `param_${i}`);
          initial[name] = (p.Value ?? p.value ?? "") as string;
        });
        setParamValues(initial);
      } else if (params && params.parametros_requeridos) {
        const initial: Record<string, string> = {};
        params.parametros_requeridos.forEach((pn: any, i: number) => {
          // se backend retorna só nomes, inicializa vazio
          const name = typeof pn === "string" ? pn : (pn.ParamName ?? pn.name ?? `param_${i}`);
          initial[name] = "";
        });
        setParamValues(initial);
      }
      console.log("Parâmetros do relatório:", params);
    } catch (error) {
      console.error("Erro ao consultar parâmetros:", error);
    }
  };

  // Normaliza a propriedade `params` para facilitar renderização
  // Suporta os formatos:
  // - null
  // - array de parâmetros (ex.: [{ name, value }])
  // - objeto { filtros_disponiveis, parametros_requeridos }
  const normalizedParams = (() => {
    if (!params) return { paramArray: null, filtros: null };
    if (Array.isArray(params)) return { paramArray: params, filtros: null };
    // assume objeto com chaves em PT (retorno do backend)
    return {
      paramArray: params.parametros_requeridos ?? [],
      filtros: params.filtros_disponiveis ?? null,
    };
  })();

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden hover:scale-[1.02]">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {relatorio.nome_relatorio || "Relatório sem título"}
          </h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Código do relatorio:</span>{" "}
            {relatorio.codigo_relatorio}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Sistema:</span>{" "}
            {relatorio.nome_sistema}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">ID:</span> {relatorio.id_interno}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">ID do Sistema:</span>{" "}
            {relatorio.codigo_sistema}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Ultima atualização:</span>{" "}
            {formatDate(relatorio.data_atualizacao)}
          </p>
        </div>
        <div>
          <span className="block h-px bg-gray-100 dark:bg-gray-700"></span>
          <div className="flex justify-center items-center gap-4 mt-2">
            {normalizedParams.paramArray && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg shadow-inner">
                {normalizedParams.filtros && (
                  <div className="mb-2 text-xs text-gray-800 dark:text-gray-200">
                    <strong>Filtros disponíveis:</strong>
                    <pre className="text-gray-400 overflow-x-auto mt-1 text-xs">
                      {JSON.stringify(normalizedParams.filtros, null, 2) === "{}"
                        ? "Nenhum filtro disponível."
                        : JSON.stringify(normalizedParams.filtros, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                  {normalizedParams.paramArray.length > 0 ? (
                    normalizedParams.paramArray.map((param: any, index: number) => {
                      // o backend pode retornar objetos com diferentes chaves
                      const name = typeof param === "string"
                        ? param
                        : (param.ParamName ?? param.Param ?? param.name ?? `param_${index}`);
                      const value = paramValues[name] ?? (typeof param === "string" ? "" : (param.Value ?? param.value ?? ""));
                      return (
                        <div key={index}>
                          <label className="text-xs w-40 text-gray-600 dark:text-gray-300">{name}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setParamValues((prev) => ({ ...prev, [name]: e.target.value }))}
                            className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1 m-1 flex-1"
                            placeholder={name}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <pre className="text-gray-400 overflow-x-auto mt-1 text-xs">Nenhum parâmetro requerido.</pre>
                  )}
                </div>
              </div>
            )}
            {!params && (
              <span className="border text-lg rounded-full text-gray-200 dark:text-gray-200 shadow-lg transition-shadow">
                <button
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  onClick={handleConsultaParams}
                >
                  Consultar Filtros & Parâmetros
                </button>
              </span>
            )}
          </div>
          <p></p>
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-600 dark:text-green-400 text-sm">
              {success}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between pt-4">
          <ButtonReport
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="m-auto"
          >
            {isGenerating ? "Gerando..." : "Gerar Relatório"}
          </ButtonReport>
        </div>
      </div>
    </article>
  );
}
