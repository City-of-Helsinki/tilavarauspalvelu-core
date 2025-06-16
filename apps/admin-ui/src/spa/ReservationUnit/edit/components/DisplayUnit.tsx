import {
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  UnitSubpageHeadFragment,
} from "@gql/gql-types";
import { parseAddress } from "@/common/util";
import React from "react";
import styled from "styled-components";
import { Flex, fontBold, H1, NoWrap, TitleSection } from "common/styled";
import { IconCheck, IconClock, IconEye, IconEyeCrossed, IconLock, IconPen, IconQuestionCircle } from "hds-react";
import { useTranslation } from "react-i18next";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

const UnitInformationWrapper = styled.div`
  font-size: var(--fontsize-heading-s);

  > div:first-child {
    ${fontBold};
  }
`;

type StatePropsType = {
  type: StatusLabelType;
  icon: JSX.Element;
};

const getReservationStateProps = (state?: ReservationUnitReservationState): StatePropsType => {
  switch (state) {
    case ReservationUnitReservationState.ScheduledReservation:
    case ReservationUnitReservationState.ScheduledPeriod:
    case ReservationUnitReservationState.ScheduledClosing:
      return {
        type: "info",
        icon: <IconClock aria-hidden="true" />,
      };
    case ReservationUnitReservationState.ReservationClosed:
      return {
        type: "neutral",
        icon: <IconLock aria-hidden="true" />,
      };
    case ReservationUnitReservationState.Reservable:
      return {
        type: "success",
        icon: <IconEye aria-hidden="true" />,
      };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle aria-hidden="true" />,
      };
  }
};

function ReservationStateTag({ state }: { state?: ReservationUnitReservationState }) {
  const { t } = useTranslation();

  if (!state || state === ReservationUnitReservationState.Reservable) {
    return null;
  }

  const reservationState = getReservationStateProps(state);
  return (
    <StatusLabel type={reservationState.type} icon={reservationState.icon}>
      {t(`ReservationUnits.reservationState.${state}`)}
    </StatusLabel>
  );
}

const getPublishingStateProps = (state?: ReservationUnitPublishingState): StatePropsType => {
  switch (state) {
    case ReservationUnitPublishingState.Draft:
      return {
        type: "draft",
        icon: <IconPen />,
      };
    case ReservationUnitPublishingState.Hidden:
      return {
        type: "neutral",
        icon: <IconEyeCrossed />,
      };
    case ReservationUnitPublishingState.Published:
      return {
        type: "success",
        icon: <IconCheck />,
      };
    case ReservationUnitPublishingState.ScheduledHiding:
    case ReservationUnitPublishingState.ScheduledPeriod:
    case ReservationUnitPublishingState.ScheduledPublishing:
      return {
        type: "info",
        icon: <IconClock />,
      };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle />,
      };
  }
};

function PublishingStateTag({ state }: { state?: ReservationUnitPublishingState }): JSX.Element | null {
  const { t } = useTranslation();

  if (!state) return null;

  const publishingState = getPublishingStateProps(state);
  return (
    <StatusLabel type={publishingState.type} icon={publishingState.icon}>
      <NoWrap>{t(`ReservationUnits.state.${state}`)}</NoWrap>
    </StatusLabel>
  );
}

export function DisplayUnit({
  heading,
  unit,
  unitState,
  reservationState,
}: {
  heading: string;
  unit?: UnitSubpageHeadFragment | null;
  unitState?: ReservationUnitPublishingState;
  reservationState?: ReservationUnitReservationState;
}): JSX.Element {
  const location = unit?.location;
  return (
    <>
      <TitleSection>
        <H1 $noMargin>{heading}</H1>
        <Flex $direction="row" $gap="xs">
          <ReservationStateTag state={reservationState} />
          <PublishingStateTag state={unitState} />
        </Flex>
      </TitleSection>
      <UnitInformationWrapper>
        <div>{unit?.nameFi ?? "-"}</div>
        <div>{location != null ? parseAddress(location) : "-"}</div>
      </UnitInformationWrapper>
    </>
  );
}
