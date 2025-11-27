import React from "react";
import { IconLinkExternal } from "hds-react";
import { useTranslation } from "next-i18next";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import { isBrowser } from "ui/src/modules/helpers";
import { AutoGrid } from "ui/src/styled";
import { getOpeningHoursUrl } from "@/modules/urls";
import type { ReservationUnitEditQuery } from "@gql/gql-types";
import { EditAccordion } from "./styled";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

export function OpeningHoursSection({
  reservationUnit,
  previewUrlPrefix,
  apiBaseUrl,
}: {
  // TODO can we simplify this by passing the hauki url only?
  reservationUnit: Node | undefined;
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
          <ButtonLikeLink
            external
            disabled={!editUrl}
            href={editUrl ?? ""}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("reservationUnitEditor:openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
          <ButtonLikeLink
            external
            disabled={previewDisabled}
            href={previewUrl}
            target="_blank"
            fontSize="small"
            style={{ textWrap: "wrap" }}
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
