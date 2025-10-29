import React from "react";
import { IconCheck, IconClock, IconEye, IconEyeCrossed, IconLock, IconPen, IconQuestionCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Flex, fontBold, H1, NoWrap, TitleSection } from "ui/src/styled";
import { formatAddress } from "@/modules/util";
import {
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  UnitSubpageHeadFragment,
} from "@gql/gql-types";
import { ReservationUnitPublishingStatusLabel, ReservationUnitReservationStatusLabel } from "./tags";

const UnitInformationWrapper = styled.div`
  font-size: var(--fontsize-heading-s);

  > div:first-child {
    ${fontBold};
  }
`;

function ReservationStateTag({ state }: { state?: ReservationUnitReservationState }): React.ReactElement | null {
  // Don't show the reservable tag when editing
  if (!state || state === ReservationUnitReservationState.Reservable) {
    return null;
  }

  return <ReservationUnitReservationStatusLabel state={state} />;
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
  return (
    <>
      <TitleSection>
        <H1 $noMargin>{heading}</H1>
        <Flex $direction="row" $gap="xs">
          <ReservationStateTag state={reservationState} />
          {unitState && <ReservationUnitPublishingStatusLabel state={unitState} />}
        </Flex>
      </TitleSection>
      <UnitInformationWrapper>
        <div>{unit?.nameFi ?? "-"}</div>
        <div>{formatAddress(unit)}</div>
      </UnitInformationWrapper>
    </>
  );
}
