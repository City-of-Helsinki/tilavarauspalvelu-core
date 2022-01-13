import React from "react";
import styled from "styled-components";
import { ReservationType } from "../../common/gql-types";

type Props = {
  reservation: ReservationType;
};

const Container = styled.div`
  background-color: var(--color-silver-light);
  padding: var(--spacing-s) var(--spacing-m);
`;

const SpaceName = styled.div`
  font-size: var(--fontsize-heading-s);
  font-weight: 600;
`;

const SingleApplicationCard = ({ reservation }: Props): JSX.Element => (
  <Container title={reservation.name as string}>
    <SpaceName>
      {reservation.reservationUnits?.map((ru) => ru?.nameFi)}
    </SpaceName>
    {reservation.reservationUnits?.map((ru) => ru?.unit?.nameFi)}
  </Container>
);

export default SingleApplicationCard;
