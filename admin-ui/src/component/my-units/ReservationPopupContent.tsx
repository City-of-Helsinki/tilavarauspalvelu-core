import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { ReservationType } from "common/types/gql-types";
import { Permission } from "app/context/permissionHelper";
import { reservationUrl } from "../../common/urls";
import { formatTime } from "../../common/util";
import { DenseVerticalFlex } from "../../styles/layout";
import { getReserveeName } from "../reservations/requested/util";
import { CELL_BORDER } from "./const";
import VisibleIfPermission from "../reservations/requested/VisibleIfPermission";

const PopupContent = styled.div`
  border: ${CELL_BORDER};
  border-radius: 4px;
  padding: var(--spacing-xs);
  background-color: white;
  font-size: var(--fontsize-body-s);
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
`;

const ReservationPopupContent = ({
  reservation,
}: {
  reservation: ReservationType;
}): JSX.Element => {
  const eventName = getReserveeName(reservation, 22) || "-";
  return (
    <PopupContent>
      <DenseVerticalFlex>
        <Heading>
          {formatTime(reservation.begin)} - {formatTime(reservation.end)} /{" "}
          {reservation.reservationUnits?.[0]?.nameFi}
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
            <WorkingMemo>{reservation.workingMemo}</WorkingMemo>
          )}
        </VisibleIfPermission>
      </DenseVerticalFlex>
    </PopupContent>
  );
};

export default ReservationPopupContent;
