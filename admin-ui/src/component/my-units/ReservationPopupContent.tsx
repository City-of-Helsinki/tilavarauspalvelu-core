import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { ReservationType } from "common/types/gql-types";
import { reservationUrl } from "../../common/urls";
import { formatTime } from "../../common/util";
import { DenseVerticalFlex } from "../../styles/layout";
import { getReserveeName } from "../reservations/requested/util";
import { CELL_BORDER } from "./const";

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
  return (
    <PopupContent>
      <DenseVerticalFlex>
        <Heading>
          {formatTime(reservation.begin)} - {formatTime(reservation.end)} /{" "}
          {reservation.reservationUnits?.[0]?.nameFi}
        </Heading>
        <Reservee>
          <Link target="_blank" to={reservationUrl(reservation.pk as number)}>
            {getReserveeName(reservation, 22) || "-"}
          </Link>
        </Reservee>
        {reservation.workingMemo && (
          <WorkingMemo>{reservation.workingMemo}</WorkingMemo>
        )}
      </DenseVerticalFlex>
    </PopupContent>
  );
};

export default ReservationPopupContent;
