import React from "react";
import { startOfDay } from "date-fns/startOfDay";
import { DateInput } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { parseUIDate } from "ui/src/modules/date-utils";
import { getLocalizationLang } from "ui/src/modules/helpers";

// Validation is done by the parent form, this only displays the errors
export interface DateRangePickerProps {
  // date strings as the user typed them
  endDate: string;
  startDate: string;
  onChangeEndDate: (date: string) => void;
  onChangeStartDate: (date: string) => void;
  errors?: { begin?: string; end?: string };
  showHelperText?: boolean;
  labels?: {
    begin?: string;
    end?: string;
    ariaBegin?: string;
    ariaEnd?: string;
  };
  required?: { begin?: boolean; end?: boolean };
  limits?: {
    startMinDate?: Date;
    startMaxDate?: Date;
    endMinDate?: Date;
    endMaxDate?: Date;
  };
  placeholder?: {
    begin?: string;
    end?: string;
  };
}

export function DateRangePicker({
  endDate,
  startDate,
  onChangeEndDate,
  onChangeStartDate,
  errors,
  showHelperText,
  labels,
  required,
  limits,
  placeholder,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();

  const helperText = t("dateSelector:infoDate");
  const parsedStartDate = parseUIDate(startDate);

  return (
    <>
      <DateInput
        autoComplete="off"
        id="start-date"
        value={startDate}
        onChange={onChangeStartDate}
        // disableConfirmation: is not accessible
        helperText={showHelperText ? helperText : undefined}
        minDate={startOfDay(limits?.startMinDate ?? new Date())}
        maxDate={limits?.startMaxDate}
        initialMonth={new Date()}
        label={labels?.begin ?? t("dateSelector:labelStartDate")}
        aria-label={labels?.ariaBegin ?? t("dateSelector:labelStartDate")}
        language={getLocalizationLang(i18n.language)}
        errorText={errors?.begin}
        invalid={errors?.begin != null}
        required={required?.begin}
        placeholder={placeholder?.begin ?? t("dateSelector:placeholderBegin")}
        data-testid="search-form__filter--fields--startDate"
      />
      <DateInput
        autoComplete="off"
        id="end-date"
        value={endDate}
        onChange={onChangeEndDate}
        // disableConfirmation: is not accessible
        helperText={showHelperText ? helperText : undefined}
        minDate={startOfDay(limits?.endMinDate ?? new Date())}
        maxDate={limits?.endMaxDate}
        initialMonth={parsedStartDate ?? new Date()}
        label={labels?.end ?? t("dateSelector:labelEndDate")}
        aria-label={labels?.ariaEnd ?? t("dateSelector:labelEndDate")}
        language={getLocalizationLang(i18n.language)}
        errorText={errors?.end}
        invalid={errors?.end != null}
        required={required?.end}
        placeholder={placeholder?.end ?? t("dateSelector:placeholderEnd")}
        data-testid="search-form__filter--fields--endDate"
      />
    </>
  );
}
