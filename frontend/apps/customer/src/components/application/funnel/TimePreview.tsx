import React from "react";
import { useFormContext } from "react-hook-form";
import { ApplicationTimePreview } from "ui/src/components/ApplicationTimePreview";
import type { ApplicationPage2FormValues } from "./form";

type Props = {
  index: number;
};

/// Renders the time preview for the application section based on form data.
/// Requires react-hook-form context to access the form values.
export function TimePreview({ index }: Props): JSX.Element {
  const { watch } = useFormContext<ApplicationPage2FormValues>();
  const schedules = watch(`applicationSections.${index}.suitableTimeRanges`);
  return <ApplicationTimePreview schedules={schedules} />;
}
