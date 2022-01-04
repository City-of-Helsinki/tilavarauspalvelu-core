import React from "react";
import { DateInput, TimeInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { parse } from "date-fns";
import { EditorColumns } from "./editorComponents";
import { formatDate } from "../../common/util";

/* Convert api datetime to date required by date input, defaults to current date */
export const valueForDateInput = (from: string): string => {
  return formatDate(from || new Date().toISOString(), "d.M.yyyy") as string;
};

/* Convert api datetime to time required by time input,m defaults to current time */
export const valueForTimeInput = (from: string): string => {
  return formatDate(from || new Date().toISOString(), "HH:mm") as string;
};

/* Construct date from dateinput + timeinput */
export const dateTime = (date: string, time: string): string => {
  return parse(`${date} ${time}`, "dd.MM.yyyy HH:mm", new Date()).toISOString();
};

const DateTimeInput = ({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}): JSX.Element => {
  const { t } = useTranslation();
  return (
    <EditorColumns style={{ gridTemplateColumns: "4fr 3fr" }}>
      <DateInput
        language="fi"
        disableConfirmation
        label={t("common.date")}
        id="publishBegins.date"
        value={valueForDateInput(value)}
        onChange={(v) => {
          setValue(dateTime(v, valueForTimeInput(value)));
        }}
      />
      <TimeInput
        id="publishBegins.time"
        label={t("common.time")}
        hoursLabel="hours"
        minutesLabel="minutes"
        value={valueForTimeInput(value)}
        onChange={(e) => {
          if (e.target.value.length !== 5) {
            return;
          }
          setValue(dateTime(valueForDateInput(value), e.target.value));
        }}
      />
    </EditorColumns>
  );
};

export default DateTimeInput;
