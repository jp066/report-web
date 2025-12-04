import type { Relatorio } from "../types/relatorio";
import {ButtonReport } from "../elements/buttonTypes";

interface RelatorioCardProps {
  relatorio: Relatorio;
}

export default function RelatorioCard({ relatorio }: RelatorioCardProps) {
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

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
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
            {formatDate(relatorio.data_atualizacao)}
          </time>
        </div>
        <div className="flex items-center justify-between pt-12">
          <ButtonReport>Gerar Relatório</ButtonReport>
        </div>
      </div>
    </article>
  );
}
