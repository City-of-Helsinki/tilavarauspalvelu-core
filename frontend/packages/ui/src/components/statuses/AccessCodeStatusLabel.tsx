import React from "react";
import { IconLock } from "hds-react";
import { useTranslation } from "next-i18next";
import { StatusLabel } from "../StatusLabel";

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
