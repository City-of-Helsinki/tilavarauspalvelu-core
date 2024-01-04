import { type FC, useState, useEffect } from "react";
import { isBefore } from "date-fns";
import { DateInput } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fromUIDate, toUIDate, isValidDate } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";

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
    useState<string>(() => toUIDate(startDate));
  const [internalEndDateString, setInternalEndDateString] = useState<string>(
    () => toUIDate(endDate)
  );
  const [errors, setErrors] = useState({
    startDateIsInvalid: false,
    endDateIsInvalid: false,
  });

  const { t, i18n } = useTranslation();

  // Pass params instead of state because React state updates are async
  const validateAndUpdateUpstream = ({
    start,
    end,
  }: {
    start: string;
    end: string;
  }) => {
    const sd = fromUIDate(start);
    const ed = fromUIDate(end);

    const errs = { startDateIsInvalid: false, endDateIsInvalid: false };
    if ((sd == null || !isValidDate(sd)) && start !== "") {
      errs.startDateIsInvalid = true;
      onChangeStartDate(null);
    } else {
      onChangeStartDate(sd || null);
    }
    if (
      end !== "" &&
      (ed == null || !isValidDate(ed) || (sd != null && isBefore(ed, sd)))
    ) {
      errs.endDateIsInvalid = true;
      onChangeEndDate(null);
    } else {
      onChangeEndDate(ed || null);
    }
    setErrors(errs);
  };

  useEffect(() => {
    setInternalStartDateString(toUIDate(startDate));
    setInternalEndDateString(toUIDate(endDate));
  }, [startDate, endDate]);

  const handleStartDateChange = (date: string) => {
    setInternalStartDateString(date);
    validateAndUpdateUpstream({
      start: date,
      end: internalEndDateString,
    });
  };

  const handleEndDateChange = (date: string) => {
    setInternalEndDateString(date);
    validateAndUpdateUpstream({
      start: internalStartDateString,
      end: date,
    });
  };

  const getErrorText = (
    path: "startDateIsInvalid" | "endDateIsInvalid",
    text: string
  ) => {
    if (errors[path]) {
      return text;
    }
    return "";
  };

  const helperText = t("dateSelector:infoDate");
  const internalStartDate = fromUIDate(internalStartDateString);
  const internalEndDate = fromUIDate(internalEndDateString);

  const endDateIsBeforeStartDate =
    internalEndDate != null &&
    internalStartDate != null &&
    isBefore(internalEndDate, internalStartDate);

  return (
    <Wrapper className="date-range-input__wrapper">
      <DateInput
        autoComplete="off"
        id="start-date"
        value={internalStartDateString}
        onChange={handleStartDateChange}
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
        errorText={getErrorText(
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
        onChange={handleEndDateChange}
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
        initialMonth={
          internalStartDate != null && isValidDate(internalStartDate)
            ? internalStartDate
            : new Date()
        }
        label={labels?.end ?? t("dateSelector:labelEndDate")}
        aria-label={labels?.ariaEnd ?? t("dateSelector:labelEndDate")}
        language={getLocalizationLang(i18n.language)}
        errorText={
          endDateIsBeforeStartDate
            ? t("dateSelector:errorEndDateBeforeStartDate")
            : getErrorText(
                "endDateIsInvalid",
                t("dateSelector:errorDateFormat")
              )
        }
        required={required?.end ?? true}
        placeholder={placeholder?.end ?? t("dateSelector:placeholderEnd")}
      />
    </Wrapper>
  );
};

export default DateRangePicker;
