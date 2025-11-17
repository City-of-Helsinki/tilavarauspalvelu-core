export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type OptionType = {
  label: string;
  value: number;
};

export type OptionsRecord = Record<"purpose" | "ageGroup", Readonly<OptionType[]>>;

export interface CommonEnvConfig {
  apiBaseUrl: string;
  feedbackUrl: string;
  isConsoleLoggingEnabled: boolean;
  sentryDsn: string;
  sentryEnvironment: string;
  version: string;
}
