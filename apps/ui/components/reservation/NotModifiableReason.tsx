import {
  CanReservationBeChangedProps,
  getWhyReservationCantBeChanged,
  isReservationCancellable,
} from "@/modules/reservation";
import { useTranslation } from "next-i18next";
import React from "react";
import styled from "styled-components";

const Reasons = styled.p`
  &:empty {
    display: none;
  }

  color: var(--color-black-70);
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
      {t(`reservations:modifyTimeReasons:${modifyTimeReason}`)}
      {modifyTimeReason === "RESERVATION_MODIFICATION_NOT_ALLOWED" &&
        isCancellationAllowed &&
        ` ${t(
          "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED_SUFFIX"
        )}`}
    </Reasons>
  );
}
