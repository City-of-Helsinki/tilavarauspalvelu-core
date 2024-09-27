import { IconArrowRight, IconGroup, IconTicket } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import styled from "styled-components";
import { useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import type { RelatedReservationUnitsQuery } from "@gql/gql-types";
import { reservationUnitPath } from "@/modules/const";
import { getMainImage, getTranslation } from "@/modules/util";
import Carousel from "../Carousel";
import {
  getActivePricing,
  getPriceString,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";

type RelatedQueryT = NonNullable<
  RelatedReservationUnitsQuery["reservationUnits"]
>;
type RelatedEdgeT = NonNullable<RelatedQueryT>["edges"][0];
export type RelatedNodeT = NonNullable<NonNullable<RelatedEdgeT>["node"]>;
type PropsType = {
  units: RelatedNodeT[];
};

const StyledCarousel = styled(Carousel)`
  &&& {
    /* Make room for the Carousel controls */
    margin: 0 auto !important;
    width: calc(100% - 60px) !important;
  }
  .slider-list {
    cursor: default !important;
  }
`;

function RelatedUnits({ units }: PropsType): JSX.Element | null {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const isWideMobile = useMedia(`(max-width: ${breakpoints.l})`, false);

  if (units.length === 0) {
    return null;
  }
  return (
    <StyledCarousel
      slidesToShow={isMobile ? 1 : isWideMobile ? 2 : 3}
      slidesToScroll={isMobile ? 1 : isWideMobile ? 2 : 3}
      wrapAround={false}
      hideCenterControls
      cellSpacing={24}
    >
      {units.map((unit) => {
        const name = getReservationUnitName(unit);
        const pricing = getActivePricing(unit);
        const unitPrice =
          pricing != null ? getPriceString({ pricing }) : undefined;
        const reservationUnitTypeName =
          unit.reservationUnitType != null
            ? getTranslation(unit.reservationUnitType, "name")
            : undefined;
        const img = getMainImage(unit);
        const imgSrc = getImageSource(img, "medium");
        const infos = [];
        if (reservationUnitTypeName) {
          infos.push({
            icon: (
              <NextImage
                src="/icons/icon_premises.svg"
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            ),
            value: reservationUnitTypeName,
          });
        }
        if (unit.maxPersons) {
          infos.push({
            icon: (
              <IconGroup
                aria-label={t("reservationUnitCard:maxPersons", {
                  maxPersons: unit.maxPersons,
                })}
              />
            ),
            value: t("reservationUnitCard:maxPersons", {
              count: unit.maxPersons,
            }),
          });
        }
        if (unitPrice) {
          infos.push({
            icon: (
              <IconTicket aria-label={t("prices:reservationUnitPriceLabel")} />
            ),
            value: unitPrice,
          });
        }
        const buttons = [
          <ButtonLikeLink
            href={reservationUnitPath(unit.pk ?? 0)}
            key={unit.pk ?? 0}
          >
            {t("reservationUnitCard:seeMore")}
            <IconArrowRight aria-hidden="true" />
          </ButtonLikeLink>,
        ];
        return (
          <Card
            variant="vertical"
            key={unit.pk}
            heading={name ?? ""}
            text={getUnitName(unit.unit) ?? ""}
            infos={infos}
            buttons={buttons}
            imageSrc={imgSrc}
          />
        );
      })}
    </StyledCarousel>
  );
}

export default RelatedUnits;
