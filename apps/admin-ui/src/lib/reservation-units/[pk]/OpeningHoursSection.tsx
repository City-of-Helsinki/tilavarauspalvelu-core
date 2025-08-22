import { getOpeningHoursUrl } from "@/common/urls";
import React from "react";
import { IconLinkExternal } from "hds-react";
import { useTranslation } from "next-i18next";
import { AutoGrid } from "common/styled";
import { EditAccordion } from "./styled";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import type { ReservationUnitEditPageFragment } from "@gql/gql-types";

export function OpeningHoursSection({
  reservationUnit,
  previewUrlPrefix,
  apiBaseUrl,
}: {
  // TODO can we simplify this by passing the hauki url only?
  reservationUnit: ReservationUnitEditPageFragment | null;
  previewUrlPrefix: string;
  apiBaseUrl: string;
}) {
  const { t } = useTranslation();

  const previewUrl = `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.extUuid}#calendar`;
  const previewDisabled = previewUrlPrefix === "" || !reservationUnit?.pk || !reservationUnit?.extUuid;

  return (
    <EditAccordion heading={t("reservationUnitEditor:openingHours")}>
      {reservationUnit?.haukiUrl ? (
        <AutoGrid $alignCenter>
          <p style={{ gridColumn: "1 / -1" }}>{t("reservationUnitEditor:openingHoursHelperTextHasLink")}</p>
          {/* TODO this should be external? i.e. standard a link */}
          <ButtonLikeLink
            disabled={!apiBaseUrl || !reservationUnit?.pk}
            href={getOpeningHoursUrl(apiBaseUrl, reservationUnit?.pk)}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("reservationUnitEditor:openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
          {/* TODO this should be external? i.e. standard a link */}
          <ButtonLikeLink
            disabled={previewDisabled}
            href={previewUrl}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("reservationUnitEditor:previewCalendarLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
        </AutoGrid>
      ) : (
        <p>{t("reservationUnitEditor:openingHoursHelperTextNoLink")}</p>
      )}
    </EditAccordion>
  );
}
