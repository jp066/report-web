import type { Relatorio } from "../types/relatorio";
import { ButtonReport } from "../elements/buttonTypes";
import { generateReport } from "../services/api";
import { useState } from "react"; 

interface RelatorioCardProps {
  relatorio: Relatorio;
}

export default function RelatorioCard({ relatorio }: RelatorioCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

        if (isNaN(reportId)) {
          throw new Error(
            `ID do relatório inválido: "${relatorio.codigo_relatorio}". Use o campo id_interno que contém apenas números.`
          );
        }

        console.log(`Iniciando geração do relatório ID: ${reportId}`);
        const result = await generateReport(reportId);
        console.log("Relatório gerado com sucesso:", result);

        // Adiciona à fila de downloads
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
            new Date().toISOString()
          );
        } catch (e) {
          console.warn("Não foi possível atualizar a fila de downloads:", e);
        }

        // Para a animação de loading
        setIsGenerating(false);

        setSuccess(
          "Relatório gerado com sucesso! Verifique a Fila de Relatórios."
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
            <span className="font-medium">Código:</span>{" "}
            {relatorio.codigo_relatorio}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">ID:</span> {relatorio.id_interno}
          </p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <time className="text-xs text-gray-500 dark:text-gray-400">
            {/* aqui era pra ser o nome do relatorio */}
            {formatDate(relatorio.data_atualizacao)}
          </time>
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
          <ButtonReport onClick={handleGenerateReport} disabled={isGenerating} className="m-auto">
            {isGenerating ? "Gerando..." : "Gerar Relatório"}
          </ButtonReport>
        </div>
      </div>
    </article>
  );
}
