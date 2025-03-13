import {
  IconGroup,
  IconCheck,
  IconPlus,
  IconLinkExternal,
  Button,
  IconSize,
  ButtonSize,
  ButtonVariant,
  IconHome,
  IconLock,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import type { ReservationUnitCardFieldsFragment } from "@gql/gql-types";
import { getMainImage } from "@/modules/util";
import { getReservationUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card, { CardInfoItem } from "common/src/components/Card";
import { getReservationUnitPath } from "@/modules/urls";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type Node = ReservationUnitCardFieldsFragment;
interface CardProps {
  reservationUnit: Node;
  // TODO all of these are accessible from a hook but does that make testing more difficult?
  selectReservationUnit: (reservationUnit: Node) => void;
  containsReservationUnit: (reservationUnit: Node) => boolean;
  removeReservationUnit: (reservationUnit: Node) => void;
}

export function RecurringCard({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Readonly<CardProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const name = getReservationUnitName(reservationUnit);

  const unitName = reservationUnit.unit
    ? getTranslationSafe(reservationUnit.unit, "name", lang)
    : "-";

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  const infos: CardInfoItem[] = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: (
        <IconHome
          size={IconSize.Small}
          data-testid="reservation-unit-card__icon--home"
        />
      ),
      value: reservationUnitTypeName,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: <IconGroup size={IconSize.Small} />,
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }
  if (reservationUnit.currentAccessType) {
    infos.push({
      icon: (
        <IconLock
          aria-hidden="false"
          aria-label={t("reservationUnit:accessType")}
          size={IconSize.Small}
        />
      ),
      value: t(
        `reservationUnit:accessTypes.${reservationUnit.currentAccessType}`
      ),
    });
  }

  const isSelected = containsReservationUnit(reservationUnit);
  const toggleSelect = () => {
    if (isSelected) {
      removeReservationUnit(reservationUnit);
    } else {
      selectReservationUnit(reservationUnit);
    }
  };

  const buttons: JSX.Element[] = [];
  buttons.push(
    <Button
      size={ButtonSize.Small}
      variant={isSelected ? ButtonVariant.Primary : ButtonVariant.Secondary}
      iconEnd={isSelected ? <IconCheck /> : <IconPlus />}
      onClick={toggleSelect}
      data-testid="recurring-card__button--toggle"
      key={"common:selectReservationUnit"}
    >
      {isSelected
        ? t("common:removeReservationUnit")
        : t("common:selectReservationUnit")}
    </Button>
  );
  buttons.push(
    <ButtonLikeLink
      href={getReservationUnitPath(reservationUnit.pk)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="reservation-unit-card__button--show"
      key="show"
    >
      <IconLinkExternal />
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
