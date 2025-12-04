import React, { useState } from "react";
import {ButtonAlt } from "../elements/buttonTypes";

interface SearchComponentProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  placeholder = "Buscar...",
  onSearch,
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
    <form
      onSubmit={handleSubmit}
      className="flex items-center w-full max-w-md mx-auto"
    >
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ButtonAlt type="submit" className="m-4 rounded-full">Buscar</ButtonAlt>
    </form>
  );
};

export default SearchComponent;
