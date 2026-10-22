import React from "react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { dateToMinutes, formatTimeRange, parseValidDateObject } from "ui/src/modules/date-utils";
import { Flex } from "ui/src/styled";
import { UserPermissionChoice } from "@gql/gql-types";
import type { ReservationUnitReservationsFragment } from "@gql/gql-types";
import { VisibleIfPermission } from "@/components/VisibleIfPermission";
import { getReserveeName, truncate } from "@/modules/helpers";

const MAX_MEMO_LENGTH = 140;

const Content = styled.div`
  border: 1px solid var(--color-black-20);
  border-radius: 4px;
  padding: var(--spacing-xs);
  background-color: var(--color-white);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
  font-size: var(--fontsize-body-s);
`;

const WorkingMemo = styled.div`
  background-color: var(--color-black-5);
  padding: var(--spacing-xs);
  border-radius: 4px;
`;

/** A purely visual summary of a reservation, shown in a tooltip. The link to the reservation is the event itself. */
export function ReservationTooltipContent({
  reservation,
}: {
  reservation: ReservationUnitReservationsFragment;
}): React.ReactElement {
  const { t } = useTranslation();

  const startMins = dateToMinutes(parseValidDateObject(reservation.beginsAt));
  const endMins = dateToMinutes(parseValidDateObject(reservation.endsAt));
  return (
    <Content>
      <Flex $gap="xs">
        <div>
          {formatTimeRange(startMins, endMins)} / {reservation.reservationUnit?.nameFi ?? "-"}
        </div>
        <VisibleIfPermission reservation={reservation} permission={UserPermissionChoice.CanViewReservations}>
          <div>{getReserveeName(reservation, t, 22) || "-"}</div>
          {reservation.workingMemo && <WorkingMemo>{truncate(reservation.workingMemo, MAX_MEMO_LENGTH)}</WorkingMemo>}
        </VisibleIfPermission>
      </Flex>
    </Content>
  );
}
