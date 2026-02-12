import { ButtonAlt, ButtonHeader, ButtonReport } from "../elements/buttonTypes";
import type { Relatorio } from "../types/relatorio";
import React from "react";

interface RelatorioFiltersProps {
  relatorios: Relatorio[];
  setFilteredRelatorios: React.Dispatch<React.SetStateAction<Relatorio[]>>;
  loadRelatorios: () => Promise<void>;
}

export default function RelatorioFilters({ relatorios, setFilteredRelatorios, loadRelatorios }: RelatorioFiltersProps) {
  return (
    <div className="my-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <label className="text-sm text-gray-600 dark:text-gray-300 w-full sm:w-auto">
          Sistema
          <select
            className="mt-1 block w-full sm:w-56 px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-full border-gray-200 dark:border-gray-700"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setFilteredRelatorios(relatorios);
                return;
              }
              setFilteredRelatorios(
                relatorios.filter((r) => r.nome_sistema === val),
              );
            }}
          >
            <option value="">Todos os sistemas</option>
            {Array.from(new Set(relatorios.map((r) => r.nome_sistema))).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="text-sm text-gray-600 dark:text-gray-300 w-full sm:w-auto">
          Atualizado a partir de
          <input
            type="date"
            className="mt-1 block w-full sm:w-44 px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-full border-gray-200 dark:border-gray-700"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setFilteredRelatorios(relatorios);
                return;
              }
              const fromTime = new Date(val).setHours(0, 0, 0, 0);
              setFilteredRelatorios(
                relatorios.filter((r) => {
                  const t = new Date(r.data_atualizacao || 0).getTime();
                  return t >= fromTime;
                }),
              );
            }}
          />
        </label>

        <label className="text-sm text-gray-600 dark:text-gray-300 w-full sm:w-auto">
          Ordenar
          <select
            className="mt-1 block w-full sm:w-44 px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-full border-gray-200 dark:border-gray-700"
            onChange={(e) => {
              const v = e.target.value;
              const copy = [...relatorios];
              if (v === "recent") {
                copy.sort(
                  (a, b) =>
                    new Date(b.data_atualizacao || 0).getTime() -
                    new Date(a.data_atualizacao || 0).getTime(),
                );
              } else if (v === "old") {
                copy.sort(
                  (a, b) =>
                    new Date(a.data_atualizacao || 0).getTime() -
                    new Date(b.data_atualizacao || 0).getTime(),
                );
              }
              setFilteredRelatorios(copy);
            }}
          >
            <option value="">Padrão</option>
            <option value="recent">Mais recentes</option>
            <option value="old">Mais antigos</option>
          </select>
        </label>

        <div className="flex justify-end gap-4 w-full sm:w-auto">
          <ButtonReport
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={() => {
              setFilteredRelatorios(relatorios);
            }}
          >
            Aplicar
          </ButtonReport>
          <ButtonHeader
            className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => {
              setFilteredRelatorios(relatorios);
              loadRelatorios();
            }}
          >
            Limpar
          </ButtonHeader>
        </div>
      </div>
    </div>
  );
}
