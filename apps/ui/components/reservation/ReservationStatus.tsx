import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { State } from "common/types/gql-types";
import { truncatedText } from "../../styles/util";

export type Props = {
  state: State;
};

// TODO why ? why not use HDS tags?
const Wrapper = styled.div<{ $color: string }>`
  display: inline-block;
  padding: var(--spacing-3-xs) var(--spacing-2-xs);
  background-color: ${({ $color }) => $color};
  line-height: var(--lineheight-l);
  font-size: var(--fontsize-body-s);
  ${truncatedText};
`;

export function ReservationStatus({ state, ...rest }: Props): JSX.Element {
  const { t } = useTranslation();

  const color = useMemo(() => {
    switch (state) {
      case State.Cancelled:
        return "var(--color-black-10)";
      case State.Confirmed:
        return "var(--color-success-light)";
      case State.Denied:
        return "var(--color-error-light)";
      case State.Created:
      case State.RequiresHandling:
        return "var(--color-info-light)";
      case State.WaitingForPayment:
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
}
