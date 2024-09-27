import {
  IconGroup,
  IconCheck,
  IconPlus,
  IconLinkExternal,
  Button,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import styled from "styled-components";
import { fontMedium } from "common/src/common/typography";
import type { ReservationUnitCardFieldsFragment } from "@gql/gql-types";
import { getMainImage, getTranslation } from "@/modules/util";
import { reservationUnitPrefix } from "@/modules/const";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";

type Node = ReservationUnitCardFieldsFragment;
interface IProps {
  reservationUnit: Node;
  selectReservationUnit: (reservationUnit: Node) => void;
  containsReservationUnit: (reservationUnit: Node) => boolean;
  removeReservationUnit: (reservationUnit: Node) => void;
}

/* TODO something is overriding button font-family to be bold */
const StyledButton = styled(Button).attrs({ size: "small" })`
  && {
    ${fontMedium}
  }
`;

export function ReservationUnitCard({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: IProps): JSX.Element {
  const { t, i18n } = useTranslation();

  const name = getReservationUnitName(reservationUnit);

  const localeString = i18n.language === "fi" ? "" : `/${i18n.language}`;
  const link = `${localeString}${reservationUnitPrefix}/${reservationUnit.pk}`;

  const unitName = reservationUnit.unit
    ? getUnitName(reservationUnit.unit)
    : "-";

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name")
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

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
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: (
        <IconGroup
          aria-label={t("reservationUnitCard:maxPersons", {
            maxPersons: reservationUnit.maxPersons,
          })}
          size="s"
        />
      ),
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }

  const buttons = [];
  if (containsReservationUnit(reservationUnit)) {
    buttons.push(
      <StyledButton
        iconRight={<IconCheck aria-hidden />}
        onClick={() => removeReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:removeReservationUnit")}
      >
        {t("common:removeReservationUnit")}
      </StyledButton>
    );
  } else {
    buttons.push(
      <StyledButton
        variant="secondary"
        iconRight={<IconPlus aria-hidden />}
        onClick={() => selectReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:selectReservationUnit")}
      >
        {t("common:selectReservationUnit")}
      </StyledButton>
    );
  }
  buttons.push(
    <StyledButton
      variant="secondary"
      iconRight={<IconLinkExternal aria-hidden />}
      onClick={() => window.open(link, "_blank")}
      data-testid="reservation-unit-card__button--link"
      key={t("reservationUnitCard:seeMore")}
    >
      {t("reservationUnitCard:seeMore")}
    </StyledButton>
  );

  return (
    <Card
      imageSrc={imgSrc}
      heading={name ?? ""}
      text={unitName ?? ""}
      infos={infos}
      buttons={buttons}
    />
  );
}
