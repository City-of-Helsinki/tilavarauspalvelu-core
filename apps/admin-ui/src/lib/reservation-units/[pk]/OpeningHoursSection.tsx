import React from "react";
import { ButtonLikeExternalLink } from "common/src/components/ButtonLikeLink";
import { getOpeningHoursUrl } from "@/common/urls";
import { isBrowser } from "common/src/helpers";
import { IconLinkExternal } from "hds-react";
import { useTranslation } from "next-i18next";
import { AutoGrid } from "common/styled";
import { EditAccordion } from "./styled";
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
  const redirectOnErrorUrl = isBrowser ? window.location.href : undefined;
  const editUrl =
    getOpeningHoursUrl(apiBaseUrl, reservationUnit?.pk ?? 0, redirectOnErrorUrl) !== ""
      ? getOpeningHoursUrl(apiBaseUrl, reservationUnit?.pk ?? 0, redirectOnErrorUrl)
      : undefined;
  return (
    <EditAccordion heading={t("reservationUnitEditor:openingHours")}>
      {reservationUnit?.haukiUrl ? (
        <AutoGrid $alignCenter>
          <p style={{ gridColumn: "1 / -1" }}>{t("reservationUnitEditor:openingHoursHelperTextHasLink")}</p>
          <ButtonLikeExternalLink
            disabled={!editUrl}
            href={editUrl}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("reservationUnitEditor:openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeExternalLink>
          <ButtonLikeExternalLink
            disabled={previewDisabled}
            href={previewUrl}
            target="_blank"
            fontSize="small"
            style={{ textWrap: "wrap" }}
          >
            {t("reservationUnitEditor:previewCalendarLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeExternalLink>
        </AutoGrid>
      ) : (
        <p>{t("reservationUnitEditor:openingHoursHelperTextNoLink")}</p>
      )}
    </EditAccordion>
  );
}
