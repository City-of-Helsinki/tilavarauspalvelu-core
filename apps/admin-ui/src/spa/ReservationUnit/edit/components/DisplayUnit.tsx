import type {
  UnitSubpageHeadFragment,
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
} from "@gql/gql-types";
import { ReservationStateTag } from "@/spa/ReservationUnit/edit/components/ReservationStateTag";
import { PublishingStateTag } from "@/spa/ReservationUnit/edit/components/PublishingStateTag";
import { parseAddress } from "@/common/util";
import React from "react";
import styled from "styled-components";
import { Flex, fontBold, H1, TitleSection } from "common/styled";

const UnitInformationWrapper = styled.div`
  font-size: var(--fontsize-heading-s);

  > div:first-child {
    ${fontBold}
  }
`;

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
