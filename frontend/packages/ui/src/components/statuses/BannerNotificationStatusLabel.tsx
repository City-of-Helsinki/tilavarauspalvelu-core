import React from "react";
import { IconCheck, IconClock, IconPen } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { BannerNotificationState } from "../../../gql/gql-types";
import StatusLabel, { type StatusLabelType } from "../StatusLabel";

const StyledStatusLabel = styled(StatusLabel)`
  align-self: center;
  white-space: nowrap;
`;

type NotificationStatus = {
  type: StatusLabelType;
  icon: JSX.Element;
};

function getStatusLabelProps(state: BannerNotificationState): NotificationStatus {
  switch (state) {
    case BannerNotificationState.Draft:
      return { type: "draft", icon: <IconPen /> };
    case BannerNotificationState.Active:
      return { type: "success", icon: <IconCheck /> };
    case BannerNotificationState.Scheduled:
      return { type: "info", icon: <IconClock /> };
  }
}

export function BannerNotificationStatusLabel({ state }: { state: BannerNotificationState }) {
  const { t } = useTranslation();
  const { type, icon } = getStatusLabelProps(state);

  return (
    <StyledStatusLabel type={type} icon={icon}>
      {t(`notification:state.${state}`)}
    </StyledStatusLabel>
  );
}
