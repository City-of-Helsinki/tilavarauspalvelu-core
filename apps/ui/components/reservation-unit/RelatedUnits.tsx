import {
  IconArrowRight,
  IconGroup,
  IconHome,
  IconSize,
  IconTicket,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import type { RelatedReservationUnitsQuery } from "@gql/gql-types";
import { getMainImage } from "@/modules/util";
import Carousel from "../Carousel";
import { getActivePricing, getPriceString } from "@/modules/reservationUnit";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { getImageSource } from "common/src/helpers";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { getReservationUnitPath } from "@/modules/urls";
import { H3 } from "common";

type RelatedQueryT = NonNullable<
  RelatedReservationUnitsQuery["reservationUnits"]
>;
type RelatedEdgeT = NonNullable<RelatedQueryT>["edges"][0];
export type RelatedNodeT = NonNullable<NonNullable<RelatedEdgeT>["node"]>;
type PropsType = {
  units: RelatedNodeT[];
  className?: string;
  style?: React.CSSProperties;
};

export function RelatedUnits({
  units,
  style,
  className,
}: PropsType): JSX.Element | null {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const isWideMobile = useMedia(`(max-width: ${breakpoints.l})`, false);

  if (units.length === 0) {
    return null;
  }
  return (
    <div style={style} className={className}>
      <H3 as="h2">{t("reservationUnit:relatedReservationUnits")}</H3>
      <Carousel
        slidesToShow={isMobile ? 1 : isWideMobile ? 2 : 3}
        slidesToScroll={isMobile ? 1 : isWideMobile ? 2 : 3}
        wrapAround={false}
        hideCenterControls
        cellSpacing={24}
      >
        {units.map((ru) => (
          <RelatedUnitCard key={ru.pk} reservationUnit={ru} />
        ))}
      </Carousel>
    </div>
  );
}

function RelatedUnitCard({
  reservationUnit,
}: {
  reservationUnit: RelatedNodeT;
}): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const name = getTranslationSafe(reservationUnit, "name", lang);
  const unitName = getTranslationSafe(reservationUnit.unit ?? {}, "name", lang);
  const pricing = getActivePricing(reservationUnit);
  const unitPrice =
    pricing != null ? getPriceString({ t, pricing }) : undefined;
  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
      : undefined;
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const infos = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: <IconHome size={IconSize.Small} />,
      value: reservationUnitTypeName,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: (
        <IconGroup
          aria-label={t("reservationUnitCard:maxPersons", {
            maxPersons: reservationUnit.maxPersons,
          })}
        />
      ),
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }
  if (unitPrice) {
    infos.push({
      icon: <IconTicket aria-label={t("prices:reservationUnitPriceLabel")} />,
      value: unitPrice,
    });
  }
  const buttons = [
    <ButtonLikeLink
      href={getReservationUnitPath(reservationUnit.pk)}
      key={reservationUnit.pk ?? 0}
    >
      {t("common:show")}
      <IconArrowRight aria-hidden="true" />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      variant="vertical"
      key={reservationUnit.pk}
      heading={name ?? ""}
      text={unitName}
      infos={infos}
      buttons={buttons}
      imageSrc={imgSrc}
    />
  );
}
