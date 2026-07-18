import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface MarketState {
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;
}

const Ctx = createContext<MarketState | null>(null);

export function MarketProvider({ children }: PropsWithChildren) {
  const [activeSymbol, setSymbol] = useState<string>(
    () => window.sessionStorage.getItem("meridian:symbol") ?? "NVDA",
  );
  const setActiveSymbol = useCallback((s: string) => {
    setSymbol(s);
    window.sessionStorage.setItem("meridian:symbol", s);
  }, []);
  const value = useMemo(
    () => ({ activeSymbol, setActiveSymbol }),
    [activeSymbol, setActiveSymbol],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarket(): MarketState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMarket must be used within MarketProvider");
  return v;
}
