import React from "react";
import styled from "styled-components";
import { IconClock, IconSize } from "hds-react";
import { isPast, isFuture, isToday } from "date-fns";
import { useTranslation } from "next-i18next";
import { formatDate, parseValidDateObject } from "common/src/modules/date-utils";

interface IProps {
  applicationPeriodBeginsAt?: string;
  applicationPeriodEndsAt?: string;
  isResolved?: boolean;
  resolutionDate?: string;
}

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3-xs);
`;

export function TimeframeStatus({
  applicationPeriodBeginsAt = "",
  applicationPeriodEndsAt = "",
  isResolved,
  resolutionDate,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const dateBegin = new Date(applicationPeriodBeginsAt);
  const dateEnd = new Date(applicationPeriodEndsAt);

  let message = "";
  if (isResolved) {
    message = t("applicationRound:resolutionDate", {
      date: resolutionDate ? formatDate(parseValidDateObject(resolutionDate)) : "",
    });
  } else if (isPast(dateBegin) && isFuture(dateEnd)) {
    message = t("application:timeframeCurrent", {
      date: formatDate(parseValidDateObject(applicationPeriodEndsAt)),
    });
  } else if (isToday(dateEnd)) {
    message = `${t("application:timeframePast", {
      date: formatDate(parseValidDateObject(applicationPeriodEndsAt)),
    })} (${t("common:today")})`;
  } else if (isPast(dateEnd)) {
    message = t("application:timeframePast", {
      date: formatDate(parseValidDateObject(applicationPeriodEndsAt)),
    });
  } else if (isFuture(dateBegin)) {
    message = t("application:timeframeFuture", {
      date: formatDate(parseValidDateObject(applicationPeriodBeginsAt)),
    });
  }

  return (
    <Wrapper data-testid="timeframe-status--wrapper">
      <IconClock size={IconSize.ExtraSmall} />
      {message}
    </Wrapper>
  );
}
