import React from "react";
import { DateInput, TimeInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { dateTime, valueForDateInput, valueForTimeInput } from "app/helpers";

type Props = { value?: string; setValue: (value: string) => void };

const DateTimeInput = ({
  value = new Date().toISOString(),
  setValue,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "4fr 3fr",
        gap: "var(--spacing-m)",
      }}
    >
      <DateInput
        language="fi"
        disableConfirmation
        label={t("common.date")}
        id="publishBegins.date"
        value={value && valueForDateInput(value)}
        onChange={(v) => {
          setValue(dateTime(v, valueForTimeInput(value)));
        }}
      />
      <TimeInput
        id="publishBegins.time"
        label={t("common.time")}
        hoursLabel="hours"
        minutesLabel="minutes"
        value={value && valueForTimeInput(value)}
        onChange={(e) => {
          if (e.target.value.length !== 5) {
            return;
          }
          setValue(dateTime(valueForDateInput(value), e.target.value));
        }}
      />
    </div>
  );
};

export default DateTimeInput;
