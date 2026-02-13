import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { VscClearAll } from "react-icons/vsc";

interface SearchComponentProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  updateRelatorios: () => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearch,
  updateRelatorios,
}) => {
  const [query, setQuery] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="w-full mb-6">
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full max-w-2xl mx-auto gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Pesquise por Código, ID ou Nome do Relatório..."
          className="flex-1 px-4 py-2 border border-yellow-200 bg-yellow-500/10 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors text-sm"
        />
        <button
          type="submit"
          className="rounded-full flex items-center gap-2 cursor-pointer p-2 hover:bg-blue-600 dark:hover:bg-yellow-300 transition-colors"
          title="Pesquisar Relatórios"
        >
          <FaSearch size={20} className="hover:text-black transition-colors" />
        </button>
        <button>
          <VscClearAll
            size={24}
            className="cursor-pointer hover:text-yellow-300 transition-colors"
            title="Limpar Pesquisa"
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
          />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer p-2 hover:text-yellow-300 transition-colors"
          title="Atualizar Relatórios"
          onClick={() => {
            updateRelatorios();
          }}
        >
          <IoReload size={20} className="transition-colors" />
        </button>
      </form>
    </div>
  );
};

export default SearchComponent;
