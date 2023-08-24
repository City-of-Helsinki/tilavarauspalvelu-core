import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ReservationsReservationStateChoices } from "common/types/gql-types";
import { truncatedText } from "../../styles/util";

export type Props = {
  state: ReservationsReservationStateChoices;
};

const Wrapper = styled.div<{ $color: string }>`
  display: inline-block;
  margin-bottom: var(--spacing-m);
  padding: var(--spacing-3-xs) var(--spacing-2-xs);
  background-color: ${({ $color }) => $color};
  line-height: var(--lineheight-l);
  font-size: var(--fontsize-body-s);
  ${truncatedText};
`;

const ReservationStatus = ({ state, ...rest }: Props): JSX.Element => {
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
      case ReservationsReservationStateChoices.WaitingForPayment:
        return "var(--color-engel-light)";
      default:
        return "";
    }
  }, [state]);

  const statusText = t(`reservations:status.${camelCase(state)}`);

  return (
    <Wrapper $color={color} title={statusText} {...rest}>
      {statusText}
    </Wrapper>
  );
};

export default ReservationStatus;
