import React from "react";
import { useFormContext } from "react-hook-form";
import { ApplicationTimePreview } from "ui/src/components/ApplicationTimePreview";
import type { ReservableTimeSlots } from "ui/src/modules/suitableTimes";
import type { ApplicationPage2FormValues } from "./form";
import { findInvalidRanges } from "./timeSelectorModule";

type Props = {
  index: number;
  /** The section's opening hours, to mark the times outside them. */
  openingHours: ReservableTimeSlots;
};

/// Renders the time preview for the application section based on form data.
/// Requires react-hook-form context to access the form values.
export function TimePreview({ index, openingHours }: Readonly<Props>): React.ReactElement {
  const { watch } = useFormContext<ApplicationPage2FormValues>();
  const schedules = watch(`applicationSections.${index}.suitableTimeRanges`);
  const minDuration = watch(`applicationSections.${index}.minDuration`);
  const invalid = findInvalidRanges(schedules, minDuration, openingHours);
  return <ApplicationTimePreview schedules={schedules} invalidSchedules={schedules.filter((_, i) => invalid[i])} />;
}
