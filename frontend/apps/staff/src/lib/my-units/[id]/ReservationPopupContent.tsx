import React from "react";
import styled from "styled-components";
import { type ReservationUnitReservationsFragment, UserPermissionChoice } from "@gql/gql-types";
import { getReservationUrl } from "@/modules/urls";
import { dateToMinutes, formatTimeRange, parseValidDateObject } from "ui/src/modules/date-utils";
import { getReserveeName } from "@/modules/util";
import { truncate } from "@/modules/helpers";
import { Flex } from "ui/src/styled";
import { CELL_BORDER } from "./const";
import VisibleIfPermission from "@/components/VisibleIfPermission";
import { useTranslation } from "next-i18next";
import Link from "next/link";

const MAX_POPOVER_COMMENT_LENGTH = 140;
const POPOVER_MAX_WIDTH = 300;

const PopupContent = styled.div`
  border: ${CELL_BORDER};
  border-radius: 4px;
  padding: var(--spacing-xs);
  background-color: white;
  font-size: var(--fontsize-body-s);
  max-width: ${POPOVER_MAX_WIDTH}px;
`;

const Heading = styled.div``;
const Reservee = styled.div`
  a {
    color: black;
  }
`;
const WorkingMemo = styled.div`
  background-color: var(--color-black-5);
  padding: var(--spacing-xs);
  border-radius: 4px;
  max-width: ${POPOVER_MAX_WIDTH - 20}px;
`;

export function ReservationPopupContent({
  reservation,
}: {
  reservation: ReservationUnitReservationsFragment;
}): JSX.Element {
  const { t } = useTranslation();

  const startMins = dateToMinutes(parseValidDateObject(reservation.beginsAt));
  const endMins = dateToMinutes(parseValidDateObject(reservation.endsAt));
  const eventName = getReserveeName(reservation, t, 22) || "-";
  return (
    <PopupContent>
      <Flex $gap="xs">
        <Heading>
          {formatTimeRange(startMins, endMins)} / {reservation.reservationUnit?.nameFi ?? "-"}
        </Heading>
        <VisibleIfPermission reservation={reservation} permission={UserPermissionChoice.CanViewReservations}>
          <Reservee>
            {reservation.pk ? (
              <Link target="_blank" href={getReservationUrl(reservation.pk)}>
                {eventName}
              </Link>
            ) : (
              <span>{eventName}</span>
            )}
          </Reservee>
          {reservation.workingMemo && (
            <WorkingMemo>{truncate(reservation.workingMemo, MAX_POPOVER_COMMENT_LENGTH)}</WorkingMemo>
          )}
        </VisibleIfPermission>
      </Flex>
    </PopupContent>
  );
}
