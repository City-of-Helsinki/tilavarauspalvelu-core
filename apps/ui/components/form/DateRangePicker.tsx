import { type FC, type FocusEvent, useState, useEffect } from "react";
/* eslint-disable import/no-duplicates */
import { parse, isBefore } from "date-fns";
import isValidDate from "date-fns/isValid";
/* eslint-enable import/no-duplicates */
import { DateInput } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { toUIDate } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import { isValidDateString } from "@/modules/util";

const initDate = (date: Date | null): string => {
  if (date == null) return "";
  return toUIDate(date);
};

export interface DateRangePickerProps {
  endDate: Date | null;
  startDate: Date | null;
  onChangeEndDate: (time: Date | null) => void;
  onChangeStartDate: (time: Date | null) => void;
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

const Wrapper = styled.div`
  & > div:not(:first-child) {
    margin-top: var(--spacing-s);
  }
`;

const DateRangePicker: FC<DateRangePickerProps> = ({
  endDate,
  startDate,
  onChangeEndDate,
  onChangeStartDate,
  showHelperText,
  labels,
  required,
  limits,
  placeholder,
}) => {
  const [internalStartDateString, setInternalStartDateString] =
    useState<string>(() => initDate(startDate));
  const [internalEndDateString, setInternalEndDateString] = useState<string>(
    () => initDate(endDate)
  );
  const [errors, setErrors] = useState({
    startDateIsInvalid: false,
    endDateIsInvalid: false,
  });

  const { t, i18n } = useTranslation();
  const helperText = t("dateSelector:infoDate");

  const internalStartDate = parse(
    internalStartDateString,
    "d.M.yyyy",
    new Date()
  );
  const internalEndDate = parse(internalEndDateString, "d.M.yyyy", new Date());
  // console.log(internalStartDate, internalStartDateString, internalEndDate, internalEndDateString);

  const endDateIsBeforeStartDate =
    isValidDate(internalStartDate) &&
    isValidDate(internalEndDate) &&
    isBefore(internalEndDate, internalStartDate);

  useEffect(() => {
    const startDateIsValid = isValidDateString(internalStartDateString);
    const endDateIsValid = isValidDateString(internalEndDateString);
    const startDateObj = parse(internalStartDateString, "d.M.yyyy", new Date());
    const endDateObj = parse(internalEndDateString, "d.M.yyyy", new Date());
    if (
      startDateIsValid &&
      endDateIsValid &&
      isBefore(endDateObj, startDateObj)
    ) {
      onChangeStartDate(startDateObj);
      onChangeEndDate(null);
      return;
    }

    if (startDateIsValid) {
      setErrors({
        ...errors,
        startDateIsInvalid: false,
      });
      onChangeStartDate(startDateObj);
    }
    if (!startDateIsValid) onChangeStartDate(null);

    if (endDateIsValid) {
      setErrors({
        ...errors,
        endDateIsInvalid: false,
      });
      onChangeEndDate(endDateObj);
    }
    if (!endDateIsValid) onChangeEndDate(null);

    // ignore change handlers to avoid infinite loops (if func changes on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalStartDateString, internalEndDateString, setErrors]);

  useEffect(() => {
    setInternalStartDateString(initDate(startDate));
    setInternalEndDateString(initDate(endDate));
  }, [startDate, endDate]);
  const handleStartDateValidation = (e: FocusEvent<HTMLInputElement>) => {
    setErrors({
      ...errors,
      startDateIsInvalid: !isValidDateString(e.target.value),
    });
  };

  const handleEndDateValidation = (e: FocusEvent<HTMLInputElement>) => {
    setErrors({
      ...errors,
      endDateIsInvalid: !isValidDateString(e.target.value),
    });
  };

  const errorText = (
    path: "startDateIsInvalid" | "endDateIsInvalid",
    text: string
  ) => {
    if (errors[path]) {
      return text;
    }
    return "";
  };

  return (
    <Wrapper className="date-range-input__wrapper">
      <DateInput
        autoComplete="off"
        id="start-date"
        value={internalStartDateString}
        onBlur={handleStartDateValidation}
        disableConfirmation
        helperText={
          showHelperText && !errors.startDateIsInvalid ? helperText : undefined
        }
        minDate={limits?.startMinDate ?? new Date()}
        maxDate={limits?.startMaxDate}
        initialMonth={new Date()}
        label={labels?.begin ?? t("dateSelector:labelStartDate")}
        aria-label={labels?.ariaBegin ?? t("dateSelector:labelStartDate")}
        language={getLocalizationLang(i18n.language)}
        onChange={(date) => setInternalStartDateString(date)}
        errorText={errorText(
          "startDateIsInvalid",
          t("dateSelector:errorDateFormat")
        )}
        required={required?.begin ?? true}
        placeholder={placeholder?.begin ?? t("dateSelector:placeholderBegin")}
      />
      <DateInput
        autoComplete="off"
        id="end-date"
        value={internalEndDateString}
        onBlur={handleEndDateValidation}
        disableConfirmation
        helperText={
          showHelperText &&
          !endDateIsBeforeStartDate &&
          !errors.endDateIsInvalid
            ? helperText
            : undefined
        }
        minDate={limits?.endMinDate ?? new Date()}
        maxDate={limits?.endMaxDate}
        initialMonth={startDate ?? new Date()}
        label={labels?.end ?? t("dateSelector:labelEndDate")}
        aria-label={labels?.ariaEnd ?? t("dateSelector:labelEndDate")}
        language={getLocalizationLang(i18n.language)}
        onChange={(date) => setInternalEndDateString(date)}
        errorText={
          endDateIsBeforeStartDate
            ? t("dateSelector:errorEndDateBeforeStartDate")
            : errorText("endDateIsInvalid", t("dateSelector:errorDateFormat"))
        }
        required={required?.end ?? true}
        placeholder={placeholder?.end ?? t("dateSelector:placeholderEnd")}
      />
    </Wrapper>
  );
};

export default DateRangePicker;
