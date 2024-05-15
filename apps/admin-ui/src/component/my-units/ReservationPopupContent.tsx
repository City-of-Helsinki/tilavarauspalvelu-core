import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import type { ReservationNode } from "@gql/gql-types";
import { Permission } from "@/modules/permissionHelper";
import { reservationUrl } from "@/common/urls";
import { formatTime } from "@/common/util";
import { truncate } from "@/helpers";
import { DenseVerticalFlex } from "@/styles/layout";
import { getReserveeName } from "../reservations/requested/util";
import { CELL_BORDER } from "./const";
import VisibleIfPermission from "../reservations/requested/VisibleIfPermission";
import { useTranslation } from "next-i18next";

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
  reservation: ReservationNode;
}): JSX.Element {
  const { t } = useTranslation();
  const eventName = getReserveeName(reservation, t, 22) || "-";
  return (
    <PopupContent>
      <DenseVerticalFlex>
        <Heading>
          {formatTime(reservation.begin)} - {formatTime(reservation.end)} /{" "}
          {reservation.reservationUnit?.[0]?.nameFi}
        </Heading>
        <VisibleIfPermission
          reservation={reservation}
          permission={Permission.CAN_VIEW_RESERVATIONS}
        >
          <Reservee>
            {reservation.pk ? (
              <Link target="_blank" to={reservationUrl(reservation.pk)}>
                {eventName}
              </Link>
            ) : (
              <span>{eventName}</span>
            )}
          </Reservee>
          {reservation.workingMemo && (
            <WorkingMemo>
              {truncate(reservation.workingMemo, MAX_POPOVER_COMMENT_LENGTH)}
            </WorkingMemo>
          )}
        </VisibleIfPermission>
      </DenseVerticalFlex>
    </PopupContent>
  );
}
