import React from "react";
import styled from "styled-components";
import { IconClock } from "hds-react";
import isPast from "date-fns/isPast";
import isFuture from "date-fns/isFuture";
import isToday from "date-fns/isToday";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../common/util";

interface IProps {
  applicationPeriodBegin?: string;
  applicationPeriodEnd?: string;
  isResolved?: boolean;
  resolutionDate?: string;
}

const Wrapper = styled.span`
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);

  svg {
    min-width: 24px;
  }
`;

function TimeframeStatus({
  applicationPeriodBegin = "",
  applicationPeriodEnd = "",
  isResolved,
  resolutionDate,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const dateBegin = new Date(applicationPeriodBegin);
  const dateEnd = new Date(applicationPeriodEnd);

  let message = "";
  if (isResolved) {
    message = t("ApplicationRound.resolutionDate", {
      date: formatDate(resolutionDate || ""),
    });
  } else if (isPast(dateBegin) && isFuture(dateEnd)) {
    message = t("Application.timeframeCurrent", {
      date: formatDate(applicationPeriodEnd),
    });
  } else if (isToday(dateEnd)) {
    message = `${t("Application.timeframePast", {
      date: formatDate(applicationPeriodEnd),
    })} (${t("common.today")})`;
  } else if (isPast(dateEnd)) {
    message = t("Application.timeframePast", {
      date: formatDate(applicationPeriodEnd),
    });
  } else if (isFuture(dateBegin)) {
    message = t("Application.timeframeFuture", {
      date: formatDate(applicationPeriodBegin),
    });
  }

  return (
    <Wrapper data-testid="timeframe-status--wrapper">
      <IconClock aria-hidden size="xs" /> {message}
    </Wrapper>
  );
}

export default TimeframeStatus;
