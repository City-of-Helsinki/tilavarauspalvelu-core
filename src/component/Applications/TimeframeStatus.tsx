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
}

const Wrapper = styled.span`
  display: flex;
  align-items: center;

  svg {
    margin-right: 1rem;
  }
`;

function TimeframeStatus({
  applicationPeriodBegin = "",
  applicationPeriodEnd = "",
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const dateBegin = new Date(applicationPeriodBegin);
  const dateEnd = new Date(applicationPeriodEnd);

  let message = "";
  if (isPast(dateBegin) && isFuture(dateEnd)) {
    message = t("Application.timeframeCurrent");
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
    <Wrapper>
      <IconClock /> {message}
    </Wrapper>
  );
}

export default TimeframeStatus;
