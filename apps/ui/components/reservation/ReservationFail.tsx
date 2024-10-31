import React from "react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "next-i18next";
import { CancelledLinkSet } from "./CancelledLinkSet";

type Props = {
  type: "reservation" | "order";
  apiBaseUrl: string;
};

function getHeadingKey(type: Props["type"]): string {
  return type === "reservation" ? "reservationExpired" : "orderInvalid";
}

// order is at least on DeleteCancelled.tsx
// success.tsx has both of them
export function ReservationFail({ type, apiBaseUrl }: Props) {
  const { t } = useTranslation();
  const headingKey = getHeadingKey(type);
  return (
    <>
      <H1>{t(`reservations:${headingKey}`)}</H1>
      {type === "reservation" && (
        <p>{t("reservations:reservationExpiredDescription")}</p>
      )}
      <CancelledLinkSet apiBaseUrl={apiBaseUrl} />
    </>
  );
}
