import {
  CanReservationBeChangedProps,
  getWhyReservationCantBeChanged,
  isReservationCancellable,
} from "@/modules/reservation";
import { Flex } from "common/styles/util";
import { useTranslation } from "next-i18next";
import React from "react";
import styled from "styled-components";

const Reasons = styled(Flex)`
  &:empty {
    display: none;
  }

  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const ReasonText = styled.div`
  color: var(--color-black-70);
  line-height: var(--lineheight-l);
`;

export function NotModifiableReason({
  reservation,
}: Pick<
  Required<CanReservationBeChangedProps>,
  "reservation"
>): JSX.Element | null {
  const { t } = useTranslation();
  const modifyTimeReason = getWhyReservationCantBeChanged({ reservation });
  const isCancellationAllowed = isReservationCancellable(reservation);

  if (modifyTimeReason == null) {
    return null;
  }
  return (
    <Reasons>
      <ReasonText>
        {t(`reservations:modifyTimeReasons:${modifyTimeReason}`)}
        {modifyTimeReason === "RESERVATION_MODIFICATION_NOT_ALLOWED" &&
          isCancellationAllowed &&
          ` ${t(
            "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED_SUFFIX"
          )}`}
      </ReasonText>
    </Reasons>
  );
}
