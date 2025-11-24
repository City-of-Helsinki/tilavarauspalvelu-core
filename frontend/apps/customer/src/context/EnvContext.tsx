import React, { createContext, useContext } from "react";
import { getDefaultServerSideProps } from "@/modules/serverUtils";
import type { CustomerEnvConfig } from "@/modules/serverUtils";

type EnvContextProps = {
  env: CustomerEnvConfig;
};

const EnvContext = createContext<EnvContextProps>({
  env: getDefaultServerSideProps(),
});

export const useEnvContext = (): EnvContextProps => useContext(EnvContext);

type EnvProviderProps = {
  children: React.ReactNode;
  env: CustomerEnvConfig;
};

/// Environment context that is loaded by the SSR and set during application root initialisation
export const EnvContextProvider: React.FC<EnvProviderProps> = ({ children, env: envInitial }: EnvProviderProps) => {
  return <EnvContext.Provider value={{ env: envInitial }}>{children}</EnvContext.Provider>;
};
