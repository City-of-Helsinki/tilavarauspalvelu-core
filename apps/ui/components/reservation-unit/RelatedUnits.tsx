import { IconArrowRight, IconEuroSign, IconGroup, IconHome } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import { H3 } from "common/styled";
import { breakpoints } from "common/src/const";
import type { RelatedUnitCardFieldsFragment } from "@gql/gql-types";
import { Carousel } from "../Carousel";
import { getActivePricing, getPriceString } from "@/modules/reservationUnit";
import { Card } from "common/src/components/Card";
import { ButtonLikeLink } from "common/src/components/ButtonLikeLink";
import { getImageSource, getMainImage } from "common/src/helpers";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";

type RelatedUnitsProps = {
  units: RelatedUnitCardFieldsFragment[];
  className?: string;
  style?: React.CSSProperties;
};

export function RelatedUnits({ units, style, className }: RelatedUnitsProps): JSX.Element | null {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const isWideMobile = useMedia(`(max-width: ${breakpoints.l})`, false);

  if (units.length === 0) {
    return null;
  }
  return (
    <div style={style} className={className}>
      <H3 as="h2" id="related-reservation-units">
        {t("reservationUnit:relatedReservationUnits")}
      </H3>
      <Carousel
        slidesToShow={isMobile ? 1 : isWideMobile ? 2 : 3}
        slidesToScroll={isMobile ? 1 : isWideMobile ? 2 : 3}
        wrapAround={false}
        hideCenterControls
        cellSpacing={24}
        frameAriaLabel={t("reservationUnit:relatedReservationUnits")}
      >
        {units.map((ru) => (
          <RelatedUnitCard key={ru.pk} reservationUnit={ru} />
        ))}
      </Carousel>
    </div>
  );
}

function RelatedUnitCard({ reservationUnit }: { reservationUnit: RelatedUnitCardFieldsFragment }): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const name = getTranslationSafe(reservationUnit, "name", lang);
  const unitName = getTranslationSafe(reservationUnit.unit ?? {}, "name", lang);
  const pricing = getActivePricing(reservationUnit);
  const unitPrice = pricing != null ? getPriceString({ t, pricing }) : undefined;
  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
      : undefined;
  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  const infos = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: <IconHome />,
      value: reservationUnitTypeName,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: <IconGroup />,
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }
  if (unitPrice) {
    infos.push({
      icon: <IconEuroSign aria-label={t("prices:reservationUnitPriceLabel")} aria-hidden="false" />,
      value: unitPrice,
    });
  }
  const buttons = [
    <ButtonLikeLink href={getReservationUnitPath(reservationUnit.pk)} key={reservationUnit.pk ?? 0}>
      {t("common:show")}
      <IconArrowRight />
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

export const RELATED_UNIT_CARD_FRAGMENT = gql`
  fragment RelatedUnitCardFields on ReservationUnitNode {
    ...OrderedReservationUnitCard
    reservationUnitType {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    maxPersons
    pricings {
      ...PricingFields
    }
  }
`;
