import { format, parseISO } from "date-fns";
import camelCase from "lodash/camelCase";
import { Application as ApplicationType } from "./types";

export const formatDate = (date = ""): string => {
  return format(parseISO(date), "d. M. yyyy");
};

export const formatNumber = (
  input?: number | null,
  suffix?: string
): string => {
  if (!input) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix}`;
};

export const processApplication = (
  application: ApplicationType
): ApplicationType => {
  const processedData = application.aggregatedData.reduce(
    (acc, cur) => ({
      ...acc,
      [camelCase(String(cur.name))]: cur.value,
    }),
    {}
  );

  return {
    ...application,
    processedData,
  };
};

export const processApplications = (
  applications: ApplicationType[]
): ApplicationType[] => {
  return applications.map((application) => {
    return processApplication(application);
  });
};
