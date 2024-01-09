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
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
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

    const isStartDateEmpty = start === "";
    if (!isStartDateEmpty) {
      const isStartDateInvalid = sd == null || !isValidDate(sd);
      const isStartDateBeforeMin =
        sd != null && limits?.startMinDate && sd < limits?.startMinDate;
      const isStartDateAfterMax =
        sd != null && limits?.startMaxDate && sd > limits?.startMaxDate;
      if (isStartDateInvalid) {
        setStartDateError(t("dateSelector:errors.dateInvalid"));
        onChangeStartDate(null);
      } else if (isStartDateBeforeMin && limits?.startMinDate != null) {
        setStartDateError(
          t("dateSelector:errors.dateIsTooSmall", {
            minDate: toUIDate(limits?.startMinDate),
          })
        );
        onChangeStartDate(null);
      } else if (isStartDateAfterMax && limits?.startMaxDate != null) {
        setStartDateError(
          t("dateSelector:errors.dateIsTooBig", {
            maxDate: toUIDate(limits?.startMaxDate),
          })
        );
        onChangeStartDate(null);
      } else {
        onChangeStartDate(sd || null);
      }
    }

    const isEndDateEmpty = end === "";
    if (!isEndDateEmpty) {
      const isEndDateInvalid = ed == null || !isValidDate(ed);
      const isEndDateBeforeMin =
        ed != null && limits?.endMinDate != null && ed < limits.endMinDate;
      const isEndDateAfterMax =
        ed != null && limits?.endMaxDate != null && ed > limits.endMaxDate;
      if (isEndDateInvalid) {
        setEndDateError(t("dateSelector:errors.dateInvalid"));
        onChangeEndDate(null);
      } else if (isEndDateBeforeMin && limits?.endMinDate != null) {
        setEndDateError(
          t("dateSelector:errors.dateIsTooSmall", {
            minDate: toUIDate(limits?.endMinDate),
          })
        );
        onChangeEndDate(null);
      } else if (isEndDateAfterMax && limits?.endMaxDate != null) {
        setEndDateError(
          t("dateSelector:errors.dateIsTooBig", {
            maxDate: toUIDate(limits?.endMaxDate),
          })
        );
        onChangeEndDate(null);
      } else {
        onChangeEndDate(ed || null);
      }
    }

    // If both dates are valid, check that end date is not before start date
    if (
      !isStartDateEmpty &&
      !isEndDateEmpty &&
      ed != null &&
      sd != null &&
      isValidDate(ed) &&
      isValidDate(sd)
    ) {
      if (isBefore(ed, sd)) {
        setEndDateError(t("dateSelector:errors.endDateBeforeStartDate"));
        onChangeEndDate(null);
      }
    }
  };

  useEffect(() => {
    setInternalStartDateString(toUIDate(startDate));
    setInternalEndDateString(toUIDate(endDate));
    setStartDateError(null);
    setEndDateError(null);
  }, [startDate, endDate]);

  const handleStartDateChange = (date: string) => {
    setInternalStartDateString(date);
    setStartDateError(null);
    validateAndUpdateUpstream({
      start: date,
      end: internalEndDateString,
    });
  };

  const handleEndDateChange = (date: string) => {
    setInternalEndDateString(date);
    setEndDateError(null);
    validateAndUpdateUpstream({
      start: internalStartDateString,
      end: date,
    });
  };

  const getErrorText = (path: "startDate" | "endDate") => {
    if (path === "startDate") {
      return startDateError ?? undefined;
    }
    if (path === "endDate") {
      return endDateError ?? undefined;
    }
    return undefined;
  };

  const helperText = t("dateSelector:infoDate");
  const internalStartDate = fromUIDate(internalStartDateString);

  return (
    <Wrapper className="date-range-input__wrapper">
      <DateInput
        autoComplete="off"
        id="start-date"
        value={internalStartDateString}
        onChange={handleStartDateChange}
        // disableConfirmation: is not accessible
        helperText={showHelperText ? helperText : undefined}
        minDate={limits?.startMinDate ?? new Date()}
        maxDate={limits?.startMaxDate}
        initialMonth={new Date()}
        label={labels?.begin ?? t("dateSelector:labelStartDate")}
        aria-label={labels?.ariaBegin ?? t("dateSelector:labelStartDate")}
        language={getLocalizationLang(i18n.language)}
        errorText={getErrorText("startDate")}
        invalid={startDateError != null}
        required={required?.begin}
        placeholder={placeholder?.begin ?? t("dateSelector:placeholderBegin")}
      />
      <DateInput
        autoComplete="off"
        id="end-date"
        value={internalEndDateString}
        onChange={handleEndDateChange}
        // disableConfirmation: is not accessible
        helperText={showHelperText ? helperText : undefined}
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
        errorText={getErrorText("endDate")}
        invalid={endDateError != null}
        required={required?.end}
        placeholder={placeholder?.end ?? t("dateSelector:placeholderEnd")}
      />
    </Wrapper>
  );
};

export default DateRangePicker;
