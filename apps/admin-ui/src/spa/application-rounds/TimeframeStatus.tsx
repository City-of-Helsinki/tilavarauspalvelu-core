import React from "react";
import styled from "styled-components";
import { IconClock, IconSize } from "hds-react";
import { isPast, isFuture, isToday } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/common/util";

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

function TimeframeStatus({
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
    message = t("ApplicationRound.resolutionDate", {
      date: formatDate(resolutionDate || ""),
    });
  } else if (isPast(dateBegin) && isFuture(dateEnd)) {
    message = t("Application.timeframeCurrent", {
      date: formatDate(applicationPeriodEndsAt),
    });
  } else if (isToday(dateEnd)) {
    message = `${t("Application.timeframePast", {
      date: formatDate(applicationPeriodEndsAt),
    })} (${t("common.today")})`;
  } else if (isPast(dateEnd)) {
    message = t("Application.timeframePast", {
      date: formatDate(applicationPeriodEndsAt),
    });
  } else if (isFuture(dateBegin)) {
    message = t("Application.timeframeFuture", {
      date: formatDate(applicationPeriodBeginsAt),
    });
  }

  return (
    <Wrapper data-testid="timeframe-status--wrapper">
      <IconClock size={IconSize.ExtraSmall} aria-hidden="true" />
      {message}
    </Wrapper>
  );
}

export default TimeframeStatus;
