import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ReservationsReservationStateChoices } from "../../modules/gql-types";

type Props = {
  state: ReservationsReservationStateChoices;
};

const Wrapper = styled.div<{ $color: string }>`
  display: inline-block;
  margin-bottom: var(--spacing-m);
  padding: var(--spacing-3-xs) var(--spacing-2-xs);
  background-color: ${({ $color }) => $color};
  line-height: var(--lineheight-l);
`;

const ReservationStatus = ({ state }: Props): JSX.Element => {
  const { t } = useTranslation();

  const color = useMemo(() => {
    switch (state) {
      case ReservationsReservationStateChoices.Cancelled:
        return "var(--color-black-10)";
      case ReservationsReservationStateChoices.Confirmed:
        return "var(--color-success-light)";
      case ReservationsReservationStateChoices.Denied:
        return "var(--color-error-light)";
      case ReservationsReservationStateChoices.Created:
      case ReservationsReservationStateChoices.RequiresHandling:
        return "var(--color-info-light)";
      default:
        return "";
    }
  }, [state]);

  return (
    <Wrapper $color={color}>
      {t(`reservations:status.${camelCase(state)}`)}
    </Wrapper>
  );
};

export default ReservationStatus;
