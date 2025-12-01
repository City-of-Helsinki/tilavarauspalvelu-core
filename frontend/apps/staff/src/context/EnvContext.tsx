import React, { createContext, useContext } from "react";
import { getDefaultServerSideProps } from "@/modules/serverUtils";
import type { StaffEnvConfig } from "@/modules/serverUtils";

type EnvContextProps = {
  env: StaffEnvConfig;
};

const EnvContext = createContext<EnvContextProps>({
  env: getDefaultServerSideProps(),
});

/**
 * Hook to access the environment configuration context
 * Provides access to server-side configuration values
 * @returns EnvContextProps containing environment configuration
 */
export const useEnvContext = (): EnvContextProps => useContext(EnvContext);

type EnvProviderProps = {
  children: React.ReactNode;
  env: StaffEnvConfig;
};

/**
 * Context provider for environment configuration
 * Environment is loaded by SSR and set during application root initialization
 * @param children - Child components that will have access to environment context
 * @param env - Environment configuration from server-side props
 * @returns React component that provides environment context
 */
export const EnvContextProvider: React.FC<EnvProviderProps> = ({ children, env: envInitial }: EnvProviderProps) => {
  return <EnvContext.Provider value={{ env: envInitial }}>{children}</EnvContext.Provider>;
};
