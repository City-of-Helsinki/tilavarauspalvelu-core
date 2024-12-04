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
import type { ReservationUnitCardFieldsFragment } from "@gql/gql-types";
import { getMainImage, getTranslation } from "@/modules/util";
import { getReservationUnitName, getUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import { getReservationUnitPath } from "@/modules/urls";
import { ButtonLikeLink } from "../common/ButtonLikeLink";

type Node = ReservationUnitCardFieldsFragment;
interface CardProps {
  reservationUnit: Node;
  selectReservationUnit: (reservationUnit: Node) => void;
  containsReservationUnit: (reservationUnit: Node) => boolean;
  removeReservationUnit: (reservationUnit: Node) => void;
}

export function ReservationUnitCard({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: CardProps): JSX.Element {
  const { t } = useTranslation();

  const name = getReservationUnitName(reservationUnit);

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
      <Button
        size="small"
        variant="primary"
        iconRight={<IconCheck aria-hidden />}
        onClick={() => removeReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:removeReservationUnit")}
      >
        {t("common:removeReservationUnit")}
      </Button>
    );
  } else {
    buttons.push(
      <Button
        size="small"
        variant="secondary"
        iconRight={<IconPlus aria-hidden />}
        onClick={() => selectReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:selectReservationUnit")}
      >
        {t("common:selectReservationUnit")}
      </Button>
    );
  }
  buttons.push(
    <ButtonLikeLink
      href={getReservationUnitPath(reservationUnit.pk)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="reservation-unit-card__button--link"
      key="show"
    >
      <IconLinkExternal aria-hidden />
      {t("common:show")}
    </ButtonLikeLink>
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
