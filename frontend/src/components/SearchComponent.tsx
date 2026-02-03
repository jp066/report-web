import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { VscClearAll } from "react-icons/vsc";

interface SearchComponentProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch }) => {
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
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
        />
        <button>
          <VscClearAll
            size={24}
            className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
          />
        </button>
        <button
          type="submit"
          className="rounded-full flex items-center gap-2 cursor-pointer bg-gray-200 dark:bg-gray-600 p-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          <FaSearch size={20} className="hover:text-white transition-colors" />
        </button>
      </form>
    </div>
  );
};

export default SearchComponent;
