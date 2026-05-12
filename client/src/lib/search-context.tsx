import { createContext, useContext, useState } from "react";

interface SearchCtx {
  search: string;
  setSearch: (v: string) => void;
}

const SearchContext = createContext<SearchCtx>({ search: "", setSearch: () => {} });

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  return useContext(SearchContext);
}
