import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { truncatedText } from "../../styles/util";

type Props = {
  orderStatus: string;
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

const ReservationOrderStatus = ({
  orderStatus,
  ...rest
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const color = useMemo(() => {
    switch (orderStatus) {
      case "DRAFT":
        return "var(--color-engel-light)";
      case "PAID":
        return "var(--color-info-light)";
      case "PAID_MANUALLY":
        return "var(--color-gold-light)";
      default:
        return "";
    }
  }, [orderStatus]);

  const statusText = t(`reservations:orderStatus.${orderStatus}`);

  return (
    <Wrapper $color={color} {...rest} title={statusText}>
      {statusText}
    </Wrapper>
  );
};

export default ReservationOrderStatus;
