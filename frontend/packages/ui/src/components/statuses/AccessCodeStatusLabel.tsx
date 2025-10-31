import React from "react";
import { IconLock } from "hds-react";
import { StatusLabel } from "../StatusLabel";
import { useTranslation } from "next-i18next";

export function AccessCodeStatusLabel(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <StatusLabel
      type="info"
      icon={<IconLock aria-hidden="false" aria-label={t(`reservationUnit:accessType`)} />}
      data-testid="reservation__access-code"
    >
      {t("reservationUnit:accessTypes.ACCESS_CODE")}
    </StatusLabel>
  );
}
