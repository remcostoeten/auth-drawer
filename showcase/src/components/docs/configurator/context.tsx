import { createContext, useContext } from "react";
import type { ConfiguratorContextValue } from "./constants";

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({
  value,
  children,
}: {
  value: ConfiguratorContextValue;
  children: React.ReactNode;
}) {
  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const value = useContext(ConfiguratorContext);
  if (!value) {
    throw new Error("useConfigurator must be used within ConfiguratorProvider");
  }
  return value;
}
