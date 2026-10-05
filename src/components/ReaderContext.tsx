import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Saint } from "../types/saint";
import ReaderModal from "./WikiReader";
import { trackEvent } from "../lib/analytics";

const Ctx = createContext<{ openSaint: (s: Saint) => void }>({ openSaint: () => {} });

export const useReader = () => useContext(Ctx);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Saint | null>(null);

  const openSaint = useCallback((s: Saint) => {
    trackEvent("saint_opened", { name: s.name, from: "reader_panel" });
    setCurrent(s);
  }, []);

  return (
    <Ctx.Provider value={{ openSaint }}>
      {children}
      {current && <ReaderModal saint={current} onClose={() => setCurrent(null)} />}
    </Ctx.Provider>
  );
}
