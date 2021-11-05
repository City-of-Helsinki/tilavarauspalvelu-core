import { OptionType } from "./types";
import { convertHMSToSeconds, secondsToHms } from "./util";

export const getDurationOptions = (
  minReservationDuration: string,
  maxReservationDuration: string,
  step = "00:30:00"
): OptionType[] => {
  const minMinutes = convertHMSToSeconds(minReservationDuration);
  const maxMinutes = convertHMSToSeconds(maxReservationDuration);
  const durationStep = convertHMSToSeconds(step);

  if (!minMinutes || !maxMinutes || !durationStep) return [];

  const durationSteps = [];
  for (let i = minMinutes; i <= maxMinutes; i += durationStep) {
    durationSteps.push(i);
  }
  const timeOptions = durationSteps.map((n) => {
    const hms = secondsToHms(n);
    const minute = String(hms.m).padEnd(2, "0");
    return {
      label: `${hms.h}:${minute}`,
      value: `${hms.h}:${minute}`,
    };
  });

  return timeOptions;
};
