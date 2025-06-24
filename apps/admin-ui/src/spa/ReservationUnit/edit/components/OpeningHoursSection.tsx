import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { AutoGrid } from "common/styled";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { IconLinkExternal } from "hds-react";
import React from "react";
import type { ReservationUnitEditQuery } from "@gql/gql-types";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

export function OpeningHoursSection({
  reservationUnit,
  previewUrlPrefix,
}: {
  // TODO can we simplify this by passing the hauki url only?
  reservationUnit: Node | undefined;
  previewUrlPrefix: string;
}) {
  const { t } = useTranslation(undefined, {
    keyPrefix: "ReservationUnitEditor",
  });

  const previewUrl = `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.extUuid}#calendar`;
  const previewDisabled = previewUrlPrefix === "" || !reservationUnit?.pk || !reservationUnit?.extUuid;

  return (
    <EditAccordion heading={t("openingHours")}>
      {reservationUnit?.haukiUrl ? (
        <AutoGrid $alignCenter>
          <p style={{ gridColumn: "1 / -1" }}>{t("openingHoursHelperTextHasLink")}</p>
          <ButtonLikeLink
            disabled={!reservationUnit?.haukiUrl}
            to={reservationUnit?.haukiUrl ?? ""}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
          <ButtonLikeLink
            disabled={previewDisabled}
            to={previewUrl}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("previewCalendarLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
        </AutoGrid>
      ) : (
        <p>{t("openingHoursHelperTextNoLink")}</p>
      )}
    </EditAccordion>
  );
}
